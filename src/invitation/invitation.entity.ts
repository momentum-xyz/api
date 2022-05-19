import { BeforeInsert, BeforeUpdate, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Space } from '../space/space.entity';

@Index('fkIdx_447', ['spaceId'], {})
@Entity('invitations', { schema: 'momentum3a' })
export class Invitation {
  @Column('binary', { primary: true, name: 'id', length: 16 })
  id: Buffer;

  @Column('varchar', { name: 'email', length: 255 })
  email: string;

  @Column('tinyint', { name: 'isAdmin', default: () => false })
  isAdmin: boolean;

  @Column('timestamp', { name: 'expires_at' })
  expiresAt: Date;

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

  @Column('binary', { name: 'spaceId', length: 16 })
  spaceId: Buffer;

  @ManyToOne(() => Space, (spaces) => spaces.invitations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([{ name: 'spaceId', referencedColumnName: 'id' }])
  space: Space;

  @BeforeInsert()
  generateUuid() {
    this.id = Buffer.from(uuidv4().replace(/-/g, ''), 'hex');
  }

  @BeforeUpdate()
  updateTimestamp() {
    this.updatedAt = new Date();
  }
}
