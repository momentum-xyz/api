import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { UserLkp } from './user-lkp.entity';

@Injectable()
export class UserLkpService {
  constructor(
    @InjectRepository(UserLkp)
    private readonly userLkpRepository: Repository<UserLkp>,
  ) {}

  findOne(spaceType: string): Promise<UserLkp> {
    return this.userLkpRepository.findOne({
      where: {
        name: spaceType,
      },
    });
  }

  async delete(userLkp: UserLkp): Promise<DeleteResult> {
    return this.userLkpRepository.delete(userLkp);
  }

  async create(spaceType: UserLkp): Promise<UserLkp> {
    return this.userLkpRepository.save(spaceType);
  }
}
