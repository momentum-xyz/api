import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Space } from '../space/space.entity';
import { User } from '../user/user.entity';

@Index('fkIdx_787', ['userId'], {})
@Index('fkIdx_792', ['spaceId'], {})
@Entity('online_users', { schema: 'momentum3a' })
export class OnlineUser {
  @Column('binary', { primary: true, name: 'userId', length: 16 })
  userId: Buffer;

  @Column('binary', { primary: true, name: 'spaceId', length: 16 })
  spaceId: Buffer;

  @ManyToOne(() => User, (user) => user.onlineUsers, {
    primary: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn([{ name: 'userId', referencedColumnName: 'id' }])
  user: User;

  @ManyToOne(() => Space, (space) => space.onlineUsers, {
    primary: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn([{ name: 'spaceId', referencedColumnName: 'id' }])
  space: Space;
}
