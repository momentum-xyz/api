import { Global, HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpaceService } from './space.service';
import { SpaceController } from './space.controller';
import { SpaceTypeService } from '../space-type/space-type.service';
import { UserService } from '../user/user.service';
import { UiTypeService } from '../ui-type/ui-type.service';
import { UserSpaceService } from '../user-space/user-space.service';
import { TileService } from '../tile/tile.service';
import { Space } from './space.entity';
import { UiType } from '../ui-type/ui-type.entity';
import { SpaceType } from '../space-type/space-type.entity';
import { UserSpace } from '../user-space/user-space.entity';
import { Tile } from '../tile/tile.entity';
import { User } from '../user/user.entity';
import { SpaceIntegration } from '../space-integrations/space-integrations.entity';
import { SpaceIntegrationUsersService } from '../space-integration-users/space-integration-users.service';
import { BroadcastService } from '../space-integrations/broadcast/broadcast.service';
import { SpaceScheduler } from './space.scheduler';
import { SpaceInviteController } from './space-invite.controller';
import { SpaceIntegrationUser } from '../space-integration-users/space-integration-users.entity';
import { TableController } from './table.controller';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Space, SpaceType, SpaceIntegration, SpaceIntegrationUser, User, UserSpace, UiType, Tile]),
    HttpModule,
  ],
  exports: [SpaceService],
  providers: [
    BroadcastService,
    SpaceService,
    SpaceScheduler,
    SpaceTypeService,
    SpaceIntegrationUsersService,
    TileService,
    UserService,
    UserSpaceService,
    UiTypeService,
  ],
  controllers: [SpaceController, SpaceInviteController, TableController],
})
export class SpaceModule {}
