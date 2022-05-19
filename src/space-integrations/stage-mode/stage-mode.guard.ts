import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Space } from '../../space/space.entity';
import { UserService } from '../../user/user.service';
import { UserSpaceService } from '../../user-space/user-space.service';
import { uuidToBytes } from '../../utils/uuid-converter';
import { SpaceService } from '../../space/space.service';
import { User } from '../../user/user.entity';

@Injectable()
export class StageModeGuard implements CanActivate {
  constructor(
    private userSpaceService: UserSpaceService,
    private spaceService: SpaceService,
    private userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const space = await this.spaceService.findOne(uuidToBytes(request.params.spaceId));
    const user: User = await this.userService.findOne(uuidToBytes(request.user.sub));
    return await this.userSpaceService.isMember(space, user);
  }
}
