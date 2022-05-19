import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { uuidToBytes } from '../utils/uuid-converter';
import { SpaceService } from '../space/space.service';
import { UserSpaceService } from '../user-space/user-space.service';

@Injectable()
export class SpaceIntegrationsGuard implements CanActivate {
  constructor(private userSpaceService: UserSpaceService, private spaceService: SpaceService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const space = await this.spaceService.findOne(uuidToBytes(request.body.spaceId));

    const spaceUsers: string[] = await this.userSpaceService.getSpaceUsersDesc(space.id);

    return spaceUsers.includes(request.user.sub);
  }
}
