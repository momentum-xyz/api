import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MailerService } from '@nestjs-modules/mailer';
import { Response } from 'express';
import { UserTypeService } from '../user-type/user-type.service';
import { bytesToUuid, generateUuid, uuidToBytes } from '../utils/uuid-converter';
import { UserSpaceService } from '../user-space/user-space.service';
import { SpaceService } from '../space/space.service';
import { SearchGuard } from './search.guard';
import { InviteGuard } from './invite.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserMembershipService } from '../user-membership/user-membership.service';
import { InvitationService } from '../invitation/invitation.service';
import { Invitation } from '../invitation/invitation.entity';
import { UserSpace } from '../user-space/user-space.entity';
import { User } from './user.entity';
import { Space } from '../space/space.entity';
import { InvitationDto } from '../invitation/invitation.interface';
import { AuthService } from '../auth/auth.service';
import { TokenInterface } from '../auth/auth.interface';
import { Unprotected } from '../auth/decorators/unprotected.decorator';
import { SpaceType } from '../space-type/space-type.entity';
import { SpaceTypeService } from '../space-type/space-type.service';
import { ISpaceType } from '../space-type/space-type.interface';
import { OnlineUserService } from '../online-user/online-user.service';
import { OnlineUser } from '../online-user/online-user.entity';
import { MqttService } from '../services/mqtt.service';
import { UserDto, UserSearchResult } from './user.interface';
import { paginateCollection, PaginatedCollection } from '../utils/pagination';
import { UrlMappingService } from '../url-mapping/url-mapping.service';
import { UrlMapping } from '../url-mapping/url-mapping.entity';
import { OIDCService } from '../auth/oidc/oidc.service';

@ApiTags('users')
@Controller('users')
export class UserController {
  private ROOT_ID = '00000000-0000-0000-0000-000000000000';

  constructor(
    private authService: AuthService,
    private oidcService: OIDCService,
    private userService: UserService,
    private userOnlineService: OnlineUserService,
    private userSpaceService: UserSpaceService,
    private userMembershipService: UserMembershipService,
    private spaceService: SpaceService,
    private spaceTypeService: SpaceTypeService,
    private userTypeService: UserTypeService,
    private mailerService: MailerService,
    private urlMappingService: UrlMappingService,
    private invitationService: InvitationService,
    private client: MqttService,
  ) {}

  @ApiOperation({
    description: 'Returns user-information based on token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns user-information based on token.',
    type: User,
  })
  @ApiBearerAuth()
  @Get('me')
  async findMe(@Req() request: TokenInterface): Promise<any> {
    const user: User = await this.userService.findOne(uuidToBytes(request.user.sub));
    const space: Space = await this.spaceService.findOne(uuidToBytes(this.ROOT_ID));

    const isNodeAdmin: boolean = await this.userSpaceService.isAdmin(space, user);
    return {
      ...user,
      isNodeAdmin: isNodeAdmin,
    };
  }

  @ApiOperation({
    description: 'Returns all users associated to me.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns all users associated to me.',
    type: User,
  })
  @ApiBearerAuth()
  @Get('me/associated')
  async getCompoundUsers(@Req() request: TokenInterface): Promise<Buffer[]> {
    return await this.userMembershipService.findAssociatedUsers(uuidToBytes(request.user.sub));
  }

  // @ApiOperation({
  //   description: 'Decoded token Test.',
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Returns Decoded token Test.',
  // })
  // @ApiBearerAuth()
  // @Unprotected()
  // @Post('test/token')
  // async token(@Req() request: TokenInterface, @Body() tokenObject: any): Promise<any> {
  //   const dec: any = await this.authService.decodeIdToken(tokenObject);
  //   return dec;
  // }

  @ApiOperation({
    description: 'Returns all online user names alphabetically',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns all online user names alphabetically.',
    type: User,
  })
  @ApiBearerAuth()
  @Get('online/:worldId')
  async getOnlineUsers(@Req() request: TokenInterface, @Param('worldId') worldId: string): Promise<UserSearchResult[]> {
    const onlineUsers: OnlineUser[] = await this.userOnlineService.findAll(uuidToBytes(worldId));
    const userSearchResults: UserSearchResult[] = [];
    onlineUsers.forEach((onlineUser) => {
      userSearchResults.push({
        id: onlineUser.userId,
        name: onlineUser.user.name,
        profile: onlineUser.user.profile,
        status: onlineUser.user.status,
      });
    });

    return userSearchResults;
  }

