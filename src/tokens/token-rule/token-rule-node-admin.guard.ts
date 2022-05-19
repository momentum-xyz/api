import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { uuidToBytes } from '../../utils/uuid-converter';
import { User } from '../../user/user.entity';
import { SpaceService } from '../../space/space.service';
import { UserSpaceService } from '../../user-space/user-space.service';
import { UserService } from '../../user/user.service';
import { Space } from '../../space/space.entity';

@Injectable()
export class TokenRuleNodeAdminGuard implements CanActivate {
  private ROOT_ID = '00000000-0000-0000-0000-000000000000';

  constructor(
    private userSpaceService: UserSpaceService,
    private spaceService: SpaceService,
    private userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: User = await this.userService.findOne(uuidToBytes(request.user.sub));
    const space: Space = await this.spaceService.findOne(uuidToBytes(this.ROOT_ID));

    if (space.parent) {
      console.debug('Root node has parent...');
      return false;
    }

    return await this.userSpaceService.isAdmin(space, user);
  }
}
