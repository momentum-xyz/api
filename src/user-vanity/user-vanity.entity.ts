import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { User } from '../user/user.entity';
import { Vanity } from '../vanity/vanity.entity';

@Index('fkIdx_495', ['userId'], {})
@Entity('user_vanity', { schema: 'momentum3a' })
export class UserVanity {
  @Column('binary', { primary: true, name: 'vanityId', length: 16 })
  vanityId: Buffer;

  @Column('binary', { name: 'userId', length: 16 })
  userId: Buffer;

  @ManyToOne(() => User, (users) => users.userVanities, {
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn([{ name: 'userId', referencedColumnName: 'id' }])
  user: User;

  @OneToOne(() => Vanity, (vanities) => vanities.userVanity, {
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn([{ name: 'vanityId', referencedColumnName: 'id' }])
  vanity: Vanity;
}