  @ApiOperation({
    description: 'Returns all initiatives associated with userId.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns all initiatives associated with userId.',
    type: User,
  })
  @ApiBearerAuth()
  @Get(':userId/initiatives')
  async getUserInitiatives(
    @Req() request: TokenInterface,
    @Param() params,
    @Query('world') worldId: string,
  ): Promise<UserSpace[]> {
    const user: User = await this.userService.findOne(uuidToBytes(params.userId));
    const challengeInitiativeType: SpaceType = await this.spaceTypeService.findOne(ISpaceType.CHALLENGE_INITIATIVE);
    const projectInitiativeType: SpaceType = await this.spaceTypeService.findOne(ISpaceType.PROJECT_INITIATIVE);

    const validTypes: Buffer[] = [challengeInitiativeType.id, projectInitiativeType.id];

    if (!user) {
      throw Error('No user found');
    }

    let world: Space;
    if (worldId) {
      world = await this.spaceService.findOne(uuidToBytes(worldId));
      if (!world) {
        throw Error(`Could not find corresponding world ${worldId}`);
      }
    }

    let initiatives = await this.userSpaceService.findAssociatedInitiatives(user, validTypes);
    if (world) {
      // TODO: move filtering into service/db queries (require recurive search)
      const asyncFilter = async (arr, predicate) =>
        Promise.all(arr.map(predicate)).then((results) => arr.filter((_v, index) => results[index]));
      initiatives = await asyncFilter(initiatives, async (userSpace) => {
        const spaceWorld = await this.spaceService.getWorldId(userSpace.space);
        return world.id.equals(spaceWorld);
      });
    }

    return initiatives;
  }

  @ApiOperation({
    description: 'Find users based on name, add ?q=.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns user-information based on query.',
    type: User,
  })
  @ApiBearerAuth()
  @Get('search')
  @UseGuards(SearchGuard)
  async search(
    @Query('q') searchQuery: string,
    @Query('limit') limit: number,
    @Query('page') page: number,
    @Query('online') onlineParam: string,
    @Query('worldId') worldId: string,
  ): Promise<PaginatedCollection> {
    const userResults: UserSearchResult[] = [];
    let users: User[];

    const online = onlineParam == 'true';
    if (online) {
      if (!worldId) {
        throw new BadRequestException('worldId required when filtering on online users.');
      }

      const onlineUsers: OnlineUser[] = await this.userOnlineService.findAll(uuidToBytes(worldId));
      users = onlineUsers.map((oU) => oU.user);
    } else {
      users = await this.userService.filter(searchQuery);
    }

    const filteredUsers: User[] = users.filter((user) => {
      return (
        user.name.toLowerCase().indexOf(searchQuery.toLowerCase()) >= 0 ||
        user.email.toLowerCase().indexOf(searchQuery.toLowerCase()) >= 0
      );
    });

    filteredUsers.forEach((user) => {
      const usr: UserSearchResult = {
        id: user.id,
        name: user.name,
        profile: user.profile,
        status: user.status,
      };

      userResults.push(usr);
    });

    return paginateCollection(userResults, page, limit);
  }

  @ApiOperation({
    description: 'Returns a user based on id param',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a specific user',
    type: User,
  })
  @Unprotected()
  @Get('profile/:id')
  async findProfile(@Param('id') userId: string): Promise<any> {
    const user: User = await this.userService.findOne(uuidToBytes(userId));

    delete user.email;

    return {
      ...user,
      parsedId: bytesToUuid(user.id),
    };
  }

