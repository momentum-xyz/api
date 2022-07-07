import { ApiBearerAuth, ApiOperation, ApiProperty, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Controller, Get, Query, Req } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { TokenInterface } from '../auth/auth.interface';
import { uuidToBytes } from '../utils/uuid-converter';
import { ReflectorService } from './reflector.service';

export class ExchangeRateDto {
  @ApiProperty()
  providerName: string; // 'CoinGecko',

  @ApiProperty()
  tokenName: string;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  value: number; // 155.66,
}

@Controller()
export class ReflectorController {
  constructor(private readonly reflectorService: ReflectorService, private readonly userService: UserService) {}

  @ApiOperation({
    description: 'Returns all spaces linked to validator',
  })
  @ApiQuery({
    name: 'withIdentity',
    description: 'Only return validators with an identity',
    example: 'true',
    required: false,
  })
  @ApiQuery({ name: 'parentSpaceId', required: false })
  @ApiTags('space')
  @Get('space/get-validators/v2')
  @ApiBearerAuth()
  async getValidators_v2(
    @Req() request: TokenInterface,
    @Query('withIdentity') identityParam?: string,
    @Query('parentSpaceId') parentSpaceId?: string,
    @Query('isFavorited') isFavoritedParam?: string,
  ) {
    let withIdentity: boolean | null = null;
    if (identityParam) {
      withIdentity = ['1', 'true'].includes(identityParam);
    }

    let isFavorited: true | null = null;
    if (['1', 'true'].includes(isFavoritedParam)) {
      isFavorited = true;
    }

    const user = await this.userService.findOne(uuidToBytes(request.user.sub));

    return await this.reflectorService.getValidators_v2(user, withIdentity, parentSpaceId, isFavorited);
  }

  @ApiOperation({
    description: 'Returns all spaces linked to validator',
  })
  @ApiQuery({
    name: 'withIdentity',
    description: 'Only return validators with an identity',
    example: 'true',
    required: false,
  })
  @ApiQuery({ name: 'parentSpaceId', required: false })
  @ApiTags('space')
  @Get('space/get-validators')
  @ApiBearerAuth()
  async getValidators(
      @Req() request: TokenInterface,
      @Query('withIdentity') identityParam?: string,
      @Query('parentSpaceId') parentSpaceId?: string,
      @Query('isFavorited') isFavoritedParam?: string,
  ) {
    let withIdentity: boolean | null = null;
    if (identityParam) {
      withIdentity = ['1', 'true'].includes(identityParam);
    }

    let isFavorited: true | null = null;
    if (['1', 'true'].includes(isFavoritedParam)) {
      isFavorited = true;
    }

    const user = await this.userService.findOne(uuidToBytes(request.user.sub));

    return await this.reflectorService.getValidators(user, withIdentity, parentSpaceId, isFavorited);
  }

  @ApiOperation({
    description: 'Returns KSM to USD exchange rate',
  })
  @ApiTags('kusama')
  @ApiResponse({
    status: 200,
    description: 'Returns KSM to USD exchange rate',
    type: ExchangeRateDto,
  })
  @Get('kusama/get-exchange-rate')
  async getExchangeRate() {
    return this.reflectorService.getKsmUsd();
  }
}
