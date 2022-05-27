import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UrlMapping } from './url-mapping.entity';

@Injectable()
export class UrlMappingService {
  constructor(@InjectRepository(UrlMapping) private readonly urlMappingRepository: Repository<UrlMapping>) {}

  async findOne(worldId: Buffer): Promise<UrlMapping> {
    return this.urlMappingRepository.findOne({ where: { worldId: worldId } });
  }
}
