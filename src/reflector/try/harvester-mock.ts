import * as path from 'path';
import * as dotenv from 'dotenv';
import * as mqtt from 'async-mqtt';
import { AsyncClient } from 'async-mqtt';

dotenv.config({ path: path.resolve(process.cwd(), '.env.e2e-test') });
// dotenv.config({ path: path.resolve(process.cwd(), '.env') });

let client: AsyncClient;

async function main() {
  console.log(process.env);
  try {
    client = await mqtt.connectAsync({
      port: +process.env.MQTT_BROKER_PORT,
      host: process.env.MQTT_BROKER_HOST,
      username: process.env.MQTT_BROKER_USER,
      password: process.env.MQTT_BROKER_PASSWORD,
      protocol: 'mqtt',
    });

    console.log(client.connected);

    client.on('message', async (topic, message) => {
      console.log(topic);
      console.log(message.toString());
    });
    await client.subscribe('chains');
    await client.subscribe('kusama/validators/#');
  } catch (e) {
    console.log(e);
  }

  // updateChains();
  newValidator();
  // console.log(m);
}

async function updateChains() {
  await client.publish(
    'chains',
    JSON.stringify([
      { id: 'kusama', name: 'kusama' },
      { id: 2, name: 'polkadot' },
    ]),
    { retain: true },
  );
}

async function newValidator() {
  const o1 = {
    accountId: 'DSbhnaGBytDGRfZTmdcArzCL6T3HQ8gcZxWpF5gLBP6y1Qe',
    commission: 0.03,
    status: 'active',
    name: 'Wei',
    eraPoints: '2,760',
    ownStake: 0,
    totalStake: 0,
    nominators: [{ address: 'DSbhnaGBytDGRfZTmdcArzCL6T3HQ8gcZxWpF5gLBP6y1Qe', stake: 0 }],
    entity: { name: 'none', accountId: 'none' },
  };

  const o2 = {
    accountId: 'G1z8DF2z7MmHDFa2YthfrcU8ebuTeAzRmYBzNvwKzgBLhty',
    commission: 0.1,
    status: 'candidate',
    name: 'stash\n 1',
    ownStake: 0,
    totalStake: 0,
    nominators: [{ address: 'G1z8DF2z7MmHDFa2YthfrcU8ebuTeAzRmYBzNvwKzgBLhty', stake: 0 }],
    entity: { name: 'Lucency', accountId: 'CdEA1ckpzqFGE8YeWy3SSFi1an5G3EvfrjWtHVzc4Qc4f9u' },
  };

  const payload = o1;
  await client.publish(`harvester/kusama/validators/${payload.accountId}`, JSON.stringify(payload), { retain: true });
}

main();
