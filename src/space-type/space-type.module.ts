import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpaceTypeService } from './space-type.service';
import { SpaceTypeController } from './space-type.controller';
import { SpaceService } from '../space/space.service';
import { UserSpaceService } from '../user-space/user-space.service';
import { UserService } from '../user/user.service';
import { SpaceType } from './space-type.entity';
import { Space } from '../space/space.entity';
import { UserSpace } from '../user-space/user-space.entity';
import { User } from '../user/user.entity';
import { MqttService } from '../services/mqtt.service';
import { TileService } from '../tile/tile.service';
import { Tile } from '../tile/tile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SpaceType, Space, User, UserSpace, Tile]), HttpModule],
  exports: [SpaceTypeService],
  providers: [SpaceTypeService, SpaceService, UserSpaceService, UserService, TileService],
  controllers: [SpaceTypeController],
})
export class SpaceTypeModule {}
