import { Injectable, CanActivate, ExecutionContext, NotFoundException } from '@nestjs/common';
import { UserSpaceService } from '../user-space/user-space.service';
import { uuidToBytes } from '../utils/uuid-converter';
import { SpaceService } from './space.service';
import { UserService } from '../user/user.service';
import { User } from '../user/user.entity';

@Injectable()
export class SpaceAssignGuard implements CanActivate {
  constructor(
    private userSpaceService: UserSpaceService,
    private spaceService: SpaceService,
    private userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const space = await this.spaceService.findOne(uuidToBytes(request.body.spaceId));
    const user: User = await this.userService.findOne(uuidToBytes(request.user.sub));

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.userSpaceService.canAccess(space, user);
  }
}
