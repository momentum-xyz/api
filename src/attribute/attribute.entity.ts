import { BeforeInsert, Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { SpaceAttribute } from '../space-attributes/space-attributes.entity';
import { UserSpaceAttribute } from '../user-space-attribute/user-space-attribute.entity';

@Entity('attributes', { schema: 'momentum3a' })
export class Attribute {
  @PrimaryColumn('binary', { primary: true, name: 'id', length: 16 })
  id: Buffer;

  @Column('varchar', { name: 'name', length: 255 })
  name: string;

  @Column('text', { name: 'description', nullable: true })
  description: string | null;

  @Column('json', { name: 'parameters' })
  parameters: object;

  @OneToMany(() => SpaceAttribute, (spaceAttribute) => spaceAttribute.attribute)
  spaceAttributes: SpaceAttribute[];

  @OneToMany(() => UserSpaceAttribute, (userSpaceAttribute) => userSpaceAttribute.attribute)
  userSpaceAttributes: UserSpaceAttribute[];

  @BeforeInsert()
  generateUuid() {
    this.id = Buffer.from(uuidv4().replace(/-/g, ''), 'hex');
  }
}
