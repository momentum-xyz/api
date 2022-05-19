import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { bytesToEth, bytesToUuid, ethToBytes, generateUuid, uuidToBytes } from '../../utils/uuid-converter';
import { DeleteResult, getManager, Like, Repository, UpdateResult } from 'typeorm';
import { TokenRule, TokenRuleStatus } from './token-rule.entity';
import { PermissionUpdate, TokenRuleMqttDto } from './token-rule.interface';
import { MqttService } from '../../services/mqtt.service';
import { UserMembershipService } from '../../user-membership/user-membership.service';
import { User } from '../../user/user.entity';
import { UserTypeService } from '../../user-type/user-type.service';
import { UserService } from '../../user/user.service';
import { UserSpace } from '../../user-space/user-space.entity';
import { Space } from '../../space/space.entity';
import { UserSpaceService } from '../../user-space/user-space.service';
import { UserWalletService } from '../../user-wallet/user-wallet.service';
import { SUPPORTED_NETWORKS } from '../token/token.controller';
import { NetworkType } from '../../network/network.entity';

/**
 * Default list of relation to query.
 */
const DEFAULT_RELATIONS = ['token', 'token.network', 'user', 'tokenGroupUser'];

@Injectable()
export class TokenRuleService implements OnModuleInit {
  constructor(
    @InjectRepository(TokenRule)
    private readonly tokenRuleRepository: Repository<TokenRule>,
    private readonly userService: UserService,
    private readonly userTypeService: UserTypeService,
    private readonly userSpaceService: UserSpaceService,
    private readonly userWalletService: UserWalletService,
    private readonly userMembershipService: UserMembershipService,
    private mqttService: MqttService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.publishActiveTokenRules();
    await this.publishActiveUserAccounts();
    this.mqttService.client.subscribe('token-service/permissions').on('message', (topic, payload) => {
      if (topic != 'token-service/permissions') {
        return;
      }
      const permissionUpdate: PermissionUpdate = this.mqttDtoToPermissionUpdate(JSON.parse(payload.toString()));
      this.processPermissionUpdate(permissionUpdate);
    });
  }

  findAll(): Promise<TokenRule[]> {
    return this.tokenRuleRepository.find({
      relations: DEFAULT_RELATIONS,
    });
  }

  findPending(): Promise<TokenRule[]> {
    return this.tokenRuleRepository.find({
      where: {
        status: TokenRuleStatus.REQUESTED,
      },
      relations: DEFAULT_RELATIONS,
    });
  }

  find(query: any): Promise<TokenRule[]> {
    return this.tokenRuleRepository.find({ where: query, relations: DEFAULT_RELATIONS });
  }

  findOne(id: Buffer): Promise<TokenRule> {
    return this.tokenRuleRepository.findOne({
      where: { id: id },
      relations: DEFAULT_RELATIONS,
    });
  }

  findByTokenGroupUser(tokenGroupUser: User): Promise<TokenRule[]> {
    return this.tokenRuleRepository.find({
      where: { tokenGroupUser: tokenGroupUser },
      relations: DEFAULT_RELATIONS,
    });
  }

  async publishActiveTokenRules() {
    const tokenRules = await this.findAll();
    const tokenRuleMessages = tokenRules.map((tr) => this.mapTokenRuleToTokenRuleMqttDto(tr, true));
    await this.mqttService.publishActiveTokenRules(tokenRuleMessages);
  }

  async publishActiveUserAccounts() {
    const userAccounts = await this.userWalletService.findAll();
    const accountAddresses = userAccounts
      .filter((uW) => SUPPORTED_NETWORKS.includes(uW.network.name as NetworkType))
      .map((uW) => bytesToEth(uW.wallet));
    await this.mqttService.publishActiveUsers(accountAddresses);
  }

