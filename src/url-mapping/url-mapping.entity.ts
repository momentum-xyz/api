import { Column, Entity } from 'typeorm';

@Entity('url_mapping', { schema: 'momentum3a' })
export class UrlMapping {
  @Column('varchar', { primary: true, name: 'URL', length: 255 })
  URL: string;

  @Column('binary', { name: 'worldId', length: 16 })
  worldId: Buffer;
}
