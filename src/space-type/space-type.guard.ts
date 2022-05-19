import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { UserSpaceService } from '../user-space/user-space.service';
import { uuidToBytes } from '../utils/uuid-converter';
import { UserService } from '../user/user.service';
import { SpaceService } from '../space/space.service';
import { User } from '../user/user.entity';
import { Space } from '../space/space.entity';
import { UserSpace } from '../user-space/user-space.entity';

@Injectable()
export class SpaceTypeGuard implements CanActivate {
  private ROOT_ID = '00000000-0000-0000-0000-000000000000';

  constructor(
    private userSpaceService: UserSpaceService,
    private spaceService: SpaceService,
    private userService: UserService,
  ) {}

  // Universe admins only
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: User = await this.userService.findOne(uuidToBytes(request.user.sub));
    const space: Space = await this.spaceService.findOne(uuidToBytes(this.ROOT_ID));
    const userSpace: UserSpace = await this.userSpaceService.findUserInSpace(space, user);

    return userSpace && userSpace.isAdmin;
  }
}
