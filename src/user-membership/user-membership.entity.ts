import { BeforeInsert, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { User } from '../user/user.entity';
import { v4 as uuidv4 } from 'uuid';

@Index('fkIdx_478', ['id'], {})
@Index('fkIdx_481', ['memberOf'], {})
@Entity('user_membership', { schema: 'momentum3a' })
export class UserMembership {
  @Column('binary', { primary: true, name: 'id', length: 16 })
  id: Buffer;

  @Column('tinyint', { name: 'isAdmin', default: 0 })
  isAdmin: number;

  @Column('binary', { primary: true, name: 'memberOf', length: 16 })
  memberOf: Buffer;

  @ManyToOne(() => User, (user) => user.userMemberships, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn([{ name: 'id', referencedColumnName: 'id' }])
  user: User;

  @ManyToOne(() => User, (user) => user.userMemberships2, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn([{ name: 'memberOf', referencedColumnName: 'id' }])
  memberOf2: User;

  @BeforeInsert()
  generateUuid() {
    this.id = Buffer.from(uuidv4().replace(/-/g, ''), 'hex');
  }
}
