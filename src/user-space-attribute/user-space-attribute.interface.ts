import { ApiProperty } from '@nestjs/swagger';

export class UserSpaceAttributeCreateDto {
  @ApiProperty()
  spaceId: string;
}
