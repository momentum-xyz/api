import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Space } from '../../space/space.entity';
import { SpaceIntegration } from '../space-integrations.entity';
import { IntegrationTypeService } from '../../integration-type/integration-type.service';
import { UserService } from '../../user/user.service';
import { UserSpaceService } from '../../user-space/user-space.service';
import { UserSpace } from '../../user-space/user-space.entity';
import { SpaceService } from '../../space/space.service';
import { IntegrationType } from '../../integration-type/integration-type.entity';
import { SpaceIntegrationUsersService } from '../../space-integration-users/space-integration-users.service';
import { User } from '../../user/user.entity';
import { TileService } from '../../tile/tile.service';
import { Tile } from '../../tile/tile.entity';
import { SpaceTypeModule } from '../../space-type/space-type.module';
import { StageModeService } from './stage-mode.service';
import { SpaceIntegrationUser } from '../../space-integration-users/space-integration-users.entity';
import { StageModeController } from './stage-mode.controller';
import { SpaceIntegrationsService } from '../space-integrations.service';
import { BroadcastService } from '../broadcast/broadcast.service';
import { MiroService } from '../miro/miro.service';
import { GoogleDriveService } from '../googledrive/google-drive.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SpaceIntegration, SpaceIntegrationUser, IntegrationType, Space, UserSpace, User, Tile]),
    HttpModule,
    SpaceTypeModule,
  ],
  exports: [StageModeService],
  controllers: [StageModeController],
  providers: [
    BroadcastService,
    MiroService,
    GoogleDriveService,
    StageModeService,
    SpaceIntegrationsService,
    SpaceIntegrationUsersService,
    IntegrationTypeService,
    SpaceService,
    UserSpaceService,
    UserService,
    TileService,
  ],
})
export class StageModeModule {}
