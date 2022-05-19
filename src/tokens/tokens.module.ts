import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from '../user/user.service';
import { TokenRule } from './token-rule/token-rule.entity';
import { Token } from './token/token.entity';
import { TokenRuleService } from './token-rule/token-rule.service';
import { TokenService } from './token/token.service';
import { TokenRuleController } from './token-rule/token-rule.controller';
import { TokenController } from './token/token.controller';
import { User } from '../user/user.entity';
import { Space } from '../space/space.entity';
import { UserSpace } from '../user-space/user-space.entity';
import { UserType } from '../user-type/user-type.entity';
import { UserTypeService } from '../user-type/user-type.service';
import { UserMembership } from '../user-membership/user-membership.entity';
import { SpaceType } from '../space-type/space-type.entity';
import { UserSpaceService } from '../user-space/user-space.service';
import { UserMembershipService } from '../user-membership/user-membership.service';
import { NetworkService } from '../network/network.service';
import { Network } from '../network/network.entity';
import { UserWalletService } from '../user-wallet/user-wallet.service';
import { UserWallet } from '../user-wallet/user-wallet.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Network, User, TokenRule, Token, UserSpace, UserType, UserMembership, UserWallet, SpaceType, Space]),
    HttpModule,
  ],
  exports: [TokenRuleService, TokenService],
  providers: [
    NetworkService,
    TokenService,
    TokenRuleService,
    UserService,
    UserSpaceService,
    UserTypeService,
    UserMembershipService,
    UserWalletService,
  ],
  controllers: [TokenRuleController, TokenController],
})
export class TokensModule {}
