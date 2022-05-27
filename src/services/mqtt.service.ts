import * as crypto from 'crypto';
import { ClientMqtt } from '@nestjs/microservices';
import { Injectable, Logger } from '@nestjs/common';
import { MqttClient } from '@nestjs/microservices/external/mqtt-client.interface';
import { v4 as uuidv4 } from 'uuid';
import { TokenRuleMqttDto } from '../tokens/token-rule/token-rule.interface';
import { UserAccountDto } from '../user/user.interface';

@Injectable()
export class MqttService {
  public client: MqttClient;
  private readonly logger = new Logger(MqttService.name);

  constructor() {
    this.logger.debug(`Init MQTT client to ${process.env.MQTT_BROKER_HOST}`);
    this.client = new ClientMqtt({
      hostname: process.env.MQTT_BROKER_HOST,
      port: Number(String(process.env.MQTT_BROKER_PORT)),
      username: process.env.MQTT_BROKER_USER,
      password: process.env.MQTT_BROKER_PASSWORD,
      clientId: `backend-service-${uuidv4()}`,
      keepalive: 20,
    }).createClient();
  }

  onModuleDestroy(): Promise<void> {
    return new Promise((resolve) => {
      this.client.end(false, () => {
        this.logger.debug('Closed MQTT connection');
        resolve();
      });
    });
  }

  publish(topic: string, message: string, retain: boolean, messageId = uuidv4()) {
    this.client.publish(topic, message, {
      retain: retain,
      messageId: messageId,
      qos: 1,
    });
  }

  async signalObjectUpdate(spaceId: string) {
    this.publish(`updates/spaces/changed`, spaceId, false, spaceId);
  }

  async signalObjectCreate(spaceId: string) {
    this.publish(`updates/spaces/created`, spaceId, false, spaceId);
  }

  async signalObjectRemove(spaceId: string) {
    this.publish(`updates/spaces/removed`, spaceId, false, spaceId);
  }

  async signalPermissionUpdate(spaceId: string, adminShipChanged: boolean) {
    this.publish(
      `updates/spaces/permissions`,
      JSON.stringify({ id: spaceId, adminShipChanged: adminShipChanged }),
      false,
      spaceId,
    );
  }

  // MQTT topics seem to be a tree of keys with values
  async publishActiveTokenRules(activeRules: TokenRuleMqttDto[]) {
    const msg = JSON.stringify(activeRules);
    const msgHash = crypto.createHash('md5').update(msg).digest('hex');
    this.publish(`token-service/active-rules`, msg, true, msgHash);
  }

  async publishActiveUsers(activeUsers: string[]) {
    const users = activeUsers.map((u) => {
      return {
        ethereum_address: u,
        // TODO: polkadot addresses
      };
    });
    const msg = JSON.stringify(users);
    const msgHash = crypto.createHash('md5').update(msg).digest('hex');
    this.publish(`token-service/active-users`, msg, true, msgHash);
  }

  async publishTokenRuleUpdate(tokenRule: TokenRuleMqttDto) {
    const msg = JSON.stringify(tokenRule);
    const msgHash = crypto.createHash('md5').update(msg).digest('hex');
    this.publish(`token-service/rules/` + msgHash, msg, false, msgHash);
  }

  async publishUserAccountUpdate(userAccount: UserAccountDto) {
    const msg = JSON.stringify({ ethereum_address: userAccount.accountAddress });
    const msgHash = crypto.createHash('md5').update(msg).digest('hex');
    this.publish(`token-service/user-event/` + msgHash, msg, false, msgHash);
  }
}
