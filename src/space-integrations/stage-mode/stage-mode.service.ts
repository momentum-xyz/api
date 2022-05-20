import { v4 as uuidv4 } from 'uuid';
import { Injectable } from '@nestjs/common';
import { MqttService } from '../../services/mqtt.service';
import { bytesToUuid } from '../../utils/uuid-converter';
import { Space } from '../../space/space.entity';
import { UserSpaceService } from '../../user-space/user-space.service';
import { User } from '../../user/user.entity';
import { SpaceIntegration } from '../space-integrations.entity';
import { SpaceIntegrationUser } from '../../space-integration-users/space-integration-users.entity';
import { StageModeStatus } from '../space-integrations.interface';
import { MessageBusAdmitStatus } from './stage-mode.interface';

export enum StageModeActions {
  STATE = 'state',
  REQUEST = 'request',
  ACCEPT_REQUEST = 'accept-request',
  INVITE = 'invite',
  DECLINE_INVITE = 'decline-invite',
  JOINED_STAGE = 'joined-stage',
  LEFT_STAGE = 'left-stage',
  KICK = 'kick',
  MUTE = 'mute',
}

@Injectable()
export class StageModeService {
  constructor(private client: MqttService, private userSpaceService: UserSpaceService) {}

  async update(spaceIntegration: SpaceIntegration): Promise<void> {
    // Updates participant array of stage mode in mqtt
    const payloadStatus: boolean = spaceIntegration.data['stageModeStatus'] === StageModeStatus.INITIATED;
    // const recipientIds: string[] = spaceIntegration.spaceIntegrationUsers.map((spaceIntegrationUser) =>
    //   bytesToUuid(spaceIntegrationUser.userId),
    // );
    const stageModeStatus = payloadStatus ? '1' : '0';
    this.client.publish(
      `space_control/${bytesToUuid(spaceIntegration.space.id)}/relay/stage`,
      JSON.stringify({
        action: StageModeActions.STATE,
        value: stageModeStatus,
      }),
      true,
      bytesToUuid(spaceIntegration.space.id),
    );
  }

  async handleRequest(space: Space, user: User) {
    // All moderators
    const recipientIds: string[] = await this.userSpaceService.getSpaceUsersDesc(space.id);
    this.client.publish(
      `space_control/${bytesToUuid(space.id)}/relay/stage`,
      JSON.stringify({
        action: StageModeActions.REQUEST,
        userId: bytesToUuid(user.id),
        users: recipientIds,
      }),
      false,
      uuidv4(),
    );
  }

  async handleRequestAcceptDecline(space: Space, requestor: User, status: MessageBusAdmitStatus, worldId: Buffer) {
    // Moderator accepts or declines a request made by an audience member.
    // Notify the audience member:
    this.client.publish(
      `user_control/${bytesToUuid(worldId)}/${bytesToUuid(requestor.id)}/relay/stage`,
      JSON.stringify({
        action: StageModeActions.ACCEPT_REQUEST,
        userId: bytesToUuid(requestor.id),
        value: status,
      }),
      false,
      uuidv4(),
    );
    // Notify the (other) moderators)
    const recipientIds: string[] = await this.userSpaceService.getSpaceUsersDesc(space.id);
    this.client.publish(
      `space_control/${bytesToUuid(space.id)}/relay/stage`,
      JSON.stringify({
        action: StageModeActions.ACCEPT_REQUEST,
        userId: bytesToUuid(requestor.id),
        value: status,
        users: recipientIds,
      }),
      false,
      uuidv4(),
    );
  }

  async handleInvite(space: Space, invitee: User, invitor: User, worldId: Buffer) {
    // Specific user
    this.client.publish(
      `user_control/${bytesToUuid(worldId)}/${bytesToUuid(invitee.id)}/relay/stage`,
      JSON.stringify({
        action: StageModeActions.INVITE,
        invitor: bytesToUuid(invitor.id),
      }),
      false,
      uuidv4(),
    );
  }

  async handleInviteDecline(space: Space, invitee: User) {
    // Audience member decline an invite.
    const moderatorIds: string[] = await this.userSpaceService.getSpaceUsersDesc(space.id);
    this.client.publish(
      `space_control/${bytesToUuid(space.id)}/relay/stage`,
      JSON.stringify({
        action: StageModeActions.DECLINE_INVITE,
        userId: bytesToUuid(invitee.id),
        users: moderatorIds,
      }),
      false,
      uuidv4(),
    );
  }

  async handleJoin(spaceIntegrationUser: SpaceIntegrationUser) {
    this.client.publish(
      `space_control/${bytesToUuid(spaceIntegrationUser.spaceId)}/relay/stage`,
      JSON.stringify({
        action: StageModeActions.JOINED_STAGE,
        userId: bytesToUuid(spaceIntegrationUser.userId),
      }),
      false,
      uuidv4(),
    );
  }

  async handleLeave(spaceIntegrationUser: SpaceIntegrationUser) {
    this.client.publish(
      `space_control/${bytesToUuid(spaceIntegrationUser.spaceId)}/relay/stage`,
      JSON.stringify({
        action: StageModeActions.LEFT_STAGE,
        userId: bytesToUuid(spaceIntegrationUser.userId),
      }),
      false,
      uuidv4(),
    );
  }

  async handleKick(spaceIntegrationUser: SpaceIntegrationUser) {
    this.client.publish(
      `space_control/${bytesToUuid(spaceIntegrationUser.spaceId)}/relay/stage`,
      JSON.stringify({
        action: StageModeActions.KICK,
        userId: bytesToUuid(spaceIntegrationUser.userId),
      }),
      false,
      uuidv4(),
    );
  }

  async handleMute(spaceIntegrationUser: SpaceIntegrationUser, worldId: Buffer) {
    // Specific user
    this.client.publish(
      `user_control/${bytesToUuid(worldId)}/${bytesToUuid(spaceIntegrationUser.userId)}/relay/stage`,
      JSON.stringify({
        action: StageModeActions.MUTE,
      }),
      false,
      uuidv4(),
    );
  }
}
