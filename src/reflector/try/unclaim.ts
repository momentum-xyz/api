import { Connection } from 'typeorm';
import { claimSpace, unclaimSpace } from '../claim/functions';
import { KusamaOperator } from '../KusamaOperator';
import { MQTT } from '../MQTT';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const connection = new Connection({
    type: 'mysql',
    host: 'localhost',
    port: 3301,
    database: 'momentum3a',
    logging: 'all',
    username: 'root',
    password: 'BdBffHZB',
  });

  await connection.connect();

  const wallet = 'FPYeJ7sFitnWbncKikQZCfN6p6znTpkCHo3ihr8eyScGpgX';

  const mqtt = new MQTT();
  await mqtt.connect();
  const kusamaOperator = new KusamaOperator(connection, mqtt);
  await unclaimSpace(connection, wallet, kusamaOperator);

  await connection.close();
}

main();
