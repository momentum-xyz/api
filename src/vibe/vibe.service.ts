import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { MqttService } from '../services/mqtt.service';
import { Vibe } from './vibe.entity';
import { Space } from '../space/space.entity';
import { User } from '../user/user.entity';
import { bytesToUuid } from '../utils/uuid-converter';

@Injectable()
export class VibeService {
  constructor(
    @InjectRepository(Vibe)
    private readonly vibeRepository: Repository<Vibe>,
    private client: MqttService,
  ) {}

  async create(user: User, space: Space): Promise<Vibe> {
    const vibe: Vibe = await this.vibeRepository.query('INSERT INTO vibes (userId, spaceId) VALUES (?, ?)', [
      user.id,
      space.id,
    ]);

    if (vibe) {
      this.client.publish(`space_control/${bytesToUuid(space.id)}/trigger-effect`, 'vibe', false);
      return vibe;
    }
  }

  async delete(vibe: Vibe): Promise<DeleteResult> {
    return this.vibeRepository.delete(vibe);
  }

  async getCount(space: Space): Promise<number> {
    return this.vibeRepository.count({
      where: {
        space: space,
      },
    });
  }

  async findOne(space: Space, user: User) {
    return this.vibeRepository.findOne({
      where: {
        space: space,
        user: user,
      },
    });
  }
}