  async processPermissionUpdate(permissionUpdate: PermissionUpdate) {
    const user = await this.userService.findByWalletAddress(ethToBytes(permissionUpdate.accountAddress));
    const tokenRule = await this.tokenRuleRepository.findOne({
      where: { id: uuidToBytes(permissionUpdate.ruleUUID) },
      relations: ['tokenGroupUser'],
    });

    if (permissionUpdate.active) {
      await this.userMembershipService.addUserToTokenRuleGroup(tokenRule.tokenGroupUser, user);
    } else {
      const userMembership = await this.userMembershipService.findOne(tokenRule.tokenGroupUser, user);
      await this.userMembershipService.removeUserFromTokenRuleGroup(userMembership);
    }
  }

  private mqttDtoToPermissionUpdate(o: any): PermissionUpdate {
    const ruleUuid = Object.keys(o)[1];
    return {
      accountAddress: o.accountAddress,
      ruleUUID: ruleUuid,
      active: o[ruleUuid],
    };
  }

  async create(tokenRule: TokenRule, space: Space): Promise<TokenRule> {
    const userType = await this.userTypeService.findOne(TokenRule.USER_TYPE_COLUMN_NAME);

    const tokenGroupUser: User = new User();
    tokenGroupUser.id = generateUuid();
    tokenGroupUser.name = tokenRule.name;
    tokenGroupUser.email = 'TokenGroupUser';
    tokenGroupUser.userTypeId = userType.id;
    tokenRule.tokenGroupUser = await this.userService.create(tokenGroupUser);

    const savedTokenRule = await this.tokenRuleRepository.save(tokenRule);

    if (savedTokenRule) {
      const userSpace: UserSpace = new UserSpace();
      userSpace.user = tokenGroupUser;
      userSpace.space = space;
      userSpace.isAdmin = false;

      const savedUserSpace: UserSpace = await this.userSpaceService.create(userSpace);

      if (savedUserSpace) {
        await this.mqttService.publishTokenRuleUpdate(this.mapTokenRuleToTokenRuleMqttDto(tokenRule, true));
        return savedTokenRule;
      }
    }
  }

  async filter(query: string): Promise<TokenRule[]> {
    return this.tokenRuleRepository.find({
      order: { name: 'ASC' },
      where: [{ name: Like(`%${query}%`) }],
      relations: DEFAULT_RELATIONS,
    });
  }

  async filterApproved(query: string): Promise<TokenRule[]> {
    return this.tokenRuleRepository.find({
      order: { name: 'ASC' },
      where: [{ name: Like(`%${query}%`), status: TokenRuleStatus.APPROVED }],
      relations: DEFAULT_RELATIONS,
    });
  }

  async delete(tokenRule: TokenRule): Promise<DeleteResult> {
    const tokenGroupUser = tokenRule.tokenGroupUser;
    const tokenRuleMqtt = this.mapTokenRuleToTokenRuleMqttDto(tokenRule, false);
    const deleteResult: DeleteResult = await this.tokenRuleRepository.query('DELETE FROM token_rules WHERE id = ?', [
      tokenRule.id,
    ]);

    await this.userService.deleteTokenGroupUser(tokenGroupUser);
    await this.mqttService.publishTokenRuleUpdate(tokenRuleMqtt);

    return deleteResult;
  }

  async updateStatus(tokenRule: TokenRule): Promise<UpdateResult> {
    return this.tokenRuleRepository.query('UPDATE token_rules SET status = ? WHERE id = ?', [
      tokenRule.status,
      tokenRule.id,
    ]);
  }

  private mapTokenRuleToTokenRuleMqttDto(tr: TokenRule, active: boolean): TokenRuleMqttDto {
    return {
      id: bytesToUuid(tr.id),
      active: active,
      network: tr.token.network, // network is 'moonbeam' or 'eth_mainnet'
      token: {
        type: tr.token.tokenType,
        address: bytesToEth(tr.token.contractAddress),
        token_id: tr.token.tokenCategoryId,
      },
      requirements: {
        minimum_balance: tr.rule.minBalance,
      },
    };
  }
}
