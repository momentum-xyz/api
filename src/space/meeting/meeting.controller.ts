import { Controller, HttpException, HttpStatus, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { UserService } from '../../user/user.service';
import { SpaceService } from '../space.service';
import { SpaceGuard } from '../space.guard';
import { MeetingService } from './meeting.service';
import { Space } from '../space.entity';
import { User } from '../../user/user.entity';
import { uuidToBytes } from '../../utils/uuid-converter';
import { TokenInterface } from '../../auth/auth.interface';

@ApiTags('meeting')
@Controller('meeting')
export class MeetingController {
  constructor(
    private spaceService: SpaceService,
    private userService: UserService,
    private meetingService: MeetingService,
  ) {}

  @ApiOperation({
    description: 'Mutes a specific user inside a meeting',
  })
  @ApiResponse({
    status: 200,
    description: 'Mutes a specific user inside a meeting',
  })
  @ApiBearerAuth()
  @Post(':spaceId/users/:userId/mute')
  @UseGuards(SpaceGuard)
  async muteUser(@Param('spaceId') spaceId, @Param('userId') userId, @Res() response: Response): Promise<Response> {
    const space: Space = await this.spaceService.findOne(uuidToBytes(spaceId));
    const user: User = await this.userService.findOne(uuidToBytes(userId));

    if (space && user) {
      const worldId: Buffer = await this.spaceService.getWorldId(space);
      await this.meetingService.handleMute(worldId, space, user);
      return response.status(HttpStatus.OK).json({
        message: 'Successfully dispatched mute message to user',
      });
    } else {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error: 'User or space do not exist',
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @ApiOperation({
    description: 'Kick a specific user from a meeting',
  })
  @ApiResponse({
    status: 200,
    description: 'Kick a specific user from a meeting',
  })
  @ApiBearerAuth()
  @Post(':spaceId/users/:userId/kick')
  @UseGuards(SpaceGuard)
  async kickUser(@Param('spaceId') spaceId, @Param('userId') userId, @Res() response: Response): Promise<Response> {
    const space: Space = await this.spaceService.findOne(uuidToBytes(spaceId));
    const user: User = await this.userService.findOne(uuidToBytes(userId));

    if (space && user) {
      const worldId: Buffer = await this.spaceService.getWorldId(space);
      await this.meetingService.handleKick(worldId, space, user);
      return response.status(HttpStatus.OK).json({
        message: 'Successfully dispatched kick message to user',
      });
    } else {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error: 'User or space do not exist',
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @ApiOperation({
    description: 'Mutes all users from a meeting',
  })
  @ApiResponse({
    status: 200,
    description: 'Mutes all users from a meeting',
  })
  @ApiBearerAuth()
  @Post(':spaceId/users/mute-all')
  @UseGuards(SpaceGuard)
  async muteAllUsers(
    @Param('spaceId') spaceId,
    @Req() request: TokenInterface,
    @Res() response: Response,
  ): Promise<Response> {
    const space: Space = await this.spaceService.findOne(uuidToBytes(spaceId));

    if (space) {
      await this.meetingService.handleMuteAll(space, request.user.sub);
      return response.status(HttpStatus.OK).json({
        message: 'Successfully dispatched mute-all message',
      });
    } else {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error: 'Space does not exist',
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
