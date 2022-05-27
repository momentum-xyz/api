import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorldDefinition } from './world-definition.entity';
import { uuidToBytes } from '../utils/uuid-converter';

@Injectable()
export class WorldDefinitionService {
  constructor(
    @InjectRepository(WorldDefinition)
    private readonly worldDefinitionRepository: Repository<WorldDefinition>,
  ) {}

  async getByWorldId(worldId: Buffer): Promise<WorldDefinition> {
    return this.worldDefinitionRepository.findOne({
      where: {
        id: worldId,
      },
    });
  }
}
