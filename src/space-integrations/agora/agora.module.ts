import { HttpModule, Module } from '@nestjs/common';
import { AgoraController } from './agora.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Space } from '../../space/space.entity';
import { User } from '../../user/user.entity';
import { UserSpace } from '../../user-space/user-space.entity';
import { TileModule } from '../../tile/tile.module';
import { SpaceTypeModule } from '../../space-type/space-type.module';
import { SpaceService } from '../../space/space.service';
import { UserService } from '../../user/user.service';
import { UserSpaceService } from '../../user-space/user-space.service';

@Module({
  imports: [TypeOrmModule.forFeature([Space, User, UserSpace]), TileModule, HttpModule, SpaceTypeModule],
  providers: [SpaceService, UserService, UserSpaceService],
  controllers: [AgoraController],
})
export class AgoraModule {}
