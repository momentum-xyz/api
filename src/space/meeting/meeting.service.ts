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

  async handleMuteAll(space: Space, moderatorId: string) {
    this.client.publish(
      `space_control/${bytesToUuid(space.id)}/relay/meeting`,
      JSON.stringify({
        spaceId: bytesToUuid(space.id),
        moderatorId: moderatorId,
        action: MeetingActions.MUTE_ALL,
      }),
      false,
      uuidv4(),
    );
  }

  /** 
   * Send message to the user who is getting muted.
   */
  async handleMute(worldId: Buffer, space: Space, subject: User) {
    this.client.publish(
      `user_control/${bytesToUuid(worldId)}/${bytesToUuid(subject.id)}/relay/meeting`,
      JSON.stringify({
        spaceId: bytesToUuid(space.id),
        action: MeetingActions.MUTE,
      }),
      false,
      uuidv4(),
    );
  }

  async handleKick(worldId: Buffer, space: Space, subject: User) {
    this.client.publish(
      `user_control/${bytesToUuid(worldId)}/${bytesToUuid(subject.id)}/relay/meeting`,
      JSON.stringify({
        spaceId: bytesToUuid(space.id),
        action: MeetingActions.KICK,
      }),
      false,
      uuidv4(),
    );
  }
}
