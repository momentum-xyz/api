import { Injectable } from '@nestjs/common';
import { MqttService } from '../../services/mqtt.service';
import { bytesToUuid, uuidToBytes } from '../../utils/uuid-converter';
import { Space } from '../../space/space.entity';
import { v4 as uuidv4 } from 'uuid';
import { UserSpaceService } from '../../user-space/user-space.service';
import { SpaceIntegration } from '../space-integrations.entity';
import { BroadcastStatus } from '../space-integrations.interface';

@Injectable()
export class BroadcastService {
  constructor(private client: MqttService, private userSpaceService: UserSpaceService) {}

  async startBroadcast(spaceIntegration: SpaceIntegration): Promise<void> {
    const userIds: string[] = await this.userSpaceService.getSpaceUsersDesc(spaceIntegration.spaceId);
    this.client.publish(
      `space_control/${bytesToUuid(spaceIntegration.spaceId)}/relay/broadcast`,
      JSON.stringify({
        url: spaceIntegration.data.url,
        youtubeUrl: spaceIntegration.data.youtubeUrl,
        spaceId: bytesToUuid(spaceIntegration.spaceId),
        spaceName: spaceIntegration.space.name,
        broadcastStatus: spaceIntegration.data.broadcastStatus,
        users: userIds,
      }),
      true,
      uuidv4(),
    );
  }

  async stopBroadcast(space: Space): Promise<void> {
    const userIds: string[] = await this.userSpaceService.getSpaceUsersDesc(space.id);
    this.client.publish(
      `space_control/${bytesToUuid(space.id)}/relay/broadcast`,
      JSON.stringify({
        url: '',
        youtubeUrl: '',
        spaceId: bytesToUuid(space.id),
        spaceName: space.name,
        broadcastStatus: BroadcastStatus.STOP,
        users: userIds,
      }),
      true,
      uuidv4(),
    );
  }

  async stopChildBroadcasts(spaces: Space[]): Promise<void> {
    for (const space of spaces) {
      // @ts-ignore
      const spaceId: Buffer = uuidToBytes(bytesToUuid(space.id.data));

      const userIds: string[] = await this.userSpaceService.getSpaceUsersDesc(spaceId);
      this.client.publish(
        `space_control/${bytesToUuid(spaceId)}/relay/broadcast`,
        JSON.stringify({
          url: '',
          youtubeUrl: '',
          spaceId: bytesToUuid(spaceId),
          spaceName: space.name,
          broadcastStatus: BroadcastStatus.STOP,
          users: userIds,
        }),
        true,
        uuidv4(),
      );
    }
  }
}
