import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserMembershipService } from './user-membership.service';
import { User } from '../user/user.entity';
import { UserMembership } from './user-membership.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserMembership])],
  exports: [UserMembershipService],
  providers: [UserMembershipService],
})
export class UserMembershipModule {}
