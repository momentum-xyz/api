import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { UserModule } from '../user/user.module';
import { ReflectorService } from './reflector.service';
import { ReflectorController } from './reflector.controller';
import { ValidatorInfo } from './interfaces';
import { MQTT } from './MQTT';
import { KusamaValidator } from './KusamaValidator';
import { Cleaner } from './Cleaner';
import { KappaSigmaMu } from './KappaSigmaMu';
import { OnEvent } from '@nestjs/event-emitter';
import { KusamaOperator } from './KusamaOperator';
import { encodeAddress } from '@polkadot/util-crypto';
import { claimSpace } from './claim/functions';
import { escape } from 'mysql';

@Module({
  imports: [TypeOrmModule, UserModule],
  providers: [ReflectorService],
  controllers: [ReflectorController],
})
export class ReflectorModule {
  private mqtt: MQTT;
  private kusamaValidator: KusamaValidator;
  private kusamaOperator: KusamaOperator;
  private kappaSigmaMu: KappaSigmaMu;
  private lastProcessedPayload: Record<string, string> = {};
  private queue: any[] = [];
  private workersCount = 0;
  private counter = 0;

  constructor(private readonly connection: Connection) {
    this.mqtt = new MQTT();
    this.kusamaValidator = new KusamaValidator(connection, this.mqtt);
    this.kusamaOperator = new KusamaOperator(connection, this.mqtt);
  }

  async onModuleInit() {
    console.log('ReflectorModule init');

    await this.kusamaValidator.warmUpCache();

    new Cleaner(this.connection, this.mqtt);
    this.kappaSigmaMu = new KappaSigmaMu(this.connection, this.mqtt);

    this.mqtt.onEvent('validator', this.onValidatorTopic.bind(this));

    await this.mqtt.connect();

    setInterval(this.process.bind(this), 1);
  }

  private async onValidatorTopic(validatorId: string, validator: ValidatorInfo, message: string) {
    // console.log('onValidatorTopic:::', validatorId);
    this.queue.push({ validatorId, validator, message });

    console.log(this.queue.length);
  }

  private async process() {
    if (this.queue.length === 0) {
      return;
    }

    if (this.workersCount > 0) {
      return;
    }

    // console.log('Processing ', this.queue.length, this.workersCount, ++this.counter);

    const { validatorId, validator, message } = this.queue.shift();

    if (this.lastProcessedPayload[validatorId] === message) {
      // console.log('PAYLOAD NOT CHANGED. SKIP PROCESSING');
    } else {
      try {
        this.workersCount++;
        const { created, updated } = await this.kusamaValidator.createOrUpdateOrDelete(validatorId, validator);
        console.log('COMPLETE', this.workersCount);
        this.lastProcessedPayload[validatorId] = message;

        for (const spaceId of created) {
          await this.mqtt.publish(`updates/spaces/created`, spaceId, false);
        }

        for (const spaceId of updated) {
          await this.mqtt.publish(`updates/spaces/changed`, spaceId, false);
        }
      } catch (e) {
        console.error(e);
      } finally {
        this.workersCount--;
      }
    }
  }

  async onModuleDestroy() {
    await this.mqtt.end();
  }

  @OnEvent('user_authorised')
  async handleUserAuthorised(userId: string) {
    console.log('handleUserAuthorised.start userId=' + userId);
    let sql = `SELECT BIN_TO_UUID(id) AS networkId
               FROM networks
               WHERE name = 'polkadot'`;

    let rows: any[] = await this.connection.query(sql);

    const networkId = rows[0].networkId;
    console.log('handleUserAuthorised.networkFound id=' + networkId);

    sql = `SELECT wallet
           FROM user_wallets
           WHERE networkId = UUID_TO_BIN('${networkId}')
             AND userId = UUID_TO_BIN(${escape(userId)})`;

    rows = await this.connection.query(sql);

    console.log('handleUserAuthorised.numberOfWalletsFound =' + rows.length);

    if (rows.length !== 1) {
      return;
    }

    const hexWallet = rows[0].wallet;
    console.log('handleUserAuthorised.hexWallet =' + rows[0].wallet);
    const wallet = encodeAddress(hexWallet, 2);
    console.log(`handleUserAuthorised.complete userID = ${userId} wallet = ${wallet}`);
    console.log(`Auth user ID = ${userId} wallet = ${wallet}`);

    let newWallet = wallet;
    const antonsWallet = '5FZDKa3LZu6xQQ3yX9QzSv9w248Y9vnJYb6mNgw2CwvVuFRG';
    const dmitrysWallet = 'HyDKbNnozPXbudff3ASzaGRmTLDvRUpCUtgnLDkCSE3yWYj';
    const wallet_8 = 'J3pxxiTcoyoJEWnhKmSWshZqvLTnGCcKoBRvoyoYPEqhtL8';

    if (wallet === antonsWallet || wallet === dmitrysWallet) {
      // newWallet = wallet_8;
      // console.log('Test user wallet detected. Set new wallet = ' + newWallet);
    }

    await claimSpace(this.connection, newWallet, this.kusamaOperator);
  }

  @OnEvent('new_kusama_user')
  async handleNewKusamaUser(hexWallet: string) {
    console.log('new_kusama_user registered');

    console.log(hexWallet);

    await this.kappaSigmaMu.onNewUser(hexWallet);
  }
}
