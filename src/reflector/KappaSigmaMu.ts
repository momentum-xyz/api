import { Connection } from 'typeorm';
import { MQTT } from './MQTT';
import { u8aToHex } from '@polkadot/util';
import { decodeAddress } from '@polkadot/util-crypto';
import { KusamaConfig, Queryable } from './interfaces';
import { getKusamaConfig } from './functions';
import { escape } from 'mysql';

export class KappaSigmaMu {
  private previousHexWallets: string[] = [];

  constructor(private readonly connection: Connection, private readonly mqtt: MQTT) {
    const listener = this.updateMembers.bind(this);
    mqtt.onEvent('kappa_sigma_mu', listener);
  }

  public async onNewUser(hexWallet: string) {
    hexWallet = hexWallet.toLowerCase();

    if (this.previousHexWallets.includes(hexWallet) === false) {
      return;
    }

    const hexWallet2uid = await this.getUserIds(this.connection, [hexWallet]);
    const uid = hexWallet2uid[hexWallet];

    const config = await getKusamaConfig(this.connection);

    await this.insertMembers(this.connection, [uid], config);
  }

  private async updateMembers(accountIds: string[]) {
    // TODO for tests only
    // accountIds = [];
    accountIds.push('EqzmkHwD8uL6HDyr2fWumNu7M39sTWkBjerNrms3mTE1R4v');
    //accountIds.push('0x0C884917B7C262BCBCC19367C9B63DB0CBD2D8CBE7FA636AC76E3CF4AE5FBC12');

    console.log(accountIds);
    const hexWallets = accountIds.map((wallet) => {
      return u8aToHex(decodeAddress(wallet)).toLowerCase();
    });
    console.log(hexWallets);

    const { created, removed } = KappaSigmaMu.getDiff(hexWallets, this.previousHexWallets);
    this.previousHexWallets = hexWallets;

    const hexWallet2uid = await this.getUserIds(this.connection, hexWallets);
    const allUids: string[] = [];
    for (const hexWallet of hexWallets) {
      if (hexWallet2uid[hexWallet]) {
        allUids.push(hexWallet2uid[hexWallet]);
      }
    }

    const config = await getKusamaConfig(this.connection);
    await this.removeAllExcept(this.connection, allUids, config);

    const toFind = created.concat(removed);
    if (toFind.length === 0) {
      console.log('KappaSigmaMu no changes in members');
      return;
    }

    const createdUids = [];
    for (const hexWallet of created) {
      if (hexWallet2uid[hexWallet]) {
        createdUids.push(hexWallet2uid[hexWallet]);
      }
    }

    const removedUids = [];
    for (const hexWallet of removed) {
      if (hexWallet2uid[hexWallet]) {
        removedUids.push(hexWallet2uid[hexWallet]);
      }
    }

    await this.insertMembers(this.connection, createdUids, config);

    // await this.removeMembers(this.connection, removedUids);

    // console.log('===');
    // console.log(hexWallet2uid);
  }

  public static getDiff(newArr: string[], oldArr: string[]) {
    const uniqueNew = [...new Set(newArr)];
    const uniqueOld = [...new Set(oldArr)];

    const created = uniqueNew.filter((x) => !uniqueOld.includes(x));
    const removed = uniqueOld.filter((x) => !uniqueNew.includes(x));

    return { created, removed };
  }

  private async getUserIds(conn: Queryable, hexWallets: string[]): Promise<Record<string, string>> {
    const sql = `
        SELECT BIN_TO_UUID(userId) as userId, CONCAT('0x', LOWER(HEX(wallet))) as hexWallet
        FROM user_wallets
        WHERE wallet IN (${hexWallets.join(',')})
    `;

    const rows = await conn.query(sql);

    const map = {};
    for (const row of rows) {
      map[row.hexWallet] = row.userId;
    }

    return map;
  }

  private async insertMembers(conn: Queryable, uids: string[], config: KusamaConfig) {
    if (uids.length === 0) {
      return;
    }
    const values = [];

    for (const uid of uids) {
      values.push(`(
          UUID_TO_BIN(${escape(uid)}), 
          0,
          UUID_TO_BIN(${escape(config.users.society)})
      )`);
    }

    const sql = `
        INSERT IGNORE INTO user_membership (id, isAdmin, memberOf)
        VALUES ${values.join(',')}
    `;

    // console.log(sql);
    await conn.query(sql);
  }

  private async removeMembers(conn: Queryable, uids: string[], config: KusamaConfig) {
    if (uids.length === 0) {
      return;
    }

    const values = [];

    for (const uid of uids) {
      values.push(`UUID_TO_BIN(${escape(uid)})`);
    }
    const sql = `
        DELETE
        FROM user_membership
        WHERE id IN (${values.join(',')})
          AND memberOf = UUID_TO_BIN(${escape(config.users.society)})
    `;

    // console.log(sql);
    await conn.query(sql);
  }

  private async removeAllExcept(conn: Queryable, uids: string[], config: KusamaConfig) {
    const values = [];

    for (const uid of uids) {
      values.push(`UUID_TO_BIN(${escape(uid)})`);
    }

    let filterSQL = ``;
    if (values.length > 0) {
      filterSQL = `AND id NOT IN (${values.join(',')})`;
    }

    const sql = `
        DELETE
        FROM user_membership
        WHERE true
          ${filterSQL}
          AND memberOf = UUID_TO_BIN(${escape(config.users.society)})
    `;

    // console.log(sql);
    await conn.query(sql);
  }
}
