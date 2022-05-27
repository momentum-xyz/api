import { ApiProperty } from '@nestjs/swagger';

export class UserSpaceDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  isAdmin: boolean;

  @ApiProperty()
  spaceId: string;
}
