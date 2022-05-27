import { ApiProperty } from '@nestjs/swagger';

export class AudioTrackDto {
  id: string;

  @ApiProperty({
    example: 'Darude - Sandstorm',
    description: 'Name of the track',
  })
  name: string;

  file_hash: string;
}
