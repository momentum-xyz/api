import { Connection } from 'typeorm';
import { getAllValidators, getKusamaConfig } from '../functions';
import { ValidatorSpace } from '../interfaces';
import { findConnected } from '../findConnected';

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

  const config = await getKusamaConfig(connection);
  const validators = await getAllValidators(connection, config);
  // console.log(validators);

  const taken: ValidatorSpace[] = [];

  // const kusamaId = 'EVfishUSWF6jePB9D5LtKLZQFpvTP8FYa9KkwJ4htzLLFMD';
  const kusamaId = 'Da6FyV3dbfwhbb8tssJqSCzC79pWEZzyXxp5vXySB8rQRJd';
  findConnected(kusamaId, validators, taken);

  console.log('Taken=');
  console.log(taken);
  console.log(taken.length);

  for (const validator of validators) {
    const kusamaId = validator.kusamaId;
    const taken = [];
    findConnected(kusamaId, validators, taken);
    if (taken.length > 1) {
      console.log(kusamaId, taken.length);
    }
  }

  await connection.close();
}

main();


// GLxyY9cx27VkZNrf33zHURwLLa58jU8XZeg8HDWkNpX2JXS 2
// CzugcapJWD8CEHBYHDeFpVcxfzFBCg57ic72y4ryJfXUnk7 100
// FUbMLUvMq3tnJK7jX8TaZmRCX9yRqEFNLsKK3K1UtfZw16v 2
// EWdQNuXSXY3RNdXKWet9sAeyqsc32ENkTnaug89pBjkFTA8 2
// Cdhjt72TSezVDkUzdgyoSwXByfwQJjuXSYcDs5L8snyB8Yx 2
// G4cQFMqRpWSzkNKxM2Uk6AVEShK2vCSWg7BWM34WZLw8dYn 2
// J3pxxiTcoyoJEWnhKmSWshZqvLTnGCcKoBRvoyoYPEqhtL8 8
// CeD8Kk3QLzp2HDRSciF6YQAc2xYAPurMsHAQUGwEJgCWAf2 4
// CzugcaXQoyXDnWWYUXQ1Yain1GZNCLQ76xGy3rny2h6dokB 100
// EctdZvgkphLJMQmKntaPP74LKpGvDKaj1cbqC8fUT4HzqiC 2
// G7ggTi6GvtXS9qfdWD8rnCXgWS5C93vc2FimcjtMWqpHpXg 2
