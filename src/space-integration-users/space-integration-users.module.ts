import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpaceIntegrationUsersService } from './space-integration-users.service';
import { IntegrationTypeService } from '../integration-type/integration-type.service';
import { Space } from '../space/space.entity';
import { SpaceIntegration } from '../space-integrations/space-integrations.entity';
import { SpaceType } from '../space-type/space-type.entity';
import { IntegrationType } from '../integration-type/integration-type.entity';
import { SpaceIntegrationUser } from './space-integration-users.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Space, SpaceType, SpaceIntegration, SpaceIntegrationUser, IntegrationType]), HttpModule],
  exports: [SpaceIntegrationUsersService],
  providers: [SpaceIntegrationUsersService, IntegrationTypeService],
})
export class SpaceIntegrationUsersModule {}
