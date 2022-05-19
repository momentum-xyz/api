import { Connection } from 'typeorm';
import { getKusamaConfig } from '../functions';

async function main() {
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

  const config = await getKusamaConfig(connection);
  const operatorId = 'Daxt3aHFP2arMcyN6rbdkUyE3tYhbcBuNpG5JQGM3jubRzA';
  // const r = await getOperatorSpaceId(connection, operatorId, config);

  // console.log(r);
  connection.close();
}

main();
