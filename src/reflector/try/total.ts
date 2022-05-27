import * as mqtt from 'async-mqtt';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function main() {
  const client = await mqtt.connectAsync({
    port: +process.env.MQTT_BROKER_PORT,
    host: process.env.MQTT_BROKER_HOST,
    username: process.env.MQTT_BROKER_USER,
    password: process.env.MQTT_BROKER_PASSWORD,
    protocol: 'mqtt',
    clientId: `backend-reflector-dmitry-test-111`,
    clean: false,
  });

  console.log(client.connected);

  client.on('message', onMessage);

  await client.subscribe('harvester/kusama/validators/#', { qos: 0 });
  // await client.subscribe('harvester/kusama/validators/#');

  setInterval(() => {
    console.log(validators['CroiANffLtjz44LXp98NqmLxuUW5xxbsruZiRUXdeGFD82a']);
    // console.log(validators['CroiANffLtjz44LXp98NqmLxuUW5xxbsruZiRUXdeGFD82a']);
    // console.log(parents['GXaUd6gyCaEoBVzXnkLVGneCF3idnLNtNZs5RHTugb9dCpY']);
  }, 1000);
}

let total = 0;
const map = {};
const validators = {};
const parents = {};
function onMessage(topic, message) {
  console.log(topic);
  total++;
  const o = JSON.parse(message);
  map[topic] = o;
  console.log(topic, total);
  validators[o.accountId] = o;
  parents[o.entity.accountId] = true;
  console.log('unique keys', Object.keys(map).length);
}

main();

//
//
//
// ID=EVfishUSWF6jePB9D5LtKLZQFpvTP8FYa9KkwJ4htzLLFMD
// ID=GXaUd6gyCaEoBVzXnkLVGneCF3idnLNtNZs5RHTugb9dCpY
// (node:8686) UnhandledPromiseRejectionWarning: Error: Can not find space for this Kusama Account ID: GXaUd6gyCaEoBVzXnkLVGneCF3idnLNtNZs5RHTugb9dCpY
