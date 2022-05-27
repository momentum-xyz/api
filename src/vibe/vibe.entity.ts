import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { User } from '../user/user.entity';
import { Space } from '../space/space.entity';

@Entity('vibes', { schema: 'momentum3a' })
export class Vibe {
  @Column('binary', { primary: true, name: 'userId', length: 16 })
  userId: Buffer;

  @Column('binary', { primary: true, name: 'spaceId', length: 16 })
  spaceId: Buffer;

  @ManyToOne(() => User, (user) => user.vibes, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    primary: true,
  })
  @JoinColumn([{ name: 'userId', referencedColumnName: 'id' }])
  user: User;

  @ManyToOne(() => Space, (space) => space.vibes, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    primary: true,
  })
  @JoinColumn([{ name: 'spaceId', referencedColumnName: 'id' }])
  space: Space;
}
