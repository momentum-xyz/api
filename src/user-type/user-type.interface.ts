import { ApiProperty } from '@nestjs/swagger';

export class UserType {
  id?: string;

  @ApiProperty()
  name: string;

  // @ApiProperty()
  // role: RoleType;

  @ApiProperty()
  description: string;

  // vanity?: Vanity[];
  // communities?: Community[];
  // teams?: Team[];
  // organisations?: Organisation[];
}

export enum UserTypes {
  USER = 'User',
  DEITY = 'Deity',
  TEMPORARY_USER = 'Temporary User',
  TOKEN_GROUPS = 'Token Groups',
}
