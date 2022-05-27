import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserType } from './user-type.entity';

@Injectable()
export class UserTypeService implements OnModuleInit {
  constructor(
    @InjectRepository(UserType)
    private readonly userTypeRepository: Repository<UserType>,
  ) {}

  async onModuleInit(): Promise<void> {
    const userTypes: UserType[] = await this.findAll();

    if (userTypes.length === 0) {
      const userType: UserType = new UserType();
      userType.name = 'User';
      userType.description = 'Momentum user';
      await this.create(userType);

      const userType2: UserType = new UserType();
      userType2.name = 'Team';
      userType2.description = 'Momentum team';
      await this.create(userType2);

      const userType3: UserType = new UserType();
      userType3.name = 'Organisation';
      userType3.description = 'Momentum organisation';
      await this.create(userType3);
    }
  }

  async findOne(userType: string): Promise<UserType> {
    return this.userTypeRepository.findOne({
      where: {
        name: userType,
      },
    });
  }

  async findAll(): Promise<UserType[]> {
    return this.userTypeRepository.find({
      order: {
        name: 'ASC',
      },
    });
  }

  async create(userType: UserType): Promise<UserType> {
    return this.userTypeRepository.save(userType);
  }

  async update(userType: UserType): Promise<UserType> {
    return this.userTypeRepository.save(userType);
  }
}
