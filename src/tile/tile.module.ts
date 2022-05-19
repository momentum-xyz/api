import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TileService } from './tile.service';
import { TileController } from './tile.controller';
import { SpaceService } from '../space/space.service';
import { UserService } from '../user/user.service';
import { Space } from '../space/space.entity';
import { Tile } from './tile.entity';
import { User } from '../user/user.entity';
import { UserSpaceService } from '../user-space/user-space.service';
import { UserSpace } from '../user-space/user-space.entity';
import { SpaceTypeModule } from '../space-type/space-type.module';

@Module({
  imports: [TypeOrmModule.forFeature([Tile, Space, User, UserSpace]), HttpModule, SpaceTypeModule],
  controllers: [TileController],
  exports: [TileService],
  providers: [TileService, SpaceService, UserService, UserSpaceService],
})
export class TileModule {}
