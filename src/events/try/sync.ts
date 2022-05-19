import { Connection } from 'typeorm';
import { SyncEvent } from '../SyncEvent';
import * as dotenv from 'dotenv';
import * as mqtt from 'async-mqtt';

dotenv.config();

async function main() {
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

  const client = await mqtt.connectAsync({
    port: +process.env.MQTT_BROKER_PORT,
    host: process.env.MQTT_BROKER_HOST,
    username: process.env.MQTT_BROKER_USER,
    password: process.env.MQTT_BROKER_PASSWORD,
    protocol: 'mqtt',
    clientId: `backend-reflector-cli-${Math.random()}`,
  });

  await connection.connect();

  const sync = new SyncEvent(connection, client);

  await sync.subscribe();

  // await connection.close();
  // await client.end();
}

main();
