import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { UserModule } from '../user/user.module';

import { escape } from 'mysql';
import { MqttService } from '../services/mqtt.service';

import { stringify as bufferToUuid } from 'uuid';
import { StageModeActions } from '../space-integrations/stage-mode/stage-mode.service';

@Module({
  imports: [TypeOrmModule, UserModule],
})
export class ControllerListenerModule {
  constructor(private readonly connection: Connection, private client: MqttService) {}

  async onModuleInit() {
    console.log('ControllerListenerModule init');

    this.client.client.on('message', this.onMessage.bind(this));
    await this.client.client.subscribe('clean_up/user', { qos: 0 });
    await this.client.client.subscribe('clean_up/space', { qos: 0 });
  }

  private async onMessage(topic: string, message: Buffer) {
    if (topic === 'clean_up/user') {
      const user_id = bufferToUuid(message);
      await this.cleanUpUser(user_id);
    }
    if (topic === 'clean_up/space') {
      const space_id = bufferToUuid(message);
      await this.cleanUpSpace(space_id);
    }
  }

  async onModuleDestroy() {}

  private async cleanUpUser(user_id: string) {
    console.log('Clean Up User = ' + user_id);
    let sql = `DELETE
                   FROM users
                   WHERE true
                     AND id = UUID_TO_BIN(${escape(user_id)})
                     AND userTypeId = (SELECT id
                                       FROM user_types
                                       WHERE user_types.name = 'Temporary User'
                       LIMIT 1)`;

    await this.connection.query(sql);

    sql = `DELETE
               FROM space_integration_users
               WHERE true
                 AND userId = UUID_TO_BIN(${escape(user_id)})
                 AND integrationTypeId = (SELECT id
                                          FROM integration_types
                                          WHERE name = 'stage_mode'
                   LIMIT 1)`;

    await this.connection.query(sql);
  }

  private async cleanUpSpace(space_id: string) {
    console.log('Clean Up Space = ' + space_id);

    const sql = `UPDATE space_integrations
                     SET data = '{"stageModeStatus": "stopped"}'
                     WHERE true
                       AND spaceId = UUID_TO_BIN(${escape(space_id)})
                       AND integrationTypeId = (SELECT id
                                                FROM integration_types
                                                WHERE name = 'stage_mode'
                         LIMIT 1)`;

    await this.connection.query(sql);

    const payload = JSON.stringify({
      action: StageModeActions.STATE,
      value: '0',
    });

    await this.client.publish(`space_control/${space_id}/relay/stage`, payload, true, space_id);
    console.log(payload);
  }
}
