import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from '../../user/user.entity';
import { UserService } from '../../user/user.service';
import { Space } from '../../space/space.entity';
import { bytesToUuid, uuidToBytes } from '../../utils/uuid-converter';
import { UserSpaceService } from '../../user-space/user-space.service';
import { StageModeGuard } from './stage-mode.guard';
import { SpaceService } from '../../space/space.service';
import { SpaceIntegrationUsersService } from '../../space-integration-users/space-integration-users.service';
import { IntegrationTypes } from '../../integration-type/integration-type.interface';
import { IntegrationTypeService } from '../../integration-type/integration-type.service';
import { IntegrationType } from '../../integration-type/integration-type.entity';
import { StageModeService } from './stage-mode.service';
import { TokenInterface } from '../../auth/auth.interface';
import { SpaceIntegration } from '../space-integrations.entity';
import { SpaceIntegrationsService } from '../space-integrations.service';
import { SpaceIntegrationUser } from '../../space-integration-users/space-integration-users.entity';
import { SpaceIntegrationUserStatus } from '../../space-integration-users/space-integration-users.interface';
import {
  ModerationType,
  StageModeKickAdmitDto,
  StageModeMuteDto,
  StageModeRequestType,
  StageModeUserRole,
} from '../space-integrations.interface';
import { MessageBusAdmitStatus } from './stage-mode.interface';

@ApiTags('stage-mode')
@Controller('stage-mode')
export class StageModeController {
  constructor(
    private stageModeService: StageModeService,
    private spaceService: SpaceService,
    private userService: UserService,
    private userSpaceService: UserSpaceService,
    private spaceIntegrationService: SpaceIntegrationsService,
    private spaceIntegrationUsersService: SpaceIntegrationUsersService,
    private integrationTypeService: IntegrationTypeService,
  ) {}

  @ApiOperation({ description: 'Join the stage-mode integration for a space.' })
  @ApiResponse({
    status: 200,
    description: 'Returns a stage mode instance',
    type: SpaceIntegrationUser,
  })
  @Post(':spaceId/join')
  async joinInstance(@Param('spaceId') spaceId: string, @Req() request: TokenInterface): Promise<SpaceIntegration> {
    const spaceIntegration = await this.getSpaceIntegration(spaceId);
    const user = await this.userService.findOne(uuidToBytes(request.user.sub));

    const spaceIntegrationUsers = await this.spaceIntegrationUsersService.findWhereSpace(spaceIntegration);
    const spaceIntegrationUser = spaceIntegrationUsers.find((sIU) => bytesToUuid(sIU.userId) === request.user.sub);
    if (spaceIntegrationUser) {
      // Leave all existing instances before joining a new one
      const activeSIUsers = await this.spaceIntegrationUsersService.findWhereUser(user);

      for (const aSIU of activeSIUsers) {
        aSIU.flag = SpaceIntegrationUserStatus.LEFT;
        aSIU.data = { role: StageModeUserRole.AUDIENCE_MEMBER };
        await this.spaceIntegrationUsersService.updateStatus(aSIU);
      }
    }

    try {
      const sIU = await this.spaceIntegrationUsersService.findDistinct(spaceIntegration, user);
      if (sIU) {
        sIU.flag = SpaceIntegrationUserStatus.JOINED;
        sIU.data = { role: StageModeUserRole.AUDIENCE_MEMBER };
        await this.spaceIntegrationUsersService.updateStatus(sIU);
        await this.stageModeService.handleJoin(sIU);
      } else {
        const newSpaceIntegrationUser: SpaceIntegrationUser = new SpaceIntegrationUser();
        newSpaceIntegrationUser.spaceId = spaceIntegration.spaceId;
        newSpaceIntegrationUser.integrationTypeId = spaceIntegration.integrationTypeId;
        newSpaceIntegrationUser.userId = user.id;
        newSpaceIntegrationUser.flag = SpaceIntegrationUserStatus.JOINED;
        newSpaceIntegrationUser.data = { role: StageModeUserRole.AUDIENCE_MEMBER };

        await this.spaceIntegrationUsersService.create(newSpaceIntegrationUser);
        await this.stageModeService.handleJoin(newSpaceIntegrationUser);
      }
    } catch (e) {
      console.log(e);
    }

    return this.getSpaceIntegration(spaceId);
  }

