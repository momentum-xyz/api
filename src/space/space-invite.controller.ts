import { Body, Controller, NotFoundException, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserService } from '../user/user.service';
import { SpaceService } from './space.service';
import { TokenInterface } from '../auth/auth.interface';
import { SpaceGuard } from './space.guard';
import { SpaceInviteDto } from './space.interface';
import { MqttService } from '../services/mqtt.service';
import { bytesToUuid, uuidToBytes } from '../utils/uuid-converter';
import { User } from '../user/user.entity';
import { Space } from './space.entity';
import { UserSpaceService } from '../user-space/user-space.service';
import { UiTypeService } from '../ui-type/ui-type.service';
import { UiType } from '../ui-type/ui-type.entity';

@ApiTags('space-invite')
@Controller('space-invite')
export class SpaceInviteController {
  constructor(
    private userService: UserService,
    private spaceService: SpaceService,
    private userSpaceService: UserSpaceService,
    private uiTypeService: UiTypeService,
    private client: MqttService,
  ) {}

  @ApiOperation({
    description: 'Sends a space invite to a user',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns true if invite has been sent',
  })
  @Post()
  @UseGuards(SpaceGuard)
  async inviteToSpace(@Req() request: TokenInterface, @Body() spaceInviteDto: SpaceInviteDto): Promise<boolean> {
    const space: Space = await this.spaceService.findOne(uuidToBytes(spaceInviteDto.spaceId));
    const invitee: User = await this.userService.findOne(uuidToBytes(spaceInviteDto.userId));
    const invitor: User = await this.userService.findOne(uuidToBytes(request.user.sub));
    const worldId: Buffer = await this.spaceService.getWorldId(space);
    const uiType: UiType = await this.uiTypeService.findById(space.spaceType.uiTypeId);

    if (!space || !invitee) {
      throw new NotFoundException(`Invitee or space not found`);
    }

    await this.client.publish(
      `user_control/${bytesToUuid(worldId)}/${spaceInviteDto.userId}/relay/invite`,
      JSON.stringify({
        spaceId: spaceInviteDto.spaceId,
        sender: {
          id: bytesToUuid(invitor.id),
          name: invitor.name,
        },
        uiTypeId: bytesToUuid(uiType.id),
        uiTypeName: uiType.name,
      }),
      false,
    );

    return true;
  }
}
