import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { EventEmitterModule, OnEvent } from '@nestjs/event-emitter';
import { Connection } from 'typeorm';
import { MqttService } from '../services/mqtt.service';
import { SyncEvent } from './SyncEvent';
import { UserSpaceService } from '../user-space/user-space.service';
import { UserSpace } from '../user-space/user-space.entity';
import { AttendeeController } from './attendees/attendee.controller';
import { SpaceIntegrationsService } from '../space-integrations/space-integrations.service';
import { SpaceIntegration } from '../space-integrations/space-integrations.entity';
import { SpaceIntegrationUsersService } from '../space-integration-users/space-integration-users.service';
import { StageModeService } from '../space-integrations/stage-mode/stage-mode.service';
import { BroadcastService } from '../space-integrations/broadcast/broadcast.service';
import { MiroService } from '../space-integrations/miro/miro.service';
import { GoogleDriveService } from '../space-integrations/googledrive/google-drive.service';
import { SpaceIntegrationUser } from '../space-integration-users/space-integration-users.entity';
import { IntegrationTypeService } from '../integration-type/integration-type.service';
import { IntegrationType } from '../integration-type/integration-type.entity';
import { Attendee } from './attendees/attendee.entity';
import { AttendeeService } from './attendees/attendee.service';
import { Space } from '../space/space.entity';
import { SpaceService } from '../space/space.service';
import { Event } from './events.entity';
import { SpaceTypeService } from '../space-type/space-type.service';
import { TileService } from '../tile/tile.service';
import { SpaceType } from '../space-type/space-type.entity';
import { Tile } from '../tile/tile.entity';
import { MagicLinksService } from '../magic-link/magic-links.service';
import { MagicLink } from '../magic-link/magic-link.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Attendee,
      Event,
      MagicLink,
      Space,
      SpaceIntegration,
      SpaceIntegrationUser,
      SpaceType,
      User,
      UserSpace,
      Tile,
      IntegrationType,
    ]),
    HttpModule,
    EventEmitterModule.forRoot(),
  ],
  exports: [EventsService],
  providers: [
    AttendeeService,
    BroadcastService,
    UserService,
    UserSpaceService,
    IntegrationTypeService,
    MagicLinksService,
    MiroService,
    GoogleDriveService,
    EventsService,
    SpaceIntegrationsService,
    SpaceIntegrationUsersService,
    SpaceService,
    SpaceTypeService,
    StageModeService,
    TileService,
  ],
  controllers: [AttendeeController, EventsController],
})
export class EventsModule {
  private sync: SyncEvent;

  constructor(private readonly connection: Connection, private client: MqttService) {
    this.sync = new SyncEvent(connection, client.client);
  }

  async onModuleInit(): Promise<void> {
    await this.sync.subscribe();
  }

  @OnEvent('event_changed')
  async handleEventUpdated(eventId: string, spaceId: string) {
    await this.sync.update(eventId, spaceId);
  }
}
