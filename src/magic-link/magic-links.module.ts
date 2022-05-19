import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from '../user/user.service';
import { MagicLinksService } from './magic-links.service';
import { MagicLinksController } from './magic-links.controller';
import { UserSpaceService } from '../user-space/user-space.service';
import { SpaceService } from '../space/space.service';
import { MagicLink } from './magic-link.entity';
import { Space } from '../space/space.entity';
import { User } from '../user/user.entity';
import { UserSpace } from '../user-space/user-space.entity';
import { TileService } from '../tile/tile.service';
import { Tile } from '../tile/tile.entity';
import { SpaceTypeModule } from '../space-type/space-type.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MagicLink, Space, User, UserSpace, Tile]),
    HttpModule,
    SpaceTypeModule,
  ],
  exports: [MagicLinksService],
  providers: [MagicLinksService, SpaceService, UserService, UserSpaceService, TileService],
  controllers: [MagicLinksController],
})
export class MagicLinksModule {}
