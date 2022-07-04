import { ApiProperty } from '@nestjs/swagger';
import { Attendee } from './attendee.entity';

export class AttendeeInterface {
  attendees: Attendee[];

  @ApiProperty({ example: 6 })
  count: number;
}
