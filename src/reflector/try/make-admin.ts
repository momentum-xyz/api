import { Connection } from 'typeorm';
import { tryMakeAdmin } from '../claim/functions';

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

  const wallet = 'HyDKbNnozPXbudff3ASzaGRmTLDvRUpCUtgnLDkCSE3yWYj';
  await tryMakeAdmin(connection, wallet, null);

  await connection.close();
}

main();
