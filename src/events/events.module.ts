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

@Module({
  imports: [TypeOrmModule.forFeature([User, UserSpace]), HttpModule, EventEmitterModule.forRoot()],
  providers: [UserService, UserSpaceService, EventsService],
  controllers: [EventsController],
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
