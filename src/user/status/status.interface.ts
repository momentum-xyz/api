import { UserStatus } from '../user.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class UserStatusChangeDto {
  @ApiProperty({
    example: 'af7c85c6-b9b9-4010-9d13-465506966d68',
    description: 'The userId of the user',
  })
  @IsNotEmpty()
  status: UserStatus;
}
