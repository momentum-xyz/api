import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  InternalServerErrorException,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { bytesToEth, bytesToUuid, uuidToBytes } from '../../utils/uuid-converter';
import { TokenService } from '../token/token.service';
import { TokenRuleService } from './token-rule.service';
import {
  TokenRuleCreateDto,
  TokenRuleProcessDto,
  TokenRuleResponseDto,
  TokenRuleListResponse,
} from './token-rule.interface';
import { TokenRule, TokenRuleStatus } from './token-rule.entity';
import { Space } from '../../space/space.entity';
import { SpaceService } from '../../space/space.service';
import { TokenInterface } from '../../auth/auth.interface';
import { User } from '../../user/user.entity';
import { UserService } from '../../user/user.service';
import { Token, TokenType } from '../token/token.entity';
import { TokenRuleSpaceAdminGuard } from './token-rule-space-admin.guard';
import { TokenRuleNodeAdminGuard } from './token-rule-node-admin.guard';
import { NetworkType } from '../../network/network.entity';
import { NetworkService } from '../../network/network.service';
import { paginateCollection } from '../../utils/pagination';
import { UserSpaceService } from '../../user-space/user-space.service';
import { UserSpace } from '../../user-space/user-space.entity';
import { UserTypes } from '../../user-type/user-type.interface';
import { UserMembership } from '../../user-membership/user-membership.entity';

// For now listed here, should become a node configuration.
const SUPPORTED_NETWORKS = [NetworkType.ETH_MAINNET, NetworkType.MOONBEAM];

@ApiTags('token-rule')
@Controller('token-rule')
export class TokenRuleController {
  constructor(
    private userService: UserService,
    private tokenService: TokenService,
    private tokenRuleService: TokenRuleService,
    private spaceService: SpaceService,
    private userSpaceService: UserSpaceService,
    private networkService: NetworkService,
  ) {}

  @ApiOperation({
    description: 'Fetch all token rules for an admin.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns an array of all token rules.',
    type: TokenRuleListResponse,
  })
  @ApiBearerAuth()
  @Get('all')
  @UseGuards(TokenRuleNodeAdminGuard)
  async fetchTokenRules(
    @Query('q') searchQuery: string,
    @Res() response: Response,
  ): Promise<Response<TokenRuleListResponse>> {
    let tokenRules;
    if (searchQuery) {
      tokenRules = await this.tokenRuleService.filter(searchQuery);
    } else {
      tokenRules = await this.tokenRuleService.findAll();
    }

    return response.status(HttpStatus.OK).json({
      count: tokenRules.length,
      tokenRules: tokenRules.map(mapTokenRuleResponse),
    });
  }

  @ApiOperation({
    description: 'Fetch all token rules pending approval.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns an array of all token rules pending approval.',
    type: TokenRuleListResponse,
  })
  @ApiBearerAuth()
  @Get('all/pending')
  @UseGuards(TokenRuleNodeAdminGuard)
  async getPendingTokenRules(@Req() request: TokenInterface, @Res() response: Response): Promise<Response> {
    const tokenRules = await this.tokenRuleService.findPending();

    return response.status(HttpStatus.OK).json({
      count: tokenRules.length,
      tokenRules: tokenRules.map(mapTokenRuleResponse),
    });
  }

  @ApiOperation({
    description: 'Fetch all token rules for space.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns an array of all token rules for the space.',
    type: TokenRuleListResponse,
  })
  @ApiBearerAuth()
  @Get('all/:spaceId')
  @UseGuards(TokenRuleSpaceAdminGuard)
  async fetchTokenRulesForSpace(@Param() params, @Res() response: Response): Promise<Response> {
    const tokenRules: TokenRule[] = [];
    const space: Space = await this.spaceService.findOne(uuidToBytes(params.spaceId));
    const userSpaces: UserSpace[] = await this.userSpaceService.allUsersInSpace(space);
    const tokenGroupUsers: UserSpace[] = userSpaces.filter(
      (userSpace) => userSpace.user.userType.name === UserTypes.TOKEN_GROUPS,
    );

    if (tokenGroupUsers.length > 0) {
      for (const tokenGroupUser of tokenGroupUsers) {
        const foundTokenRules: TokenRule[] = await this.tokenRuleService.findByTokenGroupUser(tokenGroupUser.user);
        if (foundTokenRules.length > 0) {
          for (const foundTokenRule of foundTokenRules) {
            tokenRules.push(foundTokenRule);
          }
        }
      }
    }

    return response.status(HttpStatus.OK).json({
      count: tokenRules.length,
      tokenRules: tokenRules.map(mapTokenRuleResponse),
    });
  }

  @ApiOperation({
    description: 'Fetches a list of token types and networks.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns an object containing all token types and networks.',
  })
  @ApiBearerAuth()
  @Get('allowed-options')
  async fetchTypesAndNetworks(@Param() params, @Res() response: Response): Promise<Response> {
    return response.status(HttpStatus.OK).json({
      types: Object.values(TokenType),
      networks: SUPPORTED_NETWORKS,
    });
  }

  @ApiOperation({
    description: 'Filters and paginates token-rules.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns an array filtered and paginated token-rules.',
  })
  @ApiBearerAuth()
  @Get('search')
  async search(
    @Query('q') searchQuery: string,
    @Query('limit') limit: number,
    @Query('page') page: number,
    @Res() response: Response,
  ): Promise<Response> {
    const tokenRules: TokenRule[] = await this.tokenRuleService.filterApproved(searchQuery);
    const mappedTokenRules = tokenRules.map(mapTokenRuleResponse);

    return response.status(HttpStatus.OK).json({
      ...paginateCollection(mappedTokenRules, page, limit),
    });
  }

