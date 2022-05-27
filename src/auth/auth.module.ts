import { Space } from '../space/space.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from '../user/user.service';
import { UserSpaceService } from '../user-space/user-space.service';
import { UserSpace } from '../user-space/user-space.entity';
import { SpaceService } from '../space/space.service';
import { User } from '../user/user.entity';
import { HttpModule, Module, Global } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SpaceTypeService } from '../space-type/space-type.service';
import { TileService } from '../tile/tile.service';
import { SpaceType } from '../space-type/space-type.entity';
import { Tile } from '../tile/tile.entity';
import { UserTypeService } from '../user-type/user-type.service';
import { InvitationService } from '../invitation/invitation.service';
import { Invitation } from '../invitation/invitation.entity';
import { UserType } from '../user-type/user-type.entity';
import { JwtModule } from '@nestjs/jwt';
import { OIDCService } from './oidc/oidc.service';
import { UserWalletService } from '../user-wallet/user-wallet.service';
import { NetworkService } from '../network/network.service';
import { Network } from '../network/network.entity';
import { UserWallet } from '../user-wallet/user-wallet.entity';
import { EventEmitterModule } from '@nestjs/event-emitter';

export * from './auth.guard';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Network, Invitation, Space, SpaceType, User, UserSpace, UserType, UserWallet, Tile]),
    JwtModule.register({}),
    HttpModule,
    EventEmitterModule.forRoot(),
  ],
  controllers: [AuthController],
  exports: [AuthService, OIDCService],
  providers: [
    AuthService,
    InvitationService,
    NetworkService,
    SpaceService,
    SpaceTypeService,
    UserService,
    UserSpaceService,
    UserTypeService,
    UserWalletService,
    TileService,
    {
      provide: OIDCService,
      useFactory: async () => {
        const srv = new OIDCService();
        await srv.loadProviders();
        return srv;
      },
    },
  ],
})
export class AuthModule {}
