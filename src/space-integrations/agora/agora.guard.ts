import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { uuidToBytes } from '../../utils/uuid-converter';
import { UserService } from '../../user/user.service';
import { User } from '../../user/user.entity';
import { UserSpaceService } from '../../user-space/user-space.service';
import { SpaceService } from '../../space/space.service';
import { Space } from '../../space/space.entity';

@Injectable()
export class AgoraGuard implements CanActivate {
  constructor(
    private spaceService: SpaceService,
    private userService: UserService,
    private userSpaceService: UserSpaceService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    let spaceId: string;

    if (request.params.channel && request.params.channel.includes('stage-')) {
      spaceId = request.params.channel.replace('stage-', '');
    } else {
      spaceId = request.params.channel;
    }

    const space = spaceId ? await this.spaceService.findOne(uuidToBytes(spaceId)) : undefined;
    if (space) {
      const user: User = await this.userService.findOne(uuidToBytes(request.user.sub));
      const canAccess: boolean = await this.userSpaceService.canAccess(space, user);

      if (!canAccess) {
        return !space.secret;
      } else {
        return canAccess;
      }
    } else {
      return true;
    }
  }
}
