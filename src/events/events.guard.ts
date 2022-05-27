import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { UserSpaceService } from '../user-space/user-space.service';
import { uuidToBytes } from '../utils/uuid-converter';
import { UserService } from '../user/user.service';
import { User } from '../user/user.entity';
import { SpaceService } from '../space/space.service';

@Injectable()
export class EventsGuard implements CanActivate {
  constructor(
    private userSpaceService: UserSpaceService,
    private spaceService: SpaceService,
    private userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const space = await this.spaceService.findOne(uuidToBytes(request.params.spaceId));

    const user: User = await this.userService.findOne(uuidToBytes(request.user.sub));
    const canAccess: boolean = await this.userSpaceService.canAccess(space, user);

    if (!canAccess) {
      return !space.secret;
    } else {
      return canAccess;
    }
  }
}
