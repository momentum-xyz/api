import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MqttService } from '../../services/mqtt.service';
import { Stat } from './stat.entity';
import { bytesToUuid, uuidToBytes } from '../../utils/uuid-converter';
import { SpaceService } from '../space.service';
import { SpaceTypeService } from '../../space-type/space-type.service';
import { ISpaceType } from '../../space-type/space-type.interface';
import { UserService } from '../../user/user.service';
import { OnlineUserService } from '../../online-user/online-user.service';
import { HighFiveService } from '../../high-five/high-five.service';
import { EventsService } from '../../events/events.service';
import { WorldDefinitionService } from '../../world-definition/world-definition.service';
import { WorldDefinition } from '../../world-definition/world-definition.entity';
import { Queryable } from '../../reflector/interfaces';

export interface KusamaSessionStat {
  currentSessionIndex: number;
  currentEra: number;
  totalRewardPointsInEra: string;
  currentSlotInSession: number;
  slotsPerSession: number;
  currentSlotInEra: number;
  slotsPerEra: number;
  sessionsPerEra: number;
  activeEraStart: number;
  slotDuration: number;
}

export interface KusamaEraStat {
  activeEra: number;
  activeValidators: number;
  candidateValidators: number;
  totalStakeInEra: string;
  lastEraReward: string;
}

@Injectable()
export class StatService implements OnModuleInit {
  constructor(
    @InjectRepository(Stat)
    private readonly statRepository: Repository<Stat>,
    private eventsService: EventsService,
    private mqttService: MqttService,
    private spaceService: SpaceService,
    private userService: UserService,
    private onlineUserService: OnlineUserService,
    private highFiveService: HighFiveService,
    private spaceTypeService: SpaceTypeService,
    private worldDefinitionService: WorldDefinitionService,
  ) {}

  onModuleInit() {
    this.mqttService.client.subscribe('harvester/kusama/#').on('message', async (topic, payload) => {
      if (topic === 'harvester/kusama/session' || topic === 'harvester/kusama/era') {
        const kusamaSessionStat: KusamaSessionStat = JSON.parse(payload.toString());
        await this.updateStats(kusamaSessionStat);
      }
    });
  }

  async updateStats(stats: KusamaSessionStat | KusamaEraStat) {
    const entries = Object.entries(stats);

    for (const [key, value] of entries) {
      const statName = await this.getStatName(key);
      const stat: Stat = await this.findByName(statName);

      if (stat) {
        stat.value = await this.parseValue(key, value, entries);
        await this.updateStat(stat);
      } else {
        const stat: Stat = new Stat();
        stat.name = statName;
        stat.value = await this.parseValue(key, value, entries);
        stat.columnId = 1;

        await this.createStat(stat);
      }
    }
  }

  async getStatName(key: string): Promise<string> {
    switch (key) {
      case 'totalRewardPointsInEra' || 'Reward Points':
        return 'Reward Points';
      case 'activeValidators' || 'Active Validators':
        return 'Active Validators';
      case 'candidateValidators' || 'Validators Waiting':
        return 'Validators Waiting';
      case 'totalStakeInEra' || 'Total Stake in Era':
        return 'Total Stake in Era';
      case 'lastEraReward' || 'Last Reward':
        return 'Last Reward';
      case 'activeEraStart' || 'Era (6 Hours)':
        return 'Era (6 Hours)';
      case 'slotDuration' || 'Epoch (1 Hour)':
        return 'Epoch (1 Hour)';
      case 'currentSlotInSession' || 'Epoch Progress':
        return 'Epoch Progress';
      case 'currentSlotInEra' || 'Era Progress':
        return 'Era Progress';
      default:
        return key;
    }
  }

  async parseValue(initialKey: string, initialValue: any, entries: any): Promise<string> {
    switch (initialKey) {
      case 'totalRewardPointsInEra' || 'Reward Points':
        return this.replaceCommaSeparators(initialValue);
      case 'activeValidators' || 'Validators Waiting':
        return initialValue + ' / 1000';
      case 'totalStakeInEra' || 'Total Stake in Era':
        const parsed: string = this.replaceCommaSeparators(initialValue);
        return parsed;
      case 'activeEraStart' || 'Era (6 Hours)':
        const slotsPerEra = entries.filter((entry) => entry[0] === 'slotsPerEra');
        const slotDuration = entries.filter((entry) => entry[0] === 'slotDuration');
        const parsedSlotsPerEra = Number(slotsPerEra[0][1]);
        const parsedSlotDuration = Number(slotDuration[0][1]);
        const currentSlotInEra = entries.filter((entry) => entry[0] === 'currentSlotInEra');
        const parsedCurrentSlotInEra = Number(currentSlotInEra[0][1]);
        const activeEraStartReturn = (parsedSlotsPerEra - parsedCurrentSlotInEra) * Number(parsedSlotDuration);
        return activeEraStartReturn.toString();
      case 'slotDuration' || 'Epoch (1 Hour)':
        const slotsPerSession = entries.filter((entry) => entry[0] === 'slotsPerSession');
        const parsedSlotsPerSession = Number(slotsPerSession[0][1]);
        const currentSlotInSession = entries.filter((entry) => entry[0] === 'currentSlotInSession');
        const parsedCurrentSlotInSession = Number(currentSlotInSession[0][1]);
        const slotDurationReturn = (parsedSlotsPerSession - parsedCurrentSlotInSession) * Number(initialValue);
        return slotDurationReturn.toString();
      case 'currentSlotInSession' || 'Epoch Progress':
        const slotsPerSession2 = entries.filter((entry) => entry[0] === 'slotsPerSession');
        const parsedSlotsPerSession2 = Number(slotsPerSession2[0][1]);
        const currentSlotInSessionReturn = (Number(initialValue) / parsedSlotsPerSession2) * 100;
        return Math.round(currentSlotInSessionReturn).toString();
      case 'currentSlotInEra' || 'Era Progress':
        const slotsPerEra2 = entries.filter((entry) => entry[0] === 'slotsPerEra');
        const parsedSlotsPerEra2 = Number(slotsPerEra2[0][1]);
        const currentSlotInEraReturn = (Number(initialValue) / parsedSlotsPerEra2) * 100;
        return Math.round(currentSlotInEraReturn).toString();
      case 'lastEraReward' || 'Last Reward':
        return this.replaceCommaSeparators(initialValue);
      default:
        return initialValue.toString();
    }
  }

