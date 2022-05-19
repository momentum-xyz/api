import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserService } from '../user/user.service';
import { bytesToUuid, uuidToBytes } from '../utils/uuid-converter';
import { User } from '../user/user.entity';
import { UserSpaceService } from '../user-space/user-space.service';
import { Space } from '../space/space.entity';
import { SpaceService } from '../space/space.service';
import { OnlineUserService } from './online-user.service';
import { OnlineUser } from './online-user.entity';
import { UiType } from '../ui-type/ui-type.entity';
import { UiTypeService } from '../ui-type/ui-type.service';
import { UiTypes } from '../ui-type/ui-type.interface';

@ApiTags('online-user')
@Controller('online-user')
export class OnlineUserController {
  constructor(
    private userService: UserService,
    private spaceService: SpaceService,
    private userSpaceService: UserSpaceService,
    private uiTypeService: UiTypeService,
    private onlineUserService: OnlineUserService,
  ) {}

  @ApiOperation({
    description: 'Checks if a user is currently in a space with a dashboard',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a boolean',
  })
  @ApiBearerAuth()
  @Get('check/:userId')
  async check(@Param() params): Promise<boolean> {
    const user: User = await this.userService.findOne(uuidToBytes(params.userId));
    const uiType: UiType = await this.uiTypeService.findOne(UiTypes.DASHBOARD);
    const onlineUser: OnlineUser = await this.onlineUserService.findOne(user);

    return onlineUser.space.uiTypeId.equals(uiType.id);
  }

  @ApiOperation({
    description: 'Gets the spaceId the user is in',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a spaceId',
    type: Space,
  })
  @ApiBearerAuth()
  @Get('space/:userId')
  async getSpace(@Param() params): Promise<string> {
    const user: User = await this.userService.findOne(uuidToBytes(params.userId));
    const onlineUser: OnlineUser = await this.onlineUserService.findOne(user);

    return bytesToUuid(onlineUser.space.id);
  }
}
