import { ApiProperty } from '@nestjs/swagger';

export class AgoraDto {
  @ApiProperty({
    example: 'af7c85c6-b9b9-4010-9d13-465506966d68',
    description: 'The UUID of agora',
  })
  id?: string;
}
