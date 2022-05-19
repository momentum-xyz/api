import { Connection } from 'typeorm';
import { claimSpace } from '../claim/functions';
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

  // const config = await getKusamaConfig(connection);
  // const validators = await getAllValidators(connection, config);
  // console.log(validators);

  // const wallet = 'E2YYXgWRksADrZqKB7UNtUEo1L8aMwdvQ2byXbz6vWYmhHj'; // 2 1 cluster
  // const wallet = 'CeD8Kk3QLzp2HDRSciF6YQAc2xYAPurMsHAQUGwEJgCWAf2'; // 4 1 cluster
  // const wallet = 'GxuEngysAC4a5SZX9w7eTVY4iye8RRxVVXbzfSxXzJ8Nf3Y'; // 17
  // const wallet = 'CzugcapJWD8CEHBYHDeFpVcxfzFBCg57ic72y4ryJfXUnk7';  // 100

  // const wallet = 'Da6FyV3dbfwhbb8tssJqSCzC79pWEZzyXxp5vXySB8rQRJd';

  // const wallet = 'GXaUd6gyCaEoBVzXnkLVGneCF3idnLNtNZs5RHTugb9dCpY'; // No validator

  const wallet = 'FPYeJ7sFitnWbncKikQZCfN6p6znTpkCHo3ihr8eyScGpgX';

  const mqtt = new MQTT();
  await mqtt.connect();
  const kusamaOperator = new KusamaOperator(connection, mqtt);
  await claimSpace(connection, wallet, kusamaOperator);

  await connection.close();
}

main();
