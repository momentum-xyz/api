import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttributeType } from './attribute.interface';
import { Attribute } from './attribute.entity';

@Injectable()
export class AttributeService {
  constructor(
    @InjectRepository(Attribute)
    private readonly attributeRepository: Repository<Attribute>,
  ) {}

  async findOne(name: AttributeType): Promise<Attribute> {
    return this.attributeRepository.findOne({
      where: {
        name: name,
      },
    });
  }
}
