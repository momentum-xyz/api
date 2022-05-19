import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { MqttService } from '../services/mqtt.service';
import { bytesToUuid, uuidToBytes } from '../utils/uuid-converter';
import { Space } from '../space/space.entity';
import { UserSpace } from './user-space.entity';
import { User } from '../user/user.entity';

@Injectable()
export class UserSpaceService {
  constructor(
    @InjectRepository(UserSpace)
    private readonly userSpaceRepository: Repository<UserSpace>,
    private client: MqttService,
  ) {}

  async findOne(userSpaceId: Buffer): Promise<UserSpace> {
    return this.userSpaceRepository.findOne({
      where: {
        id: userSpaceId,
      },
      relations: ['space', 'user'],
    });
  }

  async allUsersInSpace(space: Space): Promise<UserSpace[]> {
    return this.userSpaceRepository.find({
      where: {
        space: space,
      },
      relations: ['user', 'user.userType'],
    });
  }

  async findUserInSpace(space: Space, user: User): Promise<UserSpace> {
    return this.userSpaceRepository.findOne({
      where: {
        space: space,
        user: user,
      },
      relations: ['space', 'space.spaceType', 'user'],
    });
  }

  async findAllForUserAdmin(user: User): Promise<UserSpace[]> {
    return this.userSpaceRepository.find({
      where: {
        user: user,
        isAdmin: true,
      },
      relations: ['space', 'space.spaceType', 'user'],
    });
  }

  async findAssociatedInitiatives(user: User, validTypes: Buffer[]): Promise<UserSpace[]> {
    const userSpaces = await this.userSpaceRepository.find({
      where: {
        user: user,
      },
      relations: ['space'],
    });

    return userSpaces.filter(
      (userSpace) =>
        userSpace.space.spaceTypeId.equals(validTypes[0]) || userSpace.space.spaceTypeId.equals(validTypes[1]),
    );
  }

  async isAdmin(space: Space, user: User): Promise<boolean> {
    const raw = await this.userSpaceRepository.query('call GetSpaceAdmins(?);', [space.id]);
    const userIds = raw[0].map((item) => {
      return Buffer.compare(user.id, item.userId) === 0;
    });

    return userIds.includes(true);
  }

  async isMember(space: Space, user: User): Promise<boolean> {
    const raw = await this.userSpaceRepository.query('call GetSpaceAccessUsers(?);', [space.id]);
    const userIds = raw[0].map((item) => {
      return Buffer.compare(user.id, item.userId) === 0;
    });

    return userIds.includes(true);
  }

  async getSpaceUsersDesc(spaceId: Buffer): Promise<string[]> {
    const raw = await this.userSpaceRepository.query('call GetSpaceAccessUsers(?);', [spaceId]);
    const filteredUserIds = raw[0].filter((item) => {
      return !item.userId.equals(uuidToBytes('00000000-0000-0000-0000-000000000003'));
    });

    return filteredUserIds.map((item) => {
      return bytesToUuid(item.userId);
    });
  }

  async canAccess(space: Space, user: User): Promise<boolean> {
    if (space.ownedById.equals(user.id)) {
      return true;
    }

    const raw = await this.userSpaceRepository.query('call GetSpaceAdmins(?);', [space.id]);
    const userIds = raw[0].map((item) => {
      return Buffer.compare(user.id, item.userId) === 0;
    });

    return userIds.includes(true);
  }

  async assignUser(user: User, space: Space, admin: boolean): Promise<void> {
    const userSpace: UserSpace = new UserSpace();

    userSpace.space = space;
    userSpace.isAdmin = admin;
    userSpace.user = user;

    await this.create(userSpace);
    await this.signalPermissionUpdate(space.id, true);
  }

  async unAssignUser(userSpace: UserSpace): Promise<void> {
    await this.delete(userSpace);
    await this.signalPermissionUpdate(userSpace.spaceId, true);
  }

  async create(userSpace: UserSpace): Promise<UserSpace> {
    return this.userSpaceRepository.query(
      `
      INSERT INTO user_spaces (spaceId, userId, isAdmin) VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE isAdmin=?;
     `,
      [userSpace.space.id, userSpace.user.id, userSpace.isAdmin, userSpace.isAdmin],
    );
  }

  async delete(parsed: any): Promise<DeleteResult> {
    return this.userSpaceRepository.query('DELETE FROM user_spaces WHERE spaceId = ? AND userId = ?', [
      parsed.spaceId,
      parsed.userId,
    ]);
  }

  async signalPermissionUpdate(spaceId: Buffer, adminShipChanged: boolean): Promise<void> {
    await this.client.signalPermissionUpdate(bytesToUuid(spaceId), adminShipChanged);
  }
}
