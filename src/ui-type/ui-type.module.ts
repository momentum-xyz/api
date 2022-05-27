import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UiTypeService } from './ui-type.service';
import { TileModule } from '../tile/tile.module';
import { SpaceService } from '../space/space.service';
import { UserService } from '../user/user.service';
import { Space } from '../space/space.entity';
import { UiType } from './ui-type.entity';
import { User } from '../user/user.entity';
import { UserSpace } from '../user-space/user-space.entity';
import { UserSpaceService } from '../user-space/user-space.service';
import { SpaceTypeModule } from '../space-type/space-type.module';

@Module({
  imports: [TypeOrmModule.forFeature([Space, User, UserSpace, UiType]), TileModule, HttpModule, SpaceTypeModule],
  exports: [UiTypeService],
  providers: [UiTypeService, SpaceService, UserService, UserSpaceService],
})
export class UiTypeModule {}
