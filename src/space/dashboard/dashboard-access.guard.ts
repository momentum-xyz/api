import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { uuidToBytes } from '../../utils/uuid-converter';
import { SpaceService } from '../space.service';
import { UserService } from '../../user/user.service';
import { Space } from '../space.entity';
import { User } from '../../user/user.entity';
import { UserSpaceService } from '../../user-space/user-space.service';

@Injectable()
export class DashboardAccessGuard implements CanActivate {
  constructor(
    private spaceService: SpaceService,
    private userService: UserService,
    private userSpaceService: UserSpaceService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    let space: Space;

    if (request.params.id) {
      space = await this.spaceService.findOne(uuidToBytes(request.params.id));
    } else {
      space = await this.spaceService.findOne(uuidToBytes(request.params.spaceId));
    }

    const user: User = await this.userService.findOne(uuidToBytes(request.user.sub));
    const canAccess: boolean = await this.userSpaceService.canAccess(space, user);

    if (!canAccess) {
      return !space.secret;
    } else {
      return canAccess;
    }
  }
}
