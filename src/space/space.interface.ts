import { Response } from 'express';
import { Space } from './space.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export interface SpaceDto {
  parentId: string;
  spaceId: string;
  root: boolean;
  currentWorldId: string;
  name: string;
  description: string;
  secret: boolean;
  visible: boolean;
  spaceType: string;
  created_at?: Date;
  updated_at?: Date;
}

export class SpaceCreateDto {
  @ApiProperty({
    example: 'My Space',
    description: 'Name of the space',
  })
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'My Space',
    description: 'Description for this space',
  })
  description?: string;

  @ApiProperty({
    example: '1',
    description: 'Is the space the root space of the structure?',
  })
  root?: boolean;

  @ApiProperty({
    example: '00000000-0000-0000-0000-000000000000',
    description: 'The parent uuid where this space will be attached to (if root = false)',
  })
  parentId?: string;

  @ApiProperty({
    example: '00000000-0000-0000-0000-000000000000',
    description: '(grab-a-table) World id of the grab a table initiator',
  })
  worldId?: string;

  @ApiProperty({
    example: 'false',
    description: 'Is the space publicly accessible by users that are not a member of this space? Defaults to false',
  })
  secret?: boolean;

  @ApiProperty({
    example: 'true',
    description: 'Is the space visible in the 3D environment? Defaults to true',
  })
  visible?: boolean;

  @ApiProperty({
    example: 'project-initiative',
    description: 'The name of the type of space',
  })
  @IsNotEmpty()
  spaceType: string;
}

export class SpaceEditDto {
  @ApiProperty({
    example: '00000000-0000-0000-0000-000000000000',
    description: 'The parent uuid where this space will be attached to (if root = false)',
  })
  @IsNotEmpty()
  parentId: string;

  @ApiProperty({
    example: 'My Space',
    description: 'Name of the space',
  })
  name?: string;

  @ApiProperty({
    example: 'false',
    description: 'Is the space publicly accessible by users that are not a member of this space? Defaults to false',
  })
  secret?: boolean;

  @ApiProperty({
    example: 'true',
    description: 'Is the space visible in the 3D environment? Defaults to true',
  })
  visible?: boolean;
}

export interface OwnedSpace {
  space: Space;
  archived: boolean;
}

export interface SpaceResponse extends Response {
  space: Space;
  ancestors: Space;
  children: Space;
  spaceType: string;
  admin: boolean;
}

export interface SpaceInviteDto {
  spaceId: string;
  userId: string;
  isTable: boolean;
}
