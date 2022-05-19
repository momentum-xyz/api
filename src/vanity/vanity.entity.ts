import { BeforeInsert, BeforeUpdate, Column, Entity, OneToOne } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { UserVanity } from '../user-vanity/user-vanity.entity';

@Entity('vanities', { schema: 'momentum3a' })
export class Vanity {
  @Column('binary', { primary: true, name: 'id', length: 16 })
  id: Buffer;

  @Column('varchar', { name: 'name', length: 255 })
  name: string;

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

  @OneToOne(() => UserVanity, (userVanity) => userVanity.vanity)
  userVanity: UserVanity;

  @BeforeInsert()
  generateUuid() {
    this.id = Buffer.from(uuidv4().replace(/-/g, ''), 'hex');
  }

  @BeforeUpdate()
  updateTimestamp() {
    this.updatedAt = new Date();
  }
}
