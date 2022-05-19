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

  async getKusamaDefinition(): Promise<WorldDefinition> {
    return this.worldDefinitionRepository.findOne({
      where: {
        id: uuidToBytes('A91C9235-B545-43CF-8A3A-26B0FD70FE73'),
      },
    });
  }
}
