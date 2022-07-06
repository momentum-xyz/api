import { ApiProperty } from '@nestjs/swagger';

export class WorldConfigResponse {
  @ApiProperty({ example: '24e3c49e-1f96-44e6-917f-dfbe91bc0a5a' })
  community_space_id: string;
  @ApiProperty({ example: '24e3c49e-1f96-44e6-917f-dfbe91bc0a5a' })
  help_space_id: string;
}
