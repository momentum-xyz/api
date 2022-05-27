import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntegrationTypeService } from '../integration-type/integration-type.service';
import { Space } from '../space/space.entity';
import { SpaceType } from '../space-type/space-type.entity';
import { IntegrationType } from '../integration-type/integration-type.entity';
import { SpaceIntegration } from './space-integrations.entity';
import { SpaceIntegrationsService } from './space-integrations.service';
import { SpaceIntegrationUser } from '../space-integration-users/space-integration-users.entity';
import { SpaceIntegrationUsersService } from '../space-integration-users/space-integration-users.service';
import { StageModeService } from './stage-mode/stage-mode.service';
import { BroadcastService } from './broadcast/broadcast.service';
import { UserSpaceService } from '../user-space/user-space.service';
import { UserSpace } from '../user-space/user-space.entity';
import { SpaceIntegrationsController } from './space-integrations.controller';
import { UserService } from '../user/user.service';
import { User } from '../user/user.entity';
import { MiroService } from './miro/miro.service';
import { GoogleDriveService } from './googledrive/google-drive.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Space,
      SpaceType,
      SpaceIntegration,
      SpaceIntegrationUser,
      IntegrationType,
      User,
      UserSpace,
    ]),
    HttpModule,
  ],
  exports: [SpaceIntegrationsService],
  controllers: [SpaceIntegrationsController],
  providers: [
    BroadcastService,
    MiroService,
    GoogleDriveService,
    SpaceIntegrationsService,
    SpaceIntegrationUsersService,
    StageModeService,
    IntegrationTypeService,
    UserSpaceService,
    UserService,
  ],
})
export class SpaceIntegrationsModule {}
