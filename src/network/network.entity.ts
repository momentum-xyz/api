import { BeforeInsert, BeforeUpdate, Column, Entity, OneToMany } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { UserWallet } from '../user-wallet/user-wallet.entity';
import { Token } from '../tokens/token/token.entity';

export enum NetworkType {
  ETH_MAINNET = 'eth_mainnet',
  MOONBEAM = 'moonbeam',
  POLKADOT = 'polkadot',
}

@Entity('networks', { schema: 'momentum3a' })
export class Network {
  @Column('binary', { primary: true, name: 'id', length: 16 })
  id: Buffer;

  @Column('varchar', { name: 'name', length: 255 })
  name: string;

  @Column('json', { name: 'options' })
  options: object;

  @Column('text', { name: 'description' })
  description: string;

  @Column('timestamp', {
    name: 'created_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @Column('timestamp', {
    name: 'updated_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @OneToMany(() => UserWallet, (userWallets) => userWallets.network)
  userWallets: UserWallet[];

  @OneToMany(() => Token, (tokens) => tokens.network)
  tokens: Token[];

  @BeforeInsert()
  generateUuid() {
    this.id = Buffer.from(uuidv4().replace(/-/g, ''), 'hex');
  }

  @BeforeUpdate()
  updateTimestamp() {
    this.updatedAt = new Date();
  }
}
