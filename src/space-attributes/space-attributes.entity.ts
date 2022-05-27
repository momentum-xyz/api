import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Attribute } from '../attribute/attribute.entity';
import { Space } from '../space/space.entity';

@Index('fkIdx_686', ['attributeId'], {})
@Index('fkIdx_690', ['spaceId'], {})
@Entity('space_attributes', { schema: 'momentum3a' })
export class SpaceAttribute {
  @Column('binary', { primary: true, name: 'attributeId', length: 16 })
  attributeId: Buffer;

  @Column('binary', { primary: true, name: 'spaceId', length: 16 })
  spaceId: Buffer;

  @ManyToOne(() => Attribute, (attribute) => attribute.spaceAttributes, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    primary: true,
  })
  @JoinColumn([{ name: 'attributeId', referencedColumnName: 'id' }])
  attribute: Attribute;

  @ManyToOne(() => Space, (space) => space.spaceAttributes, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    primary: true,
  })
  @JoinColumn([{ name: 'spaceId', referencedColumnName: 'id' }])
  space: Space;
}
