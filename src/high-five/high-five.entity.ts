import { BeforeUpdate, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { User } from '../user/user.entity';

@Index('fkIdx_545', ['senderId'], {})
@Index('fkIdx_548', ['receiverId'], {})
@Entity('high_fives', { schema: 'momentum3a' })
export class HighFive {
  @Column('binary', { primary: true, name: 'senderId', length: 16 })
  senderId: Buffer;

  @Column('binary', { primary: true, name: 'receiverId', length: 16 })
  receiverId: Buffer;

  @Column({ type: 'int', name: 'cnt' })
  cnt: number;

  @ManyToOne(() => User, (users) => users.highFives, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn([{ name: 'senderId', referencedColumnName: 'id' }])
  sender: User;

  @ManyToOne(() => User, (users) => users.highFives2, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn([{ name: 'receiverId', referencedColumnName: 'id' }])
  receiver: User;

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

  @BeforeUpdate()
  updateTimestamp() {
    this.updatedAt = new Date();
  }
}