  private replaceCommaSeparators(value: any): string {
    return value.toString().replace(/,/g, '');
  }

  async updateStat(stat: Stat) {
    await this.statRepository.query('UPDATE stats SET `columnId` = ?, `value` = ?, `name` = ? WHERE name = ?', [
      stat.columnId,
      stat.value,
      stat.name,
      stat.name,
    ]);
  }

  async getKusamaWorldId(conn: Queryable): Promise<string> {
    const sql = `
        SELECT BIN_TO_UUID(id) AS spaceId
        FROM world_definition
        WHERE JSON_EXTRACT(config, '$.kind') = "Kusama";
    `;

    const rows = await conn.query(sql);

    if (rows.length === 0) {
      throw new Error('Can not find worldId by Kusama world_definitions table');
    }

    return rows[0].spaceId;
  }

  async createStat(stat: Stat) {
    const worldId: string = await this.getKusamaWorldId(this.statRepository);

    await this.statRepository.query('INSERT INTO stats (`worldId`, `name`, `value`, `columnId`) VALUES (?, ?, ?, ?)', [
      uuidToBytes(worldId),
      stat.name,
      stat.value,
      stat.columnId,
    ]);
  }

  findByName(name: string): Promise<Stat> {
    return this.statRepository.findOne({
      where: {
        name: name,
      },
    });
  }

  findColumn(columnId: number): Promise<Stat[]> {
    return this.statRepository.find({
      where: {
        columnId: columnId,
      },
    });
  }

  async generateColumnOne(worldId: Buffer): Promise<any[]> {
    const operatorSpaceType = await this.spaceTypeService.findOne(ISpaceType.OPERATOR);
    const validatorSpaceType = await this.spaceTypeService.findOne(ISpaceType.VALIDATOR_NODE);
    const operatorAmount = await this.spaceService.findAllByVisibleType(operatorSpaceType, 1);

    const worldDefinition: WorldDefinition = await this.worldDefinitionService.getByWorldId(worldId);

    const validatorAmount = await this.spaceService.findAllByTypeWithParent(
      validatorSpaceType,
      uuidToBytes(worldDefinition.config.spaces.validator_cloud),
    );

    const totalUsers: number = await this.userService.findCount();
    const totalOnlineUsers: number = await this.onlineUserService.findCount(worldId);

    const totalHighFives: number = await this.highFiveService.findCount();

    const totalEvents: number = await this.eventsService.getAllCount();
    const totalPastEvents: number = await this.eventsService.getAllPastCount();

    return [
      {
        worldId: bytesToUuid(worldId),
        columnId: 0,
        name: 'AMOUNT OF OPERATORS',
        value: operatorAmount.length.toString(),
      },
      {
        worldId: bytesToUuid(worldId),
        columnId: 0,
        name: 'CONNECTED VALIDATOR NODES',
        value: validatorAmount.length.toString(),
      },
      {
        worldId: bytesToUuid(worldId),
        columnId: 0,
        name: 'REGISTERED USERS',
        value: totalUsers.toString(),
      },
      {
        worldId: bytesToUuid(worldId),
        columnId: 0,
        name: 'ONLINE USERS',
        value: totalOnlineUsers.toString(),
      },
      {
        worldId: bytesToUuid(worldId),
        columnId: 0,
        name: `NUMBER OF HIGH 5'S GIVEN`,
        value: totalHighFives.toString(),
      },
      {
        worldId: bytesToUuid(worldId),
        columnId: 0,
        name: `MEETINGS PLANNED`,
        value: totalEvents.toString(),
      },
      {
        worldId: bytesToUuid(worldId),
        columnId: 0,
        name: `MEETINGS HELD`,
        value: totalPastEvents.toString(),
      },
    ];
  }
}
