import { BeforeInsert, BeforeUpdate, Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Network } from '../../network/network.entity';

export enum TokenType {
  ERC20 = 'erc20',
  ERC721 = 'erc721',
  ERC1155 = 'erc1155',
}

@Entity('tokens', { schema: 'momentum3a' })
@Unique('token_constraint', ['contractAddress', 'network'])
export class Token {
  @Column('binary', { primary: true, name: 'id', length: 16 })
  id: Buffer;

  @Column('binary', { name: 'networkId', length: 16 })
  networkId: Buffer;

  @Column('varchar', { name: 'name', length: 255 })
  name: string;

  @Column('varbinary', { name: 'contract_address', length: 255 })
  contractAddress: Buffer;

  @Column({
    type: 'enum',
    name: 'token_type',
    enum: TokenType,
    nullable: false,
  })
  tokenType: TokenType;

  @Column('tinyint', { name: 'whitelisted', default: 0 })
  whitelisted: number;

  // Only applicable with ERC1155
  @Column('varchar', { name: 'token_category_id', nullable: true, length: 255 })
  tokenCategoryId: string | null;

  @ManyToOne(() => Network, (networks) => networks.tokens, {
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn([{ name: 'networkId', referencedColumnName: 'id' }])
  network: Network;

  @Column('timestamp', {
    name: 'updated_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @Column('timestamp', {
    name: 'created_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @BeforeInsert()
  generateUuid() {
    this.id = Buffer.from(uuidv4().replace(/-/g, ''), 'hex');
  }

  @BeforeUpdate()
  updateTimestamp() {
    this.updatedAt = new Date();
  }
}
