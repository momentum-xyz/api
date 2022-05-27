import { BeforeInsert, BeforeUpdate, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../user/user.entity';

@Index('fkIdx_585', ['userId'], {})
@Entity('subscriptions', { schema: 'momentum3a' })
export class Subscription {
  @Column('binary', { primary: true, name: 'id', length: 16 })
  id: Buffer;

  @Column('text', { name: 'email' })
  email: string;

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

  @Column('json', { name: 'data' })
  data: object;

  @Column('binary', { name: 'userId', nullable: true, length: 16 })
  userId: Buffer | null;

  @ManyToOne(() => User, (users) => users.subscriptions, {
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn([{ name: 'userId', referencedColumnName: 'id' }])
  user: User;

  @BeforeInsert()
  generateUuid() {
    this.id = Buffer.from(uuidv4().replace(/-/g, ''), 'hex');
  }

  @BeforeUpdate()
  updateTimestamp() {
    this.updatedAt = new Date();
  }
}
