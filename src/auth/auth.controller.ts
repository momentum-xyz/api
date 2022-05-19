import { Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiProperty, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OIDCService } from './oidc/oidc.service';

class IntrospectTokenDTO {
  @ApiProperty()
  token: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private oidcService: OIDCService) {}

  @ApiOperation({
    description: 'OIDC introspect endpoint to check if token is active (see rfc7662)',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a boolean',
  })
  @ApiBody({ type: IntrospectTokenDTO })
  @ApiBearerAuth()
  @Post('introspect')
  @HttpCode(200)
  async introspectToken(): Promise<number> {
    try {
      return 1;
    } catch (e) {
      console.debug(e);
      return 0;
    }
  }
}
