import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { TileModule } from '../../tile/tile.module';
import { TileService } from '../../tile/tile.service';
import { SpaceService } from '../space.service';
import { UiTypeService } from '../../ui-type/ui-type.service';
import { UserService } from '../../user/user.service';
import { Space } from '../space.entity';
import { UiType } from '../../ui-type/ui-type.entity';
import { Tile } from '../../tile/tile.entity';
import { User } from '../../user/user.entity';
import { UserSpace } from '../../user-space/user-space.entity';
import { UserSpaceService } from '../../user-space/user-space.service';
import { SpaceTypeModule } from '../../space-type/space-type.module';

@Module({
  imports: [TypeOrmModule.forFeature([UiType, Tile, Space, User, UserSpace]), TileModule, HttpModule, SpaceTypeModule],
  providers: [TileService, SpaceService, UiTypeService, UserService, UserSpaceService],
  controllers: [DashboardController],
})
export class DashboardModule {}
