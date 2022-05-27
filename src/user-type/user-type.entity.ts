import { BeforeInsert, Column, Entity, OneToMany } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../user/user.entity';

@Entity('user_types', { schema: 'momentum3a' })
export class UserType {
  @Column('binary', { primary: true, name: 'id', length: 16 })
  id: Buffer;

  @Column('varchar', { name: 'name', length: 255 })
  name: string;

  @Column('varchar', { name: 'description', length: 255 })
  description: string;

  @OneToMany(() => User, (users) => users.userType)
  users: User[];

  @BeforeInsert()
  generateUuid() {
    this.id = Buffer.from(uuidv4().replace(/-/g, ''), 'hex');
  }
}
