import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MqttService } from '../services/mqtt.service';
import { IntegrationType } from './integration-type.entity';

@Injectable()
export class IntegrationTypeService {
  constructor(
    @InjectRepository(IntegrationType)
    private readonly integrationTypeRepository: Repository<IntegrationType>,
    private client: MqttService,
  ) {}

  async create(integrationType: IntegrationType): Promise<IntegrationType> {
    return this.integrationTypeRepository.save(integrationType);
  }

  async findOne(type: string): Promise<IntegrationType> {
    return this.integrationTypeRepository.findOne({
      where: {
        name: type,
      },
    });
  }

  async findById(integrationTypeId: Buffer): Promise<IntegrationType> {
    return this.integrationTypeRepository.findOne({
      where: {
        id: integrationTypeId,
      },
    });
  }
}
