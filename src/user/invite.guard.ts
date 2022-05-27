import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { UserSpaceService } from '../user-space/user-space.service';
import { uuidToBytes } from '../utils/uuid-converter';
import { UserService } from '../user/user.service';
import { SpaceService } from '../space/space.service';
import { User } from './user.entity';
import { Space } from '../space/space.entity';

@Injectable()
export class InviteGuard implements CanActivate {
  constructor(
    private userSpaceService: UserSpaceService,
    private userService: UserService,
    private spaceService: SpaceService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const user: User = await this.userService.findOne(uuidToBytes(request.user.sub));
    const space: Space = await this.spaceService.findOne(uuidToBytes(request.body.spaceId));

    return await this.userSpaceService.isAdmin(space, user);
  }
}
