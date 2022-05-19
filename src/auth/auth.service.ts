import { HttpService, Injectable, NotFoundException } from '@nestjs/common';
import { bytesToUuid, ethToBytes, uuidToBytes } from '../utils/uuid-converter';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { Invitation } from '../invitation/invitation.entity';
import { UserSpace } from '../user-space/user-space.entity';
import { UserSpaceService } from '../user-space/user-space.service';
import { InvitationService } from '../invitation/invitation.service';
import { UserTypeService } from '../user-type/user-type.service';
import { TokenInterface } from './auth.interface';
import { UserWallet } from '../user-wallet/user-wallet.entity';
import { Network, NetworkType } from '../network/network.entity';
import { NetworkService } from '../network/network.service';
import { UserWalletService } from '../user-wallet/user-wallet.service';
import { UserTypes } from '../user-type/user-type.interface';
import { OIDCService } from './oidc/oidc.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class AuthService {
  constructor(
    private httpService: HttpService,
    private userService: UserService,
    private userSpaceService: UserSpaceService,
    private userTypeService: UserTypeService,
    private userWalletService: UserWalletService,
    private oidcService: OIDCService,
    private networkService: NetworkService,
    private invitationService: InvitationService,
    private eventEmitter: EventEmitter2,
  ) {}

  async getIdFromToken(request: TokenInterface, tokenObject: any): Promise<Buffer> {
    let savedUser: User;
    const issuer = request.user.iss;

    const foundUser: User = await this.userService.findOne(uuidToBytes(request.user.sub));
    const decoded: any = await this.oidcService.decodeJWT(tokenObject.idToken);
    const guestUser = decoded.payload.guest;

    if (!foundUser) {
      const user: User = new User();
      user.id = uuidToBytes(request.user.sub);

      user.name = request.user.name ?? '';
      user.email = request.user.email ?? '';

      if (issuer === process.env.OIDC_WEB3_URL && !guestUser) {
        user.userType = await this.userTypeService.findOne(UserTypes.USER);
        const result = await this.oidcService.validateIDToken(tokenObject.idToken);

        if (result) {
          const payload = result.payload;

          if (!payload.web3_address) {
            throw new NotFoundException('Token does not contain a web3 address');
          }

          // What web3-idp sends us as types can be different from our DB network names,
          // so make sure we don't just blindly use it here.
          // Currently we only support 2, so we can do:
          const networkName = payload.web3_type == 'polkadot' ? NetworkType.POLKADOT : NetworkType.ETH_MAINNET;
          const network: Network = await this.networkService.getOrCreate(networkName);

          savedUser = await this.userService.create(user);

          const userWallet: UserWallet = new UserWallet();
          userWallet.user = savedUser;
          userWallet.network = network;
          userWallet.wallet = ethToBytes(payload.web3_address);
          await this.userWalletService.create(userWallet);

          this.eventEmitter.emit('new_kusama_user', payload.web3_address);
        }
      } else if (issuer === process.env.OIDC_WEB3_URL && guestUser) {
        user.userType = await this.userTypeService.findOne(UserTypes.TEMPORARY_USER);
        await this.oidcService.validateIDToken(tokenObject.idToken);
        savedUser = await this.userService.create(user);
      } else {
        user.userType = await this.userTypeService.findOne(UserTypes.USER);
        savedUser = await this.userService.create(user);
      }

      request.user.name ? console.debug('User created (kc)') : console.debug('User created (web3)');

      await this.checkInvitation(request, savedUser);

      this.eventEmitter.emit('user_authorised', bytesToUuid(savedUser.id));
      return savedUser.id;
    }

    this.eventEmitter.emit('user_authorised', bytesToUuid(foundUser.id));
    return foundUser.id;
  }

  async checkInvitation(userRequest: TokenInterface, user: User): Promise<void> {
    // Check for invitation, and assign role
    const invitation: Invitation = await this.invitationService.findOneByEmail(userRequest.user.email);

    if (invitation) {
      const userSpace: UserSpace = new UserSpace();
      userSpace.space = invitation.space;
      userSpace.isAdmin = invitation.isAdmin;
      userSpace.user = user;

      const savedUserProject: UserSpace = await this.userSpaceService.create(userSpace);

      if (savedUserProject) {
        await this.invitationService.delete(invitation);
      }
    }
  }
}
