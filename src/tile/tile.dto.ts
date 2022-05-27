import { ApiProperty } from '@nestjs/swagger';
import { PermanentType } from './tile.entity';

export enum TileType {
  TILE_TYPE_TEXT = 'TILE_TYPE_TEXT',
  TILE_TYPE_MEDIA = 'TILE_TYPE_MEDIA',
  TILE_TYPE_VIDEO = 'TILE_TYPE_VIDEO',
}

export class TileDto {
  @ApiProperty({
    example: 'af7c85c6-b9b9-4010-9d13-465506966d69',
    description: 'The UUID of the tile',
  })
  id?: string;
  @ApiProperty({
    example: 'af7c85c6-b9b9-4010-9d13-465506966d69',
    description: 'The UUID of the owner (space)',
  })
  spaceId?: Buffer;
  @ApiProperty({
    example: 'af7c85c6-b9b9-4010-9d13-465506966d69',
    description: 'The UUID of the ui instance',
  })
  uiInstanceId?: Buffer;
  @ApiProperty({
    example: 'af7c85c6-b9b9-4010-9d13-465506966d69',
    description: 'The UUID of the ui type',
  })
  uiTypeId?: Buffer;
  @ApiProperty({
    example: '{"example": "The content can be anything."}',
    description: 'The content of the tile as a json object',
  })
  content: JSON;
  @ApiProperty({
    example: '1',
    description: 'The horizontal position of the tile, the row',
  })
  row: number;
  @ApiProperty({
    example: '1',
    description: 'The vertical position of the tile, the column',
  })
  column: number;
  @ApiProperty({
    example: 'af7c85c6-b9b9-4010-9d13-465506966d69',
    description: 'The type of the tile',
  })
  type: TileType;
  @ApiProperty({
    example: 'problem',
    description: 'The permanentType of the tile',
  })
  permanentType: PermanentType;
  @ApiProperty({
    example: '0',
    description: 'The render of the tile',
  })
  render: number;
  @ApiProperty({
    example: 'af7c85c6b9b940109d13465506966d69',
    description: 'The hash of the tile',
  })
  hash: string;
}
