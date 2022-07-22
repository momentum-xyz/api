import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatController } from './stat.controller';
import { StatService } from './stat.service';
import { MqttService } from '../../services/mqtt.service';
import { Stat } from './stat.entity';
import { UserService } from '../../user/user.service';
import { SpaceService } from '../space.service';
import { HighFiveService } from '../../high-five/high-five.service';
import { Space } from '../space.entity';
import { HighFive } from '../../high-five/high-five.entity';
import { User } from '../../user/user.entity';
import { OnlineUser } from '../../online-user/online-user.entity';
import { OnlineUserService } from '../../online-user/online-user.service';
import { SpaceTypeService } from '../../space-type/space-type.service';
import { UserSpaceService } from '../../user-space/user-space.service';
import { UserSpace } from '../../user-space/user-space.entity';
import { TileService } from '../../tile/tile.service';
import { SpaceType } from '../../space-type/space-type.entity';
import { Tile } from '../../tile/tile.entity';
import { EventsService } from '../../events/events.service';
import { WorldDefinition } from '../../world-definition/world-definition.entity';
import { WorldDefinitionService } from '../../world-definition/world-definition.service';
import { Event } from '../../events/events.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Event,
      HighFive,
      Stat,
      Space,
      SpaceType,
      OnlineUser,
      User,
      UserSpace,
      Tile,
      WorldDefinition,
    ]),
    HttpModule,
  ],
  exports: [StatService],
  providers: [
    EventsService,
    HighFiveService,
    MqttService,
    UserService,
    OnlineUserService,
    UserSpaceService,
    SpaceService,
    SpaceTypeService,
    StatService,
    TileService,
    WorldDefinitionService,
  ],
  controllers: [StatController],
})
export class StatModule {}
