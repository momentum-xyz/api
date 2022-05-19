import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { UserSpaceAttribute } from './user-space-attribute.entity';
import { Attribute } from '../attribute/attribute.entity';
import { Space } from '../space/space.entity';
import { User } from '../user/user.entity';

@Injectable()
export class UserSpaceAttributeService {
  constructor(
    @InjectRepository(UserSpaceAttribute)
    private readonly userSpaceAttributeRepository: Repository<UserSpaceAttribute>,
  ) {}

  async findOne(user: User, space: Space, attribute: Attribute): Promise<UserSpaceAttribute> {
    return this.userSpaceAttributeRepository.findOne({
      where: {
        user: user,
        space: space,
        attribute: attribute,
      },
      relations: ['space'],
    });
  }

  async findAllForUser(user: User, attribute: Attribute): Promise<UserSpaceAttribute[]> {
    return this.userSpaceAttributeRepository.find({
      where: {
        user: user,
        attribute: attribute,
      },
      relations: ['space'],
    });
  }

  async create(userSpaceAttribute: UserSpaceAttribute): Promise<UserSpaceAttribute> {
    return this.userSpaceAttributeRepository.save(userSpaceAttribute);
  }

  async delete(userSpaceAttribute: UserSpaceAttribute): Promise<DeleteResult> {
    return this.userSpaceAttributeRepository.delete(userSpaceAttribute);
  }
}
