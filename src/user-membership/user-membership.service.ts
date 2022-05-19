import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserMembership } from './user-membership.entity';
import { UserService } from '../user/user.service';
import { User } from '../user/user.entity';

@Injectable()
export class UserMembershipService {
  constructor(
    @InjectRepository(UserMembership)
    private readonly userMembershipRepository: Repository<UserMembership>,
    private userService: UserService,
  ) {}

  async findAssociatedUsers(userId: Buffer): Promise<Buffer[]> {
    const raw = await this.userMembershipRepository.query('call GetCompoundUsersByID(?, ?);', [userId, 10000000]);
    return raw[0].map((item) => {
      return item.id;
    });
  }

  async addUserToTokenRuleGroup(tokenGroupUser: User, user: User): Promise<UserMembership> {
    const userMembership = new UserMembership();
    userMembership.memberOf2 = tokenGroupUser;
    userMembership.user = user;
    userMembership.isAdmin = 0;
    return this.userMembershipRepository.create(userMembership);
  }

  async removeUserFromTokenRuleGroup(userMembership: UserMembership) {
    await this.userMembershipRepository.delete(userMembership);
  }

  async findOne(tokenGroupUser: User, user: User) {
    return this.userMembershipRepository.findOne({
      where: {
        user: user,
        memberOf: tokenGroupUser,
      },
    });
  }
}
