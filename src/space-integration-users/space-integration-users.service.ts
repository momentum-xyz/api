import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MqttService } from '../services/mqtt.service';
import { SpaceIntegrationUserStatus } from './space-integration-users.interface';
import { SpaceIntegrationUser, SpaceIntegrationUserData } from './space-integration-users.entity';
import { User } from '../user/user.entity';
import { SpaceIntegration } from '../space-integrations/space-integrations.entity';

@Injectable()
export class SpaceIntegrationUsersService {
  constructor(
    @InjectRepository(SpaceIntegrationUser)
    private readonly spaceIntegrationUserRepository: Repository<SpaceIntegrationUser>,
    private client: MqttService,
  ) {}

  async create(spaceIntegrationUser: SpaceIntegrationUser): Promise<SpaceIntegrationUser> {
    return await this.spaceIntegrationUserRepository.query(
      'INSERT INTO space_integration_users (spaceId, userId, integrationTypeId, data, flag) VALUES (?, ?, ?, ?, ?)',
      [
        spaceIntegrationUser.spaceId,
        spaceIntegrationUser.userId,
        spaceIntegrationUser.integrationTypeId,
        JSON.stringify(spaceIntegrationUser.data),
        spaceIntegrationUser.flag,
      ],
    );
  }

  async delete(spaceIntegrationUser: SpaceIntegrationUser): Promise<SpaceIntegrationUser> {
    return await this.spaceIntegrationUserRepository.query(
      'DELETE FROM space_integration_users WHERE spaceId = ? AND userId = ? AND integrationTypeId = ?',
      [spaceIntegrationUser.spaceId, spaceIntegrationUser.userId, spaceIntegrationUser.integrationTypeId],
    );
  }

  async createOrUpdate(spaceIntegration: SpaceIntegration, user: User, data: SpaceIntegrationUserData, flag: number) {
    await this.spaceIntegrationUserRepository.query(
      `INSERT INTO space_integration_users (spaceId, userId, integrationTypeId, data, flag)
      VALUES (?, ?, ?, ?, ?)  AS new
      ON DUPLICATE KEY UPDATE data=new.data, flag=new.flag
      `,
      [spaceIntegration.spaceId, user.id, spaceIntegration.integrationTypeId, JSON.stringify(data), flag],
    );
    return await this.findDistinct(spaceIntegration, user);
  }

  async updateStatus(spaceIntegrationUser: SpaceIntegrationUser): Promise<void> {
    await this.spaceIntegrationUserRepository.query(
      'UPDATE space_integration_users SET flag = ? WHERE spaceId = ? AND userId = ? AND integrationTypeId = ?',
      [
        spaceIntegrationUser.flag,
        spaceIntegrationUser.spaceId,
        spaceIntegrationUser.userId,
        spaceIntegrationUser.integrationTypeId,
      ],
    );
  }

  async updateData(spaceIntegrationUser: SpaceIntegrationUser): Promise<void> {
    await this.spaceIntegrationUserRepository.query(
      'UPDATE space_integration_users SET data = ? WHERE spaceId = ? AND userId = ? AND integrationTypeId = ?',
      [
        JSON.stringify(spaceIntegrationUser.data),
        spaceIntegrationUser.spaceId,
        spaceIntegrationUser.userId,
        spaceIntegrationUser.integrationTypeId,
      ],
    );
  }

  async findWhereSpace(spaceIntegration: SpaceIntegration): Promise<SpaceIntegrationUser[]> {
    return await this.spaceIntegrationUserRepository.find({
      where: {
        spaceIntegration: spaceIntegration,
      },
      relations: ['spaceIntegration', 'user'],
    });
  }

  async findDistinct(spaceIntegration: SpaceIntegration, user: User): Promise<SpaceIntegrationUser> {
    return await this.spaceIntegrationUserRepository.findOne({
      where: {
        spaceIntegration: spaceIntegration,
        user: user,
      },
      relations: ['spaceIntegration', 'user'],
    });
  }

  async findWhereUser(user: User): Promise<SpaceIntegrationUser[]> {
    return await this.spaceIntegrationUserRepository.find({
      where: {
        user: user,
        flag: SpaceIntegrationUserStatus.JOINED,
      },
      relations: ['spaceIntegration'],
    });
  }
  async findAllWhereUserAndIntegration(
    spaceIntegration: SpaceIntegration,
    user: User,
    limit = false,
  ): Promise<SpaceIntegrationUser[]> {
    let options;
    options = {
      where: {
        spaceIntegration: spaceIntegration,
        user: user,
      },
      relations: ['spaceIntegration', 'user'],
    };

    if (limit) {
      options = { ...options, limit: 6 };
    }

    return await this.spaceIntegrationUserRepository.find({ ...options });
  }
}
