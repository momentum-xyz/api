import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attribute } from './attribute/attribute.entity';
import { HighFive } from './high-five/high-five.entity';
import { Invitation } from './invitation/invitation.entity';
import { IntegrationType } from './integration-type/integration-type.entity';
import { MagicLink } from './magic-link/magic-link.entity';
import { Migration } from './migration/migration.entity';
import { Space } from './space/space.entity';
import { SpaceType } from './space-type/space-type.entity';
import { SpaceAttribute } from './space-attributes/space-attributes.entity';
import { SpaceIntegration } from './space-integrations/space-integrations.entity';
import { Subscription } from './subscription/subscription.entity';
import { Tile } from './tile/tile.entity';
import { UiType } from './ui-type/ui-type.entity';
import { UserLkp } from './user-lkp/user-lkp.entity';
import { UserMembership } from './user-membership/user-membership.entity';
import { UserSpace } from './user-space/user-space.entity';
import { UserSpaceAttribute } from './user-space-attribute/user-space-attribute.entity';
import { User } from './user/user.entity';
import { UserType } from './user-type/user-type.entity';
import { UserVanity } from './user-vanity/user-vanity.entity';
import { Vanity } from './vanity/vanity.entity';
import { Vibe } from './vibe/vibe.entity';
import { SentryInterceptor } from './services/sentry.interceptor';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { SpaceModule } from './space/space.module';
import { SpaceTypeModule } from './space-type/space-type.module';
import { UiTypeModule } from './ui-type/ui-type.module';
import { UserSpaceModule } from './user-space/user-space.module';
import { UserModule } from './user/user.module';
import { UserTypeModule } from './user-type/user-type.module';
import { VanityModule } from './vanity/vanity.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { IntegrationTypeModule } from './integration-type/integration-type.module';
import { AgoraModule } from './space-integrations/agora/agora.module';
import { MagicLinksModule } from './magic-link/magic-links.module';
import { DashboardModule } from './space/dashboard/dashboard.module';
import { TileModule } from './tile/tile.module';
import { SpaceIntegrationUsersModule } from './space-integration-users/space-integration-users.module';
import { WorldDefinition } from './world-definition/world-definition.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { UserLkpModule } from './user-lkp/user-lkp.module';
import { AuthGuard, AuthModule } from './auth/auth.module';
import { OnlineUser } from './online-user/online-user.entity';
import { OnlineUserModule } from './online-user/online-user.module';
import { StageModeModule } from './space-integrations/stage-mode/stage-mode.module';
import { CommonServicesModule } from './services/services.module';
import { VibeModule } from './vibe/vibe.module';
import { TokensModule } from './tokens/tokens.module';
import { TokenRule } from './tokens/token-rule/token-rule.entity';
import { Token } from './tokens/token/token.entity';
import { AudioTrackModule } from './audio-track/audio-track.module';
import { AudioTrack } from './audio-track/audio-track.entity';
import { SpacePlaylist } from './space-playlist/space-playlist.entity';
import { SpacePlaylistModule } from './space-playlist/space-playlist.module';
import { UrlMapping } from './url-mapping/url-mapping.entity';
import { UrlMappingModule } from './url-mapping/url-mapping.module';
import { EventsModule } from './events/events.module';
import { SpaceIntegrationUser } from './space-integration-users/space-integration-users.entity';
import { SpaceIntegrationsModule } from './space-integrations/space-integrations.module';
import { ReflectorModule } from './reflector/reflector.module';
import { UserWallet } from './user-wallet/user-wallet.entity';
import { Network } from './network/network.entity';
import { NetworkModule } from './network/network.module';
import { Stat } from './space/stats/stat.entity';
import { StatModule } from './space/stats/stat.module';
import { WorldDefinitionModule } from './world-definition/world-definition.module';
import { Attendee } from './events/attendees/attendee.entity';
import { Event } from './events/events.entity';
import { ControllerListenerModule } from './controller-listener/controller-listener.module';

function getEnvFiles(): string[] {
  switch (process.env.NODE_ENV) {
    case 'test':
      return ['.env.e2e-test'];
    case 'local':
      return ['.env.local'];
    default:
      return ['.env', '.env.default'];
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: getEnvFiles(),
      isGlobal: true,
    }),
    MailerModule.forRoot(
      process.env.NODE_ENV === 'test'
        ? {
            transport: {
              host: 'localhost',
              port: 1025,
              secure: false,
              requireTLS: false,
              auth: {},
            },
            defaults: {
              from: '"Odyssey Momentum" <notifications@odyssey.org>',
            },
          }
        : {
            transport: {
              service: 'gmail',
              host: 'smtp-relay.gmail.com',
              port: 587,
              secure: false,
              requireTLS: true,
              auth: {
                user: process.env.MAILER_ACCOUNT,
                pass: process.env.MAILER_PASSWORD,
              },
            },
            defaults: {
              from: '"Odyssey Momentum" <notifications@odyssey.org>',
            },
          },
    ),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT || 3306,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      charset: 'utf8mb4',
      entities: [
        Attendee,
        Attribute,
        AudioTrack,
        Event,
        HighFive,
        Invitation,
        IntegrationType,
        MagicLink,
        Migration,
        Network,
        OnlineUser,
        Space,
        SpaceAttribute,
        SpaceType,
        SpaceIntegration,
        SpaceIntegrationUser,
        SpacePlaylist,
        Subscription,
        Stat,
        Tile,
        Token,
        TokenRule,
        UiType,
        UrlMapping,
        User,
        UserLkp,
        UserMembership,
        UserSpace,
        UserSpaceAttribute,
        UserType,
        UserVanity,
        UserWallet,
        Vanity,
        WorldDefinition,
        Vibe,
      ],
      logging: ['error'],
    }),
    CommonServicesModule,
    AgoraModule,
    AudioTrackModule,
    AuthModule,
    DashboardModule,
    EventsModule,
    MagicLinksModule,
    NetworkModule,
    IntegrationTypeModule,
    OnlineUserModule,
    ReflectorModule,
    SpaceModule,
    SpaceTypeModule,
    SpaceIntegrationsModule,
    SpaceIntegrationUsersModule,
    SpacePlaylistModule,
    StageModeModule,
    StatModule,
    TileModule,
    TokensModule,
    UiTypeModule,
    UrlMappingModule,
    UserModule,
    UserLkpModule,
    UserSpaceModule,
    UserTypeModule,
    VanityModule,
    VibeModule,
    WorldDefinitionModule,
    ControllerListenerModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: SentryInterceptor,
    },
  ],
})
export class AppModule {}
