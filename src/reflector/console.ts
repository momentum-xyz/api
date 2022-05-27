import * as mysql from 'mysql';
import * as dotenv from 'dotenv';
import { KusamaOperator } from './KusamaOperator';
import { Connection } from 'typeorm';
import * as mqttAsync from 'async-mqtt';
import { getKusamaConfig } from './functions';
import { claimSpace, unclaimSpace } from './claim/functions';
import { MQTT } from './MQTT';

if (process.env.NODE_ENV === 'local') {
  dotenv.config({ path: '.env.local' });
}

async function init() {
  const client = await mqttAsync.connectAsync({
    port: +process.env.MQTT_BROKER_PORT,
    host: process.env.MQTT_BROKER_HOST,
    username: process.env.MQTT_BROKER_USER,
    password: process.env.MQTT_BROKER_PASSWORD,
    protocol: 'mqtt',
    clientId: `backend-reflector-cli-${Math.random()}`,
  });

  const connection = new Connection({
    type: 'mysql',
    host: process.env.DB_HOST,
    port: +process.env.DB_PORT || 3306,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    charset: 'utf8mb4',
    logging: 'all',
  });

  await connection.connect();

  const config = await getKusamaConfig(connection);

  const mqtt = new MQTT();
  await mqtt.connect();

  return {
    client,
    mqtt,
    connection,
    config,
  };
}

async function exec() {
  const { client, mqtt, connection, config } = await init();

  const wallet = process.argv[2];
  const command = process.argv[3];
  if (!wallet) {
    console.error(`Please provide wallet`);
    return;
  }
  console.log(`wallet = ${wallet}`);

  let operatorSpaceId;

  const kusamaOperator = new KusamaOperator(connection, mqtt);
  if (command === 'unclaim') {
    console.log('Start unclaim operator space');
    await unclaimSpace(connection, wallet, kusamaOperator);
  } else {
    console.log('Start claim operator space');
    await claimSpace(connection, wallet, kusamaOperator);
  }

  if (operatorSpaceId) {
    await client.publish(`updates/spaces/changed`, config.spaces.operator_cloud, {
      retain: false,
      qos: 1,
    });
    console.log('Published to MQTT topic updates/spaces/changed', config.spaces.operator_cloud);
  }

  await connection.close();
  await client.end();
  await mqtt.end();
}

exec();
