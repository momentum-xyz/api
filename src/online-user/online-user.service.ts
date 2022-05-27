import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { MqttService } from '../services/mqtt.service';
import { OnlineUser } from './online-user.entity';
import { Space } from '../space/space.entity';
import { User } from '../user/user.entity';

@Injectable()
export class OnlineUserService {
  constructor(
    @InjectRepository(OnlineUser)
    private readonly onlineUserRepository: Repository<OnlineUser>,
    private client: MqttService,
  ) {}

  async findOne(user: User): Promise<OnlineUser> {
    return this.onlineUserRepository.findOne({
      where: {
        user: user,
      },
      relations: ['space', 'user'],
    });
  }

  async findAll(worldId: Buffer): Promise<OnlineUser[]> {
    return this.onlineUserRepository.find({
      where: {
        spaceId: worldId,
      },
      relations: ['user'],
    });
  }

  async create(space: Space, user: User): Promise<OnlineUser> {
    const onlineUser: OnlineUser = new OnlineUser();
    onlineUser.space = space;
    onlineUser.user = user;
    return this.onlineUserRepository.save(onlineUser);
  }

  async delete(onlineUser: OnlineUser): Promise<DeleteResult> {
    return this.onlineUserRepository.delete(onlineUser);
  }

  async findCount(worldId: Buffer): Promise<number> {
    return this.onlineUserRepository.count({
      where: {
        spaceId: worldId,
      },
    });
  }
}
