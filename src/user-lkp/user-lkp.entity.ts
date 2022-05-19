import { BeforeUpdate, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Space } from '../space/space.entity';
import { User } from '../user/user.entity';

@Index('fkIdx_489', ['spaceId'], {})
@Index('fkIdx_492', ['userId'], {})
@Entity('user_lkp', { schema: 'momentum3a' })
export class UserLkp {
  @Column('binary', { primary: true, name: 'spaceId', length: 16 })
  spaceId: Buffer;

  @Column('binary', { primary: true, name: 'userId', length: 16 })
  userId: Buffer;

  @Column('float', { name: 'x', precision: 12 })
  x: number;

  @Column('float', { name: 'y', precision: 12 })
  y: number;

  @Column('float', { name: 'z', precision: 12 })
  z: number;

  @Column('datetime', {
    name: 'created_at',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date | null;

  @Column('datetime', {
    name: 'updated_at',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date | null;

  @ManyToOne(() => Space, (spaces) => spaces.userLkps, {
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn([{ name: 'spaceId', referencedColumnName: 'id' }])
  space: Space;

  @ManyToOne(() => User, (users) => users.userLkps, {
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn([{ name: 'userId', referencedColumnName: 'id' }])
  user: User;

  @BeforeUpdate()
  updateTimestamp() {
    this.updatedAt = new Date();
  }
}
