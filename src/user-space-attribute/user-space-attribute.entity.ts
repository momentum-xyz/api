import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Attribute } from '../attribute/attribute.entity';
import { Space } from '../space/space.entity';
import { User } from '../user/user.entity';

@Index('fkIdx_676', ['attributeId'], {})
@Index('fkIdx_682', ['userId'], {})
@Index('fkIdx_693', ['spaceId'], {})
@Entity('user_space_attributes', { schema: 'momentum3a' })
export class UserSpaceAttribute {
  @Column('binary', { primary: true, name: 'attributeId', length: 16 })
  attributeId: Buffer;

  @Column('binary', { primary: true, name: 'spaceId', length: 16 })
  spaceId: Buffer;

  @Column('binary', { primary: true, name: 'userId', length: 16 })
  userId: Buffer;

  @Column('tinyint', { name: 'flag', default: () => 0 })
  flag: number;

  @ManyToOne(() => Attribute, (attribute) => attribute.userSpaceAttributes, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    primary: true,
  })
  @JoinColumn([{ name: 'attributeId', referencedColumnName: 'id' }])
  attribute: Attribute;

  @ManyToOne(() => Space, (space) => space.userSpaceAttributes, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    primary: true,
  })
  @JoinColumn([{ name: 'spaceId', referencedColumnName: 'id' }])
  space: Space;

  @ManyToOne(() => User, (user) => user.userSpaceAttributes, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    primary: true,
  })
  @JoinColumn([{ name: 'userId', referencedColumnName: 'id' }])
  user: User;
}
