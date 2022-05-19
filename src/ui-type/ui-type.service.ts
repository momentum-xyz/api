import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UiType } from './ui-type.entity';

@Injectable()
export class UiTypeService {
  constructor(
    @InjectRepository(UiType)
    private readonly uiTypeRepository: Repository<UiType>,
  ) {}

  findOne(uiType: string): Promise<UiType> {
    return this.uiTypeRepository.findOne({
      where: {
        name: uiType,
      },
    });
  }

  findById(id: Buffer): Promise<UiType> {
    return this.uiTypeRepository.findOne({
      where: {
        id: id,
      },
    });
  }

  findAll(): Promise<UiType[]> {
    return this.uiTypeRepository.find();
  }

  async create(spaceType: UiType): Promise<UiType> {
    return this.uiTypeRepository.save(spaceType);
  }
}