  @ApiOperation({ description: 'Leave the stage-mode instance of a space.' })
  @ApiResponse({
    status: 200,
    description: 'Returns a stage mode instance',
    type: SpaceIntegration,
  })
  @Post(':spaceId/leave')
  async leave(@Param('spaceId') spaceId: string, @Req() request: TokenInterface): Promise<SpaceIntegration> {
    const spaceIntegration = await this.getSpaceIntegration(spaceId);

    const spaceIntegrationUsers = await this.spaceIntegrationUsersService.findWhereSpace(spaceIntegration);
    const spaceIntegrationUser = spaceIntegrationUsers.find((sIU) => bytesToUuid(sIU.userId) === request.user.sub);
    if (spaceIntegrationUser) {
      spaceIntegrationUser.flag = SpaceIntegrationUserStatus.LEFT;
      await this.spaceIntegrationUsersService.updateStatus(spaceIntegrationUser);
      await this.stageModeService.handleLeave(spaceIntegrationUser);
    }

    return this.getSpaceIntegration(spaceId);
  }

  @ApiOperation({
    description: 'Request to go on stage by an audience member.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a space-integration instance',
    type: SpaceIntegration,
  })
  @Post(':spaceId/request')
  //@UseGuards(StageModeGuard) TODO: implement check of 'audience' user role
  async request(@Param('spaceId') spaceId: string, @Req() request: TokenInterface): Promise<SpaceIntegration> {
    const spaceIntegration: SpaceIntegration = await this.getSpaceIntegration(spaceId);

    // Sends a request to moderators to admit a user to a stage
    const requestor: User = await this.userService.findOne(uuidToBytes(request.user.sub));
    const spaceIntegrationUser: SpaceIntegrationUser = await this.spaceIntegrationUsersService.findDistinct(
      spaceIntegration,
      requestor,
    );
    if (!spaceIntegrationUser) {
      throw new BadRequestException('Only users active in a space-integration can make a request.');
    }

    await this.stageModeService.handleRequest(spaceIntegration.space, requestor);
    return spaceIntegration;
  }

