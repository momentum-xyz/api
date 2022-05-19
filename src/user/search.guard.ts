import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { UserSpaceService } from '../user-space/user-space.service';
import { uuidToBytes } from '../utils/uuid-converter';
import { UserService } from '../user/user.service';
import { User } from './user.entity';
import { UserSpace } from '../user-space/user-space.entity';

@Injectable()
export class SearchGuard implements CanActivate {
  constructor(private userSpaceService: UserSpaceService, private userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: User = await this.userService.findOne(uuidToBytes(request.user.sub));
    const userSpaces: UserSpace[] = await this.userSpaceService.findAllForUserAdmin(user);

    const isAdmin = userSpaces.filter((userSpace) => userSpace.isAdmin);

    return !!isAdmin;
  }
}
