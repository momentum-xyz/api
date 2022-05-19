import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { UserSpaceAttribute } from './user-space-attribute.entity';
import { UserSpaceAttributeService } from './user-space-attribute.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserSpaceAttribute])],
  exports: [UserSpaceAttributeService],
  providers: [UserSpaceAttributeService],
})
export class UserSpaceAttributeModule {}
