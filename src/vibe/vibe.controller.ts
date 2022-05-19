import { v4 as uuidv4 } from 'uuid';
import { BadRequestException, Body, Controller, Get, HttpStatus, Param, Post, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { bytesToUuid, uuidToBytes } from '../utils/uuid-converter';
import { VibeService } from './vibe.service';
import { MqttService } from '../services/mqtt.service';
import { SpaceService } from '../space/space.service';
import { Space } from '../space/space.entity';
import { TokenInterface } from '../auth/auth.interface';
import { Response } from 'express';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { Vibe } from './vibe.entity';

export interface CountDto {
  count: number;
}

export enum VibeAction {
  INCREMENT = '+1',
  DECREMENT = '-1',
}

export interface VibeDto {
  vibeAction: VibeAction;
}

@ApiTags('vibes')
@Controller('vibes')
export class VibeController {
  constructor(
    private userService: UserService,
    private spaceService: SpaceService,
    private vibeService: VibeService,
    private client: MqttService,
  ) {}

  @ApiOperation({
    description: 'Returns the vibe count of a Space',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the vibe count of a Space',
  })
  @Get(':spaceId/count')
  async getCount(@Param() params): Promise<CountDto> {
    const space: Space = await this.spaceService.findOne(uuidToBytes(params.spaceId));
    const count: number = await this.vibeService.getCount(space);

    return {
      count: count,
    };
  }

  @ApiOperation({
    description: 'Checks if a user is allowed to vibe a space',
  })
  @ApiResponse({
    status: 200,
    description: 'Checks if a user is allowed to vibe a space',
  })
  @Get(':spaceId/check')
  async check(@Req() request: TokenInterface, @Param() params): Promise<boolean> {
    const space: Space = await this.spaceService.findOne(uuidToBytes(params.spaceId));
    const user: User = await this.userService.findOne(uuidToBytes(request.user.sub));

    const exists = await this.vibeService.findOne(space, user);

    return !exists;
  }

  @ApiOperation({
    description: 'Adds or removes a vibe for a user',
  })
  @ApiResponse({
    status: 201,
    description: 'Adds or removes a vibe for a user',
  })
  @Post(':spaceId/toggle')
  async toggle(
    @Res() response: Response,
    @Req() request: TokenInterface,
    @Body() body: VibeDto,
    @Param() params,
  ): Promise<Response> {
    const space: Space = await this.spaceService.findOne(uuidToBytes(params.spaceId));
    const user: User = await this.userService.findOne(uuidToBytes(request.user.sub));

    if (body.vibeAction === VibeAction.INCREMENT) {
      const exists = await this.vibeService.findOne(space, user);

      if (exists) {
        throw new BadRequestException('User can not vibe a space twice');
      }

      await this.vibeService.create(user, space);
    } else {
      const vibe: Vibe = await this.vibeService.findOne(space, user);

      if (!vibe) {
        throw new BadRequestException('Existing Vibe not found');
      }

      await this.vibeService.delete(vibe);
    }

    const count: number = await this.vibeService.getCount(space);

    await this.client.publish(
      `space_control/${bytesToUuid(space.id)}/relay/vibe`,
      JSON.stringify({
        userId: bytesToUuid(user.id),
        type: body.vibeAction,
        count: count,
      }),
      false,
      uuidv4(),
    );

    return response.status(HttpStatus.CREATED).json({
      status: HttpStatus.CREATED,
      message: 'Successfully toggled Vibe',
    });
  }
}
