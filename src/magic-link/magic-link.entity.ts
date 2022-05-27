import { BeforeInsert, BeforeUpdate, Column, Entity } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export enum MagicType {
  OPEN_SPACE = 'OPEN_SPACE',
  JOIN_MEETING = 'JOIN_MEETING',
  FLY = 'FLY',
  EVENT = 'event',
}

@Entity('magic_links', { schema: 'momentum3a' })
export class MagicLink {
  @Column('binary', { primary: true, name: 'id', length: 16 })
  id: Buffer;

  @Column({
    type: 'enum',
    enum: MagicType,
    default: MagicType.OPEN_SPACE,
  })
  type: MagicType;

  @Column('json', { name: 'data' })
  data: object;

  @Column('timestamp', { name: 'expire' })
  expire: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @BeforeInsert()
  generateUuid() {
    this.id = Buffer.from(uuidv4().replace(/-/g, ''), 'hex');
  }

  @BeforeUpdate()
  updateTimestamp() {
    this.updated_at = new Date();
  }
}
