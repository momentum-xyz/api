import { ApiProperty } from '@nestjs/swagger';
import { Profile } from './profile/profile.dto';
import { UserStatus } from './user.entity';

export class User {
  id?: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  profile: Profile;
}

export interface UserDto {
  name: string;
}

export class UserAccountDto {
  accountAddress: string;
}

export interface UserSearchResult {
  id: Buffer;
  name: string;
  profile: Profile;
  status: UserStatus;
}
