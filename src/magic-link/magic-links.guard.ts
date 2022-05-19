import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { uuidToBytes } from '../utils/uuid-converter';
import { UserService } from '../user/user.service';
import { SpaceService } from '../space/space.service';
import { UserSpaceService } from '../user-space/user-space.service';
import { MagicType } from './magic-links.dto';
import { Space } from '../space/space.entity';
import { User } from '../user/user.entity';

@Injectable()
export class MagicLinksGuard implements CanActivate {
  constructor(
    private userSpaceService: UserSpaceService,
    private spaceService: SpaceService,
    private userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    let space: Space;
    let canActivate = false;

    if (request.route.path.includes('generate-link')) {
      switch (request.body.type) {
        case MagicType.OPEN_SPACE:
        case MagicType.JOIN_MEETING:
          // space = await this.spaceService.findOne(uuidToBytes(request.body.data.id));
          // const user: User = await this.userService.findOne(uuidToBytes(request.user.sub));
          //
          // canActivate = await this.userSpaceService.isMember(space, user);
          canActivate = true;
          break;
        case MagicType.FLY:
          canActivate = true;
          break;
        case MagicType.EVENT:
          canActivate = true;
          break;
      }
    }

    return canActivate;
  }
}
