import { ApiProperty } from '@nestjs/swagger';

export class InvitationDto {
  @ApiProperty()
  email: string;

  @ApiProperty()
  isAdmin: boolean;

  @ApiProperty()
  spaceId: string;
}
