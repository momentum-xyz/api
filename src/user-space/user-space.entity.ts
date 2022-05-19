import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Space } from '../space/space.entity';
import { User } from '../user/user.entity';

@Index('fkIdx_419', ['spaceId'], {})
@Index('fkIdx_486', ['userId'], {})
@Entity('user_spaces', { schema: 'momentum3a' })
export class UserSpace {
  @Column('binary', { primary: true, name: 'spaceId', length: 16 })
  spaceId: Buffer;

  @Column('binary', { primary: true, name: 'userId', length: 16 })
  userId: Buffer;

  @Column('tinyint', { name: 'isAdmin', default: () => false })
  isAdmin: boolean;

  @ManyToOne(() => Space, (space) => space.userSpaces, {
    primary: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn([{ name: 'spaceId', referencedColumnName: 'id' }])
  space: Space;

  @ManyToOne(() => User, (user) => user.userSpaces, {
    primary: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn([{ name: 'userId', referencedColumnName: 'id' }])
  user: User;
}
