import { ApiProperty } from '@nestjs/swagger';

export class SpacePlaylistDto {
  @ApiProperty({
    example: 'af7c85c6-b9b9-4010-9d13-465506966d68',
    description: 'spaceId',
  })
  spaceId: string;

  @ApiProperty({
    example: 'af7c85c6-b9b9-4010-9d13-465506966d68',
    description: '(audio)trackId',
  })
  trackId: string;

  @ApiProperty({
    example: 4,
    description: 'Spot on the playlist, if empty it gets added at the end of the queue',
  })
  order?: number;

  @ApiProperty({
    example: 3,
    description: 'New spot on the playlist, (Only required for changing the playlist order EP))',
  })
  newOrder?: number;
}
