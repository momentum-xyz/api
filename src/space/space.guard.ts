import { Injectable, CanActivate, ExecutionContext, NotFoundException } from '@nestjs/common';
import { UserSpaceService } from '../user-space/user-space.service';
import { uuidToBytes } from '../utils/uuid-converter';
import { SpaceService } from './space.service';
import { UserService } from '../user/user.service';
import { Space } from './space.entity';
import { User } from '../user/user.entity';
import { ISpaceType } from '../space-type/space-type.interface';

@Injectable()
export class SpaceGuard implements CanActivate {
  constructor(
    private userSpaceService: UserSpaceService,
    private spaceService: SpaceService,
    private userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    let space: Space;

    if (request.route.path.includes('create')) {
      if (request.body.spaceType === ISpaceType.GRAB_A_TABLE) {
        return true;
      }
      space = await this.spaceService.findOne(uuidToBytes(request.body.parentId));
    } else if (request.params.spaceId) {
      space = await this.spaceService.findOne(uuidToBytes(request.params.spaceId));
    } else {
      space = await this.spaceService.findOne(uuidToBytes(request.body.spaceId));
    }

    const user: User = await this.userService.findOne(uuidToBytes(request.user.sub));

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.userSpaceService.canAccess(space, user);
  }
}
