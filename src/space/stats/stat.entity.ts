import { Column, Entity } from 'typeorm';

@Entity('stats', { schema: 'momentum3a' })
export class Stat {
  @Column('binary', { primary: true, name: 'worldId', length: 16 })
  worldId: Buffer;

  @Column('int', { name: 'columnId' })
  columnId: number;

  @Column('varchar', { primary: true, name: 'name', length: 46 })
  name: string;

  @Column('varchar', { name: 'value', length: 255 })
  value: string;
}
