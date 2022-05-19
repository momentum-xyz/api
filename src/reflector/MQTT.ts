import * as mqtt from 'async-mqtt';
import { AsyncClient } from 'async-mqtt';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import { parseToValidatorInfo } from './functions';

export type MQTTEvents = 'validator' | 'operator' | 'kappa_sigma_mu';

export class MQTT extends EventEmitter {
  private client: AsyncClient;

  constructor() {
    super();
  }

  public onEvent(eventName: MQTTEvents, listener: (...args: any[]) => void) {
    super.on(eventName, listener);
  }

  public async publish(topic: string, message: string, retain: boolean) {
    try {
      await this.client.publish(topic, message, {
        retain: retain,
        qos: 1,
      });
    } catch (e) {
      console.error(e);
    }
  }

  public async connect() {
    try {
      this.client = await mqtt.connectAsync({
        port: +process.env.MQTT_BROKER_PORT,
        host: process.env.MQTT_BROKER_HOST,
        username: process.env.MQTT_BROKER_USER,
        password: process.env.MQTT_BROKER_PASSWORD,
        protocol: 'mqtt',
        clientId: `backend-reflector-${uuidv4()}`,
      });

      console.log(this.client.connected);

      this.client.on('message', this.onMessage.bind(this));

      // await this.client.subscribe('chains');
      await this.client.subscribe('harvester/kusama/validators/#', { qos: 0 });
      await this.client.subscribe('harvester/kusama/society-members', { qos: 0 });
    } catch (e) {
      console.log(e);
    }
  }

  public async end() {
    await this.client.end();
  }

  private async onMessage(topic: string, message: Buffer) {
    // console.log('===>>>');
    // console.log(topic);
    // console.log(message);
    // console.log('<<<===');

    const topicParts = topic.split('/');

    if (topicParts[0] === 'harvester' && topicParts[1] === 'kusama' && topicParts[2] === 'validators') {
      const validatorId = topicParts[3];
      let validatorInfo = {};

      if (message.toString()) {
        const payload = JSON.parse(message.toString());
        validatorInfo = parseToValidatorInfo(payload);
      } else {
        console.log('NO MESSAGE');
        // Validator topic removed
      }

      super.emit('validator', validatorId, validatorInfo, message.toString());
    }

    if (topic === 'harvester/kusama/society-members') {
      if (message.toString()) {
        const accountIds = JSON.parse(message.toString());
        super.emit('kappa_sigma_mu', accountIds);
      } else {
        console.error(`NO MESSAGE in MQTT topic=${topic}`);
      }
    }
  }
}
