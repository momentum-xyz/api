import { Column, Entity } from 'typeorm';

@Entity('aux_table', { schema: 'momentum3a' })
export class AuxTable {
  @Column('binary', { primary: true, name: 'spaceId', length: 16 })
  spaceId: Buffer;

  @Column('varchar', { name: 'some_stuff', length: 32 })
  some_stuff: string;
}
