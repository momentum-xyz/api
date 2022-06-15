import { SpaceIntegrationUser } from '../../space-integration-users/space-integration-users.entity';
import { ApiProperty } from '@nestjs/swagger';

export class AttendeeInterface {
  attendees: SpaceIntegrationUser[];

  @ApiProperty({ example: 6 })
  count: number;
}
