import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vanity } from './vanity.entity';

@Injectable()
export class VanityService {
  constructor(
    @InjectRepository(Vanity)
    private readonly vanityRepository: Repository<Vanity>,
  ) {}

  async findOne(vanity_id: number): Promise<Vanity> {
    return this.vanityRepository.findOne({
      where: {
        id: vanity_id,
      },
    });
  }
}
