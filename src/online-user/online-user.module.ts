import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { OnlineUser } from './online-user.entity';
import { OnlineUserService } from './online-user.service';
import { OnlineUserController } from './online-user.controller';
import { UserService } from '../user/user.service';
import { HttpModule } from '@nestjs/axios';
import { UserSpaceService } from '../user-space/user-space.service';
import { UserSpace } from '../user-space/user-space.entity';
import { UiTypeService } from '../ui-type/ui-type.service';
import { UiType } from '../ui-type/ui-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserSpace, UiType, OnlineUser]), HttpModule],
  exports: [OnlineUserService],
  controllers: [OnlineUserController],
  providers: [OnlineUserService, UserService, UserSpaceService, UiTypeService],
})
export class OnlineUserModule {}
