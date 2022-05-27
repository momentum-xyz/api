import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSpaceService } from './user-space.service';
import { User } from '../user/user.entity';
import { UserSpace } from './user-space.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserSpace])],
  exports: [UserSpaceService],
  providers: [UserSpaceService],
})
export class UserSpaceModule {}
