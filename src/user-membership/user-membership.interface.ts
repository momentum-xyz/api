import { ApiProperty } from '@nestjs/swagger';

export class UserSpaceDto {
  @ApiProperty()
  userId: Buffer;

  @ApiProperty()
  isAdmin: boolean;

  @ApiProperty()
  spaceId: Buffer;
}
