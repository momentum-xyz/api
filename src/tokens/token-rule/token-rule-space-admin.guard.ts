import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { uuidToBytes } from '../../utils/uuid-converter';
import { User } from '../../user/user.entity';
import { SpaceService } from '../../space/space.service';
import { UserSpaceService } from '../../user-space/user-space.service';
import { UserService } from '../../user/user.service';

@Injectable()
export class TokenRuleSpaceAdminGuard implements CanActivate {
  constructor(
    private userSpaceService: UserSpaceService,
    private spaceService: SpaceService,
    private userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    let space;

    const request = context.switchToHttp().getRequest();
    const user: User = await this.userService.findOne(uuidToBytes(request.user.sub));
    if (request.params.spaceId) {
      space = await this.spaceService.findOne(uuidToBytes(request.params.spaceId));
    } else if (context.getHandler().name === 'deleteTokenRule') {
      return true; // method does its own auth check...
    } else {
      space = await this.spaceService.findOne(uuidToBytes(request.body.spaceId));
    }

    return await this.userSpaceService.isAdmin(space, user);
  }
}
