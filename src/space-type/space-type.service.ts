import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SpaceType } from './space-type.entity';

@Injectable()
export class SpaceTypeService {
  constructor(
    @InjectRepository(SpaceType)
    private readonly spaceTypeRepository: Repository<SpaceType>,
  ) {}

  findOne(spaceType: string): Promise<SpaceType> {
    return this.spaceTypeRepository.findOne({
      where: {
        name: spaceType,
      },
      relations: ['spaces', 'spaces.children'],
    });
  }

  findAll(): Promise<SpaceType[]> {
    return this.spaceTypeRepository.find();
  }

  async create(spaceType: SpaceType): Promise<SpaceType> {
    return this.spaceTypeRepository.save(spaceType);
  }

  async find(ids: Buffer[]) {
    return await this.spaceTypeRepository
      .createQueryBuilder('space_types')
      .where('space_types.id IN (:id)', { id: ids })
      .getMany();
  }
}