  @ApiOperation({
    description: 'Accept or decline a request made by an audience member.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['userId'],
      properties: {
        userId: {
          type: 'string',
          description: 'GUID of user to accept',
          example: '79ebe32f-cb3e-4a66-b4bc-30c3e7e58e2e',
        },
        stageModeRequestType: {
          type: 'string',
          enum: [StageModeRequestType.ACCEPT, StageModeRequestType.DECLINE],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    schema: {
      type: 'string',
      enum: ['accepted', 'declined', 'already accepted'],
    },
    description: 'Returns state change indication',
  })
  @Post(':spaceId/request/response')
  @UseGuards(StageModeGuard)
  async requestResponse(
    @Param('spaceId') spaceId: string,
    @Req() request: TokenInterface,
    @Body() body: { userId: string; stageModeRequestType: string },
  ): Promise<string> {
    const spaceIntegration: SpaceIntegration = await this.getSpaceIntegration(spaceId);
    const requestor = await this.userService.findOne(uuidToBytes(body.userId));

    const worldId: Buffer = await this.spaceService.getWorldId(spaceIntegration.space);

    const spaceIntegrationUser: SpaceIntegrationUser = await this.spaceIntegrationUsersService.findDistinct(
      spaceIntegration,
      requestor,
    );
    if (!spaceIntegrationUser) {
      throw new BadRequestException('Only users active in a space-integration can make a request.');
    }
    if (body.stageModeRequestType === StageModeRequestType.ACCEPT) {
      if (spaceIntegrationUser.data.role !== StageModeUserRole.SPEAKER) {
        spaceIntegrationUser.data = { role: StageModeUserRole.SPEAKER };
        await this.spaceIntegrationUsersService.updateData(spaceIntegrationUser);

        await this.stageModeService.handleRequestAcceptDecline(
          spaceIntegration.space,
          requestor,
          MessageBusAdmitStatus.ACCEPT,
          worldId,
        );
        await this.stageModeService.update(spaceIntegration);
        return 'accepted';
      } else {
        console.debug('User already speaker, ignoring');
        await this.stageModeService.handleRequestAcceptDecline(
          spaceIntegration.space,
          requestor,
          MessageBusAdmitStatus.ACCEPT,
          worldId,
        );
        return 'already accepted';
      }
    } else {
      await this.stageModeService.handleRequestAcceptDecline(
        spaceIntegration.space,
        requestor,
        MessageBusAdmitStatus.DECLINE,
        worldId,
      );
      return 'declined';
    }
  }

  @ApiOperation({
    description: 'Invite an audience member to the stage',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['userId'],
      properties: {
        userId: {
          type: 'string',
          description: 'GUID of user to invite',
          example: '79ebe32f-cb3e-4a66-b4bc-30c3e7e58e2e',
        },
      },
    },
  })
  @Post(':spaceId/invite')
  async invite(
    @Param('spaceId') spaceId: string,
    @Req() request: TokenInterface,
    @Body() body: { userId: string },
  ): Promise<void> {
    const spaceIntegration: SpaceIntegration = await this.getSpaceIntegration(spaceId);
    const invitor: User = await this.userService.findOne(uuidToBytes(request.user.sub));
    const actor: User = await this.userService.findOne(uuidToBytes(body.userId));
    const spaceIntegrationUser: SpaceIntegrationUser = await this.spaceIntegrationUsersService.findDistinct(
      spaceIntegration,
      actor,
    );

    const worldId: Buffer = await this.spaceService.getWorldId(spaceIntegration.space);

    if (!spaceIntegrationUser) {
      throw new BadRequestException('Only users active in a space-integration can make a request');
    }

    if (!(await this.isModerator(invitor, spaceIntegration.space))) {
      throw new UnauthorizedException('User not a member of this space, not allowed to invite.');
    }

    spaceIntegrationUser.data = { role: StageModeUserRole.INVITED };
    await this.spaceIntegrationUsersService.updateData(spaceIntegrationUser);
    await this.stageModeService.handleInvite(spaceIntegration.space, actor, invitor, worldId);
  }

  @ApiOperation({
    description: 'Accept or decline an invite as an audience member',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['stageModeRequestType'],
      properties: {
        stageModeRequestType: {
          type: 'string',
          enum: [StageModeRequestType.ACCEPT, StageModeRequestType.DECLINE],
        },
      },
    },
  })
  @ApiResponse({
    status: 204,
    description: 'Empty response',
  })
  @Post(':spaceId/invite/response')
  async inviteResponse(
    @Param('spaceId') spaceId: string,
    @Req() request: TokenInterface,
    @Body() body: { stageModeRequestType: string },
  ): Promise<void> {
    const spaceIntegration: SpaceIntegration = await this.getSpaceIntegration(spaceId);
    const user = await this.userService.findOne(uuidToBytes(request.user.sub));
    const spaceIntegrationUser: SpaceIntegrationUser = await this.spaceIntegrationUsersService.findDistinct(
      spaceIntegration,
      user,
    );

    if (!spaceIntegrationUser) {
      throw new BadRequestException('Only users active in a space-integration can make a request.');
    }

    const wantedRole =
      body.stageModeRequestType === StageModeRequestType.ACCEPT
        ? { role: StageModeUserRole.SPEAKER }
        : { role: StageModeUserRole.AUDIENCE_MEMBER };
    if (spaceIntegrationUser.data === wantedRole) {
      console.debug(`User already has ${wantedRole} role, ignoring.`);
      return;
    } else if (spaceIntegrationUser.data.role !== StageModeUserRole.INVITED) {
      throw new BadRequestException('User was not invited to the stage');
    }
    spaceIntegrationUser.data = wantedRole;
    await this.spaceIntegrationUsersService.updateData(spaceIntegrationUser);
    // TODO: make .update detect and handle both?
    if (body.stageModeRequestType === StageModeRequestType.ACCEPT) {
      await this.stageModeService.update(spaceIntegration);
    } else if (body.stageModeRequestType === StageModeRequestType.DECLINE) {
      await this.stageModeService.handleInviteDecline(spaceIntegration.space, user);
    }
  }

