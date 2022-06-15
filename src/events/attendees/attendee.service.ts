import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { SpaceIntegrationUser } from '../../space-integration-users/space-integration-users.entity';

@Injectable()
export class AttendeeService {
  constructor(
    private readonly spaceIntegrationUserRepository: Repository<SpaceIntegrationUser>,
  ) {}

  find(): Promise<SpaceIntegrationUser[]> {
    return this.spaceIntegrationUserRepository.find();
  }

  findOne(attendee: SpaceIntegrationUser): Promise<SpaceIntegrationUser> {
    return this.spaceIntegrationUserRepository.findOne({
      where: {
        name: '',
      },
    });
  }


}