  @ApiOperation({
    description: 'Uploads a user avatar',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a specific user',
    type: User,
  })
  @ApiBearerAuth()
  @Post('avatar/upload')
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @Req() request: TokenInterface,
    @Param() params,
    @UploadedFile() avatar: Express.Multer.File,
    @Res() response: Response,
  ): Promise<Response> {
    const hashResponse = await this.userService.uploadAvatar(avatar);
    const user: User = await this.userService.findOne(uuidToBytes(request.user.sub));

    if (hashResponse) {
      user.profile.avatarHash = hashResponse.data.hash;
      const queryResponse = await this.userService.updateProfile(user);
      if (queryResponse.affectedRows > 0) {
        return response.status(HttpStatus.CREATED).json({
          status: HttpStatus.CREATED,
          message: 'Successfully updated user avatar',
          hash: hashResponse.data.hash,
        });
      }
    } else {
      return response.status(HttpStatus.BAD_GATEWAY).json({
        status: HttpStatus.BAD_GATEWAY,
        message: 'Could not get a hash from render-server',
      });
    }
  }

  @ApiOperation({
    description: 'Updates a users name',
  })
  @ApiResponse({
    status: 200,
    description: 'Updates a users name',
    type: User,
  })
  @ApiBearerAuth()
  @Put('set-name')
  async setName(
    @Param() params,
    @Body() request: UserDto,
    @Res() response: Response,
    @Req() token: TokenInterface,
  ): Promise<Response> {
    const foundUser: User = await this.userService.findOne(uuidToBytes(token.user.sub));

    if (!foundUser) {
      return response.status(HttpStatus.NOT_FOUND).json({
        status: HttpStatus.NOT_FOUND,
        message: 'Could not find a user to edit',
      });
    } else {
      foundUser.name = request.name;

      const savedUser: User = await this.userService.update(foundUser);

      if (savedUser) {
        return response.status(HttpStatus.OK).json({
          status: HttpStatus.OK,
          message: 'Successfully edited name',
        });
      } else {
        return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Could not edit the users name',
        });
      }
    }
  }

  @ApiOperation({
    description: 'Creates a new invitation for a user and dispatches an e-mail',
  })
  @ApiResponse({
    status: 201,
    description: 'Returns 201 if user has been invited and e-mail dispatched',
  })
  @ApiBearerAuth()
  @Post('invite')
  @UseGuards(InviteGuard)
  async inviteUser(@Body() request: InvitationDto, @Res() response: Response): Promise<Response> {
    const user: User = await this.userService.findOneByEmail(request.email);
    const space: Space = await this.spaceService.findOne(uuidToBytes(request.spaceId));

    if (user) {
      const userSpace: UserSpace = new UserSpace();
      userSpace.user = user;
      userSpace.space = space;
      userSpace.isAdmin = request.isAdmin;

      return response.status(HttpStatus.CREATED).json({
        status: HttpStatus.CREATED,
        message: 'User successfully added to space',
      });
    }

    const invitation: Invitation = new Invitation();
    invitation.email = request.email;

    if (space) {
      invitation.space = space;
      invitation.isAdmin = request.isAdmin;

      const date: Date = new Date();
      date.setDate(date.getDate() + 1);

      invitation.expiresAt = date;

      const savedInvitation: Invitation = await this.invitationService.create(invitation);

      if (savedInvitation) {
        const worldId: Buffer = await this.spaceService.getWorldId(space);
        const urlMap: UrlMapping = await this.urlMappingService.findOne(worldId);

        await this.mailerService.sendMail({
          to: request.email,
          from: process.env.MAILER_ACCOUNT,
          sender: 'Odyssey Momentum',
          subject: 'You have been invited to join a Momentum space!',
          html:
            '<body> <h3>Register yourself now by clicking ' +
            '<a href=' +
            urlMap.URL +
            '>here</a>' +
            '</h3> ' +
            '</body>',
        });

        return response.status(HttpStatus.CREATED).json({
          status: HttpStatus.CREATED,
          message: 'Invitation was successfully created',
        });
      } else {
        return response.status(HttpStatus.NOT_FOUND).json({
          status: HttpStatus.NOT_FOUND,
          message: 'Something went wrong with inviting the user',
        });
      }
    } else {
      return response.status(HttpStatus.NOT_FOUND).json({
        status: HttpStatus.NOT_FOUND,
        message: 'Could not find a project to invite the user to',
      });
    }
  }

  @ApiOperation({
    description: 'Checks if a logged in user exists in the database and is onboarded',
  })
  @ApiResponse({
    status: 201,
    description: 'Returns 200 if user exists and 201 if its created and not onboarded',
  })
  @Post('check')
  @ApiBearerAuth()
  async checkUser(
    @Req() request: TokenInterface,
    @Body() tokenObject: any,
    @Res() response: Response,
  ): Promise<Response> {
    const userId: Buffer = await this.authService.getIdFromToken(request, tokenObject);

    const foundUser: User = await this.userService.findOne(userId);
    const userOnboarded = !!foundUser.profile.onBoarded;

    await this.client.publish('updates/users/auth', bytesToUuid(foundUser.id), false, bytesToUuid(generateUuid()));

    return response.status(HttpStatus.OK).json({
      userOnboarded: userOnboarded,
    });
  }
}
