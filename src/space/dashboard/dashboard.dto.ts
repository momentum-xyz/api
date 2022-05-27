import { TileDto } from '../../tile/tile.dto';
import { ApiProperty } from '@nestjs/swagger';
import { ApiModelProperty } from '@nestjs/swagger/dist/decorators/api-model-property.decorator';

export class DashboardDto {
  @ApiProperty({
    example: 'af7c85c6-b9b9-4010-9d13-465506966d68',
    description: 'The UUID of the dashboard',
  })
  id?: string;

  @ApiProperty({
    example: 'af7c85c6-b9b9-4010-9d13-465506966d68',
    description: 'The UUID of the owner of the dashboard',
  })
  owner_id: string;

  @ApiModelProperty({
    description: 'An array of tiles',
    type: TileDto,
    isArray: true,
  })
  tiles: TileDto[];
}

export interface TokenInterface extends Request {
  accessTokenJWT: string;
  user: {
    sub: string;
    email_verified: boolean;
    name: string;
    preferred_username: string;
    given_name: string;
    family_name: string;
    email: string;
  };
  userType: string;
}