  @ApiOperation({
    description: 'Admits or kicks a user on/off stage changing their participant-role',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a Stage Mode instance',
    type: SpaceIntegration,
  })
  @Post(':spaceId/mute')
  @UseGuards(StageModeGuard)
  async mute(
    @Param('spaceId') spaceId: string,
    @Req() request: TokenInterface,
    @Body() stageModeMuteDto: StageModeMuteDto,
  ): Promise<SpaceIntegration> {
    const spaceIntegration: SpaceIntegration = await this.getSpaceIntegration(spaceId);

    const actor: User = await this.userService.findOne(uuidToBytes(stageModeMuteDto.userId));
    const spaceIntegrationUser: SpaceIntegrationUser = await this.spaceIntegrationUsersService.findDistinct(
      spaceIntegration,
      actor,
    );

    if (!spaceIntegrationUser) {
      throw new BadRequestException('Only users active in a space-integration can make a request');
    }

    const worldId: Buffer = await this.spaceService.getWorldId(spaceIntegration.space);

    try {
      await this.stageModeService.handleMute(spaceIntegrationUser, worldId);
    } catch (e) {
      console.log(e);
    }

    return spaceIntegration;
  }

  @ApiOperation({
    description: 'Mutes a stage-mode user',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a Stage Mode instance',
    type: SpaceIntegration,
  })
  @Post(':spaceId/admit-or-kick')
  @UseGuards(StageModeGuard)
  async admit(
    @Param('spaceId') spaceId: string,
    @Req() request: TokenInterface,
    @Body() stageModeKickAdmitDto: StageModeKickAdmitDto,
  ): Promise<SpaceIntegration> {
    const spaceIntegration: SpaceIntegration = await this.getSpaceIntegration(spaceId);

    const actor: User = await this.userService.findOne(uuidToBytes(stageModeKickAdmitDto.userId));
    const spaceIntegrationUser: SpaceIntegrationUser = await this.spaceIntegrationUsersService.findDistinct(
      spaceIntegration,
      actor,
    );
    if (!spaceIntegrationUser) {
      throw new BadRequestException('Only users active in a space-integration can make a request');
    }

    try {
      const isAdmit = stageModeKickAdmitDto.modType === ModerationType.ADMIT;
      spaceIntegrationUser.data = isAdmit
        ? { role: StageModeUserRole.SPEAKER }
        : { role: StageModeUserRole.AUDIENCE_MEMBER };

      await this.spaceIntegrationUsersService.updateData(spaceIntegrationUser);
      if (!isAdmit) {
        await this.stageModeService.handleKick(spaceIntegrationUser);
      }
      await this.stageModeService.update(spaceIntegration);
    } catch (e) {
      console.log(e);
    }

    return spaceIntegration;
  }

  /** Is gives user considered a moderator of the stage
   *
   * Currently an admin or member of the Space.
   */
  async isModerator(user: User, space: Space): Promise<boolean> {
    return await this.userSpaceService.isMember(space, user);
  }

  /**
   * Get the stage-mode integration instance for a space.
   *
   * throws BadRequestException if it doesn't exist.
   */
  async getSpaceIntegration(spaceId: string): Promise<SpaceIntegration> {
    const space: Space = await this.spaceService.findOne(uuidToBytes(spaceId));
    const integrationType: IntegrationType = await this.integrationTypeService.findOne(IntegrationTypes.STAGE_MODE);

    const spaceIntegration = await this.spaceIntegrationService.findOneBySpaceAndIntegration(space, integrationType);
    if (!spaceIntegration) {
      throw new BadRequestException('Could not find stage mode integration for space `${space.id}`. Is it enabled?');
    }
    return spaceIntegration;
  }
}
