import { Connection } from 'typeorm';
import { KusamaValidator } from '../KusamaValidator';
import { ValidatorInfo } from '../interfaces';
import { MQTT } from '../MQTT';

const o3: ValidatorInfo = {
  accountId: 'CaNcZBjbvPWXVFAxtAGLBwk2iEEAU6kAJFHyc4Kc3XWmKuj',
  status: 'active',
  eraPoints: 2300,
  totalStake: 100.0,
  ownStake: '2832',
  commission: '3%',
  commissionLongFormat: '3% COMMISSION',
  nominators: ['CiKJhUKFr621yiuokou4REmaWo1U4GYgZBn2B8Hqxp8xcEn', 'Cj2Xnr7qBs92AydeYPqpxGQjSwP3bh6BSVmRDFbnaHzAAUj'],
  entity: {
    name: 'SUPER VALIDATORS',
    accountId: 'CbaNLeJQ3e8aCJMTLa9euDKuTDmnT5oPmGFt4AmuvXmYFGN',
  },
  validatorAccountDetails: {
    name: 'SUPER VALIDATOR #2',
    totalBalance: 150,
    locked: 3.0,
    bonded: 2.832,
    parent: '0x44444444444444444444444444',
    email: 'super@supervalidators.com',
    website: 'supervalidators.com',
    twitter: '@supervalidators',
    riot: '@supervalidators',
  },
};

const o3_update_1 = {
  ...o3,
  status: 'candidate',
  validatorAccountDetails: {
    ...o3.validatorAccountDetails,
    name: 'NEW VALIDATOR NAME #3',
  },
};

console.log(o3_update_1);

async function main() {
  const mqtt: MQTT = new MQTT();
  const connection = new Connection({
    type: 'mysql',
    host: 'localhost',
    port: 33062,
    database: 'momentumtest',
    logging: 'all',
    username: 'root',
    password: 'testpassword',
  });

  await connection.connect();

  const validator = new KusamaValidator(connection, mqtt);
  const id = 'CaNcZBjbvPWXVFAxtAGLBwk2iEEAU6kAJFHyc4Kc3XWmKuj';

  await validator.createOrUpdateOrDelete(id, o3_update_1);

  connection.close();
}

main();