  @ApiOperation({
    description: 'Creates a token rule.',
  })
  @ApiResponse({
    status: 201,
    description: 'Returns a 201 if rule was created successfully.',
  })
  @ApiBearerAuth()
  @Post('create')
  @UseGuards(TokenRuleSpaceAdminGuard)
  async createTokenRule(
    @Req() request: TokenInterface,
    @Body() requestBody: TokenRuleCreateDto,
    @Res() response: Response,
  ): Promise<Response> {
    const user: User = await this.userService.findOne(uuidToBytes(request.user.sub));
    if (!user) {
      return response.status(HttpStatus.NOT_FOUND).json({
        message: 'Could not find corresponding user',
      });
    }

    const space: Space = await this.spaceService.findOne(uuidToBytes(requestBody.spaceId));
    if (!space) {
      return response.status(HttpStatus.NOT_FOUND).json({
        message: 'Could not find corresponding space',
      });
    }

    const tokenRule = new TokenRule();
    tokenRule.name = requestBody.name;
    tokenRule.rule = { ...requestBody.rule, minBalance: Number(requestBody.rule.minBalance) };
    tokenRule.user = user;
    tokenRule.token = await this.tokenService.findOne(uuidToBytes(requestBody.tokenId));
    tokenRule.status = TokenRuleStatus.REQUESTED;
    await this.tokenRuleService.create(tokenRule, space);

    return response.status(HttpStatus.CREATED).json({
      tokenRule: mapTokenRuleResponse(tokenRule),
    });
  }

  @ApiOperation({
    description: 'Changes the token-rule status.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a 200 if rule was successfully approved or denied.',
  })
  @ApiBearerAuth()
  @Post('process/:tokenRuleId')
  @UseGuards(TokenRuleNodeAdminGuard)
  async processTokenRule(
    @Param('tokenRuleId') tokenRuleId: string,
    @Req() request: TokenInterface,
    @Body() requestBody: TokenRuleProcessDto,
    @Res() response: Response,
  ): Promise<Response> {
    const user: User = await this.userService.findOne(uuidToBytes(request.user.sub));
    if (!user) {
      return response.status(HttpStatus.NOT_FOUND).json({
        message: 'Could not find corresponding user',
      });
    }

    const tokenRule: TokenRule = await this.tokenRuleService.findOne(uuidToBytes(tokenRuleId));
    if (!tokenRule) {
      return response.status(HttpStatus.NOT_FOUND).json({
        message: 'Could not find corresponding token-rule',
      });
    }

    tokenRule.status = requestBody.status;

    if (tokenRule.status === TokenRuleStatus.APPROVED) {
      // const userMembership: UserMembership = new UserMembership();
      // userMembership.user = tokenRule.user;
      // userMembership.memberOf2 = tokenRule.tokenGroupUser;

      const token: Token = tokenRule.token;
      await this.tokenService.whitelist(token);
    }

    const savedTokenRule = await this.tokenRuleService.updateStatus(tokenRule);

    if (savedTokenRule.affected < 0) {
      throw new InternalServerErrorException('Could not update status');
    }

    return response.status(HttpStatus.OK).json({
      tokenRule: mapTokenRuleResponse(tokenRule),
    });
  }

  @ApiOperation({
    description: 'Delete a token rule. Can only be performed by space admin that created rule.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a 200 if whitelist request was deleted successfully.',
  })
  @ApiBearerAuth()
  @Delete(':tokenRuleId')
  @UseGuards(TokenRuleSpaceAdminGuard)
  async deleteTokenRule(@Param() params, @Req() request: TokenInterface, @Res() response: Response): Promise<Response> {
    const user: User = await this.userService.findOne(uuidToBytes(request.user.sub));
    if (!user) {
      return response.status(HttpStatus.NOT_FOUND).json({
        message: 'Could not find corresponding user',
      });
    }

    const tokenRule = await this.tokenRuleService.findOne(uuidToBytes(params.tokenRuleId));
    if (!tokenRule) {
      return response.status(HttpStatus.NOT_FOUND).json({
        message: 'Could not find token rule',
      });
    }

    const canDelete = user.id.equals(tokenRule.user.id);
    if (!canDelete) {
      return response.status(HttpStatus.UNAUTHORIZED).json({
        message: 'User does not have the permission to delete token rule',
      });
    }

    await this.tokenRuleService.delete(tokenRule);
    return response.status(HttpStatus.OK).json({
      message: 'Token rule deleted successfully',
    });
  }
}

/**
 * Transform TokenRule to easier to use JSON format.
 */
function mapTokenRuleResponse(tokenRule: TokenRule): TokenRuleResponseDto {
  const parsedTokenId = bytesToUuid(tokenRule.id);
  return {
    id: parsedTokenId,
    name: tokenRule.name,
    status: tokenRule.status,
    userId: bytesToUuid(tokenRule.user.id),
    userName: tokenRule.user.name,
    tokenGroupUserId: bytesToUuid(tokenRule.tokenGroupUser.id),
    network: tokenRule.token.network.name,
    contractAddress: bytesToEth(tokenRule.token.contractAddress),
    minBalance: tokenRule.rule.minBalance,
    tokenType: tokenRule.token.tokenType,
    createdAt: tokenRule.createdAt.toISOString(),
    updatedAt: tokenRule.updatedAt.toISOString(),
  };
}
