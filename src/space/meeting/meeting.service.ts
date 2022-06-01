import { v4 as uuidv4 } from 'uuid';
import { Injectable } from '@nestjs/common';
import { Space } from '../space.entity';
import { User } from '../../user/user.entity';
import { bytesToUuid } from '../../utils/uuid-converter';
import { MqttService } from '../../services/mqtt.service';

export enum MeetingActions {
  KICK = 'kick',
  MUTE = 'mute',
  MUTE_ALL = 'mute-all',
}

@Injectable()
export class MeetingService {
  constructor(private client: MqttService) {}

  async handleMuteAll(space: Space) {
    this.client.publish(
      `space_control/${bytesToUuid(space.id)}/relay/meeting`,
      JSON.stringify({
        action: MeetingActions.MUTE_ALL,
      }),
      false,
      uuidv4(),
    );
  }

  async handleMute(space: Space, subject: User) {
    this.client.publish(
      `space_control/${bytesToUuid(space.id)}/${bytesToUuid(subject.id)}/relay/meeting`,
      JSON.stringify({
        action: MeetingActions.MUTE,
      }),
      false,
      uuidv4(),
    );
  }

  async handleKick(space: Space, subject: User) {
    this.client.publish(
      `space_control/${bytesToUuid(space.id)}/${bytesToUuid(subject.id)}/relay/meeting`,
      JSON.stringify({
        action: MeetingActions.KICK,
      }),
      false,
      uuidv4(),
    );
  }
}
