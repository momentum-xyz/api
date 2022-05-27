import { BeforeInsert, BeforeUpdate, Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Token } from '../token/token.entity';
import { User } from '../../user/user.entity';

export interface TokenRuleInterface {
  minBalance: number;
}

export enum TokenRuleStatus {
  REQUESTED = 'requested',
  APPROVED = 'approved',
  DENIED = 'denied',
}

@Entity('token_rules', { schema: 'momentum3a' })
export class TokenRule {
  public static readonly USER_TYPE_COLUMN_NAME = 'Token Groups';

  @Column('binary', { primary: true, name: 'id', length: 16 })
  id: Buffer;

  @Column('binary', { primary: true, name: 'tokenId', length: 16 })
  tokenId: Buffer;

  @Column('binary', { primary: true, name: 'tokenGroupUserId', length: 16 })
  tokenGroupUserId: Buffer;

  @Column('varchar', { name: 'name', length: 1024 })
  name: string;

  @Column({
    type: 'enum',
    enum: TokenRuleStatus,
    default: TokenRuleStatus.DENIED,
  })
  status: TokenRuleStatus;

  @Column('json', { name: 'rule' })
  rule: TokenRuleInterface;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn([{ name: 'userId', referencedColumnName: 'id' }])
  user: User;

  @OneToOne(() => User, (user) => user.id, {
    primary: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn([{ name: 'tokenGroupUserId', referencedColumnName: 'id' }])
  tokenGroupUser: User;

  @ManyToOne(() => Token, (token) => token.id, {
    primary: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn([{ name: 'tokenId', referencedColumnName: 'id' }])
  token: Token;

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
