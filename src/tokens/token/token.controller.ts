import { Body, Controller, Get, HttpStatus, NotFoundException, Param, Post, Query, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { TokenService } from './token.service';
import { SpaceService } from '../../space/space.service';
import { Space } from '../../space/space.entity';
import { bytesToUuid, ethToBytes, uuidToBytes } from '../../utils/uuid-converter';
import { Token, TokenType } from './token.entity';
import { TokenInterface } from '../../auth/auth.interface';
import { User } from '../../user/user.entity';
import { TokenCreateDto } from './token.interface';
import { UserService } from '../../user/user.service';
import { Network, NetworkType } from '../../network/network.entity';
import { NetworkService } from '../../network/network.service';
import { paginateCollection } from '../../utils/pagination';
import axios from 'axios';

// TODO: For now listed here, should come from token-service at some point
export const SUPPORTED_NETWORKS = [NetworkType.ETH_MAINNET, NetworkType.MOONBEAM];

@ApiTags('token')
@Controller('token')
export class TokenController {
  constructor(
    private tokenService: TokenService,
    private networkService: NetworkService,
    private spaceService: SpaceService,
    private userService: UserService,
  ) {}

  @ApiOperation({
    description: 'Fetch all tokens.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns an array of all tokens.',
  })
  @ApiBearerAuth()
  @Get()
  async fetchTokens(@Res() response: Response): Promise<Response> {
    const tokens = await this.tokenService.findApproved();
    const mappedTokens = tokens.map((token) => {
      return { ...token, id: bytesToUuid(token.id) };
    });
    return response.status(HttpStatus.OK).json({
      tokens: mappedTokens,
    });
  }

  @ApiOperation({
    description: 'Fetch all tokens that are active in a world.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns an array of all tokens for a particular world.',
  })
  @ApiBearerAuth()
  @Get('active/:worldId')
  async fetchTokensForWorld(@Param() params, @Res() response: Response): Promise<Response> {
    const world: Space = await this.spaceService.findOne(uuidToBytes(params.worldId));
    const nodeId = await this.spaceService.getAncestorNode(world);
    const tokens = await this.tokenService.findByNodeId(nodeId);

    return response.status(HttpStatus.OK).json({
      tokens: tokens,
    });
  }

  @ApiOperation({
    description: 'Fetches token name based on parameters.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns an array of all matched token-names',
  })
  @ApiBearerAuth()
  @Get('info')
  async fetchTokenNames(
    @Query('networkName') networkName: NetworkType,
    @Query('networkType') networkType: string,
    @Query('address') address: string,
    @Query('tokenType') tokenType: TokenType,
    @Query('id') id: number,
    @Res() response: Response,
  ): Promise<Response> {
    const network: Network = await this.networkService.findOne(networkName);

    if (!network) {
      throw new NotFoundException('Could not find network');
    }

    const options = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const jsonObject = {
      contractAddress: address,
      tokenId: Number(id),
      tokenType: tokenType,
      network: {
        name: network.name,
        type: networkType,
      },
    };

    const tokenName = await axios.post(`${process.env.TOKEN_MONITOR_URL}/token-name`, jsonObject, options);

    return response.status(HttpStatus.OK).json({
      tokenName: tokenName.data,
    });
  }

  @ApiOperation({
    description: 'Filters and paginates token options.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns an array filtered and paginated tokens.',
  })
  @ApiBearerAuth()
  @Get('search')
  async search(
    @Query('q') searchQuery: string,
    @Query('limit') limit: number,
    @Query('page') page: number,
    @Res() response: Response,
  ): Promise<Response> {
    const tokens: Token[] = await this.tokenService.filter(searchQuery);
    const mappedTokens = tokens.map((token) => {
      return { ...token, id: bytesToUuid(token.id) };
    });

    return response.status(HttpStatus.OK).json({
      ...paginateCollection(mappedTokens, page, limit),
    });
  }

  @ApiOperation({
    description: 'Creates a token.',
  })
  @ApiResponse({
    status: 201,
    description: 'Returns a 201 if token was created successfully.',
  })
  @ApiBearerAuth()
  @Post('create')
  async createToken(
    @Req() request: TokenInterface,
    @Body() requestBody: TokenCreateDto,
    @Res() response: Response,
  ): Promise<Response> {
    const user: User = await this.userService.findOne(uuidToBytes(request.user.sub));
    if (!user) {
      return response.status(HttpStatus.NOT_FOUND).json({
        message: 'Could not find corresponding user',
      });
    }

    const token = new Token();
    token.name = requestBody.tokenName;
    token.tokenType = requestBody.tokenType;
    token.contractAddress = ethToBytes(requestBody.contractAddress);

    if (!SUPPORTED_NETWORKS.includes(requestBody.network)) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        message: 'No compatible network found',
      });
    }

    token.network = await this.networkService.getOrCreate(requestBody.network);
    token.tokenType = requestBody.tokenType;
    token.whitelisted = +false;
    await this.tokenService.create(token);

    return response.status(HttpStatus.CREATED).json({
      message: { ...token, id: bytesToUuid(token.id) },
    });
  }
}
