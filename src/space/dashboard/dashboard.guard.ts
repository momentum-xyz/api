import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { uuidToBytes } from '../../utils/uuid-converter';
import { SpaceService } from '../space.service';
import { UserService } from '../../user/user.service';
import { TileService } from '../../tile/tile.service';
import { Space } from '../space.entity';
import { Tile } from '../../tile/tile.entity';
import { User } from '../../user/user.entity';

@Injectable()
export class DashboardGuard implements CanActivate {
  constructor(private spaceService: SpaceService, private userService: UserService, private tileService: TileService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    let space: Space;

    if (request.params && request.params.spaceId) {
      space = await this.spaceService.findOne(uuidToBytes(request.params.spaceId));
    } else if (request.params && request.params.tileId) {
      const tile: Tile = await this.tileService.findOne(uuidToBytes(request.params.tileId));
      space = await this.spaceService.findOne(tile.spaceId);
    } else if (request.body.owner_id) {
      space = await this.spaceService.findOne(uuidToBytes(request.body.owner_id));
    } else if (request.body.spaceId) {
      space = await this.spaceService.findOne(uuidToBytes(request.body.spaceId));
    } else {
      space = await this.spaceService.findOne(uuidToBytes(request.params.id));
    }

    const user: User = await this.userService.findOne(uuidToBytes(request.user.sub));
    const raw = await this.spaceService.accessUsers(space);

    const userIds = raw[0].map((item) => Buffer.compare(user.id, item.userId) === 0);

    return userIds.includes(true);
  }
}
