import { Connection } from 'typeorm';
import { KusamaOperator } from '../KusamaOperator';
import { MQTT } from '../MQTT';

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

  const operator = new KusamaOperator(connection, mqtt);
  const id = 'CbaNLeJQ3e8aCJMTLa9euDKuTDmnT5oPmGFt4AmuvXmYFGN';
  // await operator.create(id);
  connection.close();
}

main();
