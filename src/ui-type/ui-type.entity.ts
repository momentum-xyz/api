import { BeforeInsert, Column, Entity, OneToMany } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Space } from '../space/space.entity';

@Entity('ui_types', { schema: 'momentum3a' })
export class UiType {
  @Column('binary', { primary: true, name: 'id', length: 16 })
  id: Buffer;

  @Column('varchar', { name: 'name', length: 255 })
  name: string;

  @Column('varchar', { name: 'tag', length: 255 })
  tag: string;

  @Column('json', { name: 'parameters' })
  parameters: object;

  @OneToMany(() => Space, (spaces) => spaces.uiType)
  spaces: Space[];

  @BeforeInsert()
  generateUuid() {
    this.id = Buffer.from(uuidv4().replace(/-/g, ''), 'hex');
  }
}
