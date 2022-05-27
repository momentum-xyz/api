import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MailerModule } from '@nestjs-modules/mailer';
import { UserTypeService } from '../user-type/user-type.service';
import { UserSpaceService } from '../user-space/user-space.service';
import { SpaceService } from '../space/space.service';
import { UserMembershipService } from '../user-membership/user-membership.service';
import { User } from './user.entity';
import { UserType } from '../user-type/user-type.entity';
import { UserSpace } from '../user-space/user-space.entity';
import { UserMembership } from '../user-membership/user-membership.entity';
import { Space } from '../space/space.entity';
import { Invitation } from '../invitation/invitation.entity';
import { InvitationService } from '../invitation/invitation.service';
import { TileService } from '../tile/tile.service';
import { Tile } from '../tile/tile.entity';
import { SpaceTypeModule } from '../space-type/space-type.module';
import { AuthService } from '../auth/auth.service';
import { OnlineUserService } from '../online-user/online-user.service';
import { OnlineUser } from '../online-user/online-user.entity';
import { ProfileController } from './profile/profile.controller';
import { UrlMapping } from '../url-mapping/url-mapping.entity';
import { UrlMappingService } from '../url-mapping/url-mapping.service';
import { FavoriteController } from './favorite/favorite.controller';
import { AttributeService } from '../attribute/attribute.service';
import { Attribute } from '../attribute/attribute.entity';
import { UserSpaceAttributeService } from '../user-space-attribute/user-space-attribute.service';
import { UserSpaceAttribute } from '../user-space-attribute/user-space-attribute.entity';
import { UserWalletService } from '../user-wallet/user-wallet.service';
import { NetworkService } from '../network/network.service';
import { Network } from '../network/network.entity';
import { UserWallet } from '../user-wallet/user-wallet.entity';
import { StatusController } from './status/status.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Attribute,
      Network,
      Space,
      OnlineUser,
      Invitation,
      Tile,
      User,
      UserType,
      UserSpace,
      UserSpaceAttribute,
      UserMembership,
      UserWallet,
      UrlMapping,
    ]),
    MailerModule,
    HttpModule,
    SpaceTypeModule,
  ],
  exports: [UserService],
  providers: [
    AttributeService,
    AuthService,
    NetworkService,
    UserService,
    UserTypeService,
    UserSpaceService,
    UserSpaceAttributeService,
    UserMembershipService,
    UserWalletService,
    UrlMappingService,
    OnlineUserService,
    SpaceService,
    InvitationService,
    TileService,
  ],
  controllers: [FavoriteController, ProfileController, StatusController, UserController],
})
export class UserModule {}
