import { ApiProperty } from '@nestjs/swagger';
import { IntegrationTypes } from '../integration-type/integration-type.interface';
import { IsNotEmpty } from 'class-validator';

export class IntegrationDto {
  @ApiProperty({
    example: 'af7c85c6-b9b9-4010-9d13-465506966d68',
    description: 'The spaceid of the owner of the Miro',
  })
  @IsNotEmpty()
  spaceId: string;

  @ApiProperty({
    example: 'stage_mode',
    description: 'The integration type',
  })
  @IsNotEmpty()
  integrationType: IntegrationTypes;

  @ApiProperty({
    example: 'invite',
    description: '(stage-mode) Type of request to be made',
  })
  stageModeRequestType?: StageModeRequestType;

  @ApiProperty({
    example: 'admit',
    description: '(stage-mode) Admit or kick a user (only for moderation admit-or-kick EP)',
  })
  modType?: ModerationType;

  @ApiProperty({
    example: '',
    description: 'The Embed link or other content for the Integration',
  })
  data: IntegrationData;
}

export class StageModeKickAdmitDto {
  @ApiProperty({
    example: 'af7c85c6-b9b9-4010-9d13-465506966d68',
    description: 'The userid of the user',
  })
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    example: 'admit',
    description: '(stage-mode) Admit or kick a user (only for moderation admit-or-kick EP)',
  })
  @IsNotEmpty()
  modType: ModerationType;
}

export class StageModeMuteDto {
  @ApiProperty({
    example: 'af7c85c6-b9b9-4010-9d13-465506966d68',
    description: 'The userid of the user',
  })
  @IsNotEmpty()
  userId: string;
}

export interface IntegrationData {
  id?: string;
  broadcastStatus?: BroadcastStatus;
  name?: string;
  url?: string;
  youtubeUrl?: string;
  viewLink?: string;
  embedHtml?: string;
  accessLink?: string;
  accessLinkPolicy?: string;
  stageModeStatus?: StageModeStatus;
  userId?: string;
}

export enum ModerationType {
  ADMIT = 'admit',
  KICK = 'kick',
}

export enum StageModeStatus {
  INITIATED = 'initiated',
  STOPPED = 'stopped',
}

export enum StageModeUserRole {
  SPEAKER = 'speaker',
  INVITED = 'invited',
  AUDIENCE_MEMBER = 'audience_member',
}

export enum StageModeRequestType {
  REQUEST = 'request',
  INVITE = 'invite',
  ACCEPT = 'accept',
  DECLINE = 'decline',
  NONE = '',
}

export enum BroadcastStatus {
  FORCE_SMALL = 'force_small',
  PLAY_SMALL = 'play_small',
  FORCE_LARGE = 'force_large',
  PLAY_LARGE = 'play_large',
  PLAY = 'play',
  STOP = 'stop',
}
