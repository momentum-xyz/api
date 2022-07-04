import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  Tree,
  TreeChildren,
  TreeParent,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { SpaceType } from '../space-type/space-type.entity';
import { UserSpace } from '../user-space/user-space.entity';
import { Vibe } from '../vibe/vibe.entity';
import { SpaceAttribute } from '../space-attributes/space-attributes.entity';
import { UserSpaceAttribute } from '../user-space-attribute/user-space-attribute.entity';
import { Invitation } from '../invitation/invitation.entity';
import { User } from '../user/user.entity';
import { UserLkp } from '../user-lkp/user-lkp.entity';
import { UiType } from '../ui-type/ui-type.entity';
import { WorldDefinition } from '../world-definition/world-definition.entity';
import { OnlineUser } from '../online-user/online-user.entity';
import { SpacePlaylist } from '../space-playlist/space-playlist.entity';
import { SpaceIntegration } from '../space-integrations/space-integrations.entity';

export const SPACE_VISIBILITY = {
  UNITY_ONLY: -1,
  HIDDEN: 0,
  VISIBLE: 1,
} as const;

@Index('fkIdx_383', ['spaceTypeId'], {})
@Index('fkIdx_474', ['ownedById'], {})
@Index('fkIdx_588', ['uiTypeId'], {})
@Index('ind_535', ['name'], {})
@Entity('spaces', { schema: 'momentum3a' })
@Tree('materialized-path')
export class Space {
  @Column('binary', { primary: true, name: 'id', length: 16 })
  id: Buffer;

  @Column('json', { name: 'frame_templates', nullable: true })
  frame_templates: object;

  @Column('binary', { name: 'parentId', nullable: true, length: 16 })
  parentId: Buffer;

  @Column('binary', { name: 'ownedById', length: 16 })
  ownedById: Buffer;

  @Column('binary', { name: 'uiTypeId', length: 16, nullable: true })
  uiTypeId: Buffer;

  @Column('binary', { name: 'spaceTypeId', length: 16 })
  spaceTypeId: Buffer;

  @Column('varchar', { name: 'name', nullable: true, length: 255 })
  name: string | null;

  @Column('varchar', { name: 'name_hash', nullable: true, length: 32 })
  nameHash: string | null;

  @Column('tinyint', { name: 'secret', default: () => false })
  secret: boolean;

  @Column('tinyint', { name: 'visible', nullable: true })
  visible: number;

  @Column('json', { name: 'asset_parameters', nullable: true })
  assetParameters: object | null;

  @Column('json', { name: 'parameters2D', nullable: true })
  parameters2D: object | null;

  @Column('json', { name: 'allowed_subspaces', nullable: true })
  allowed_subspaces: string[] | null;

  @Column('json', { name: 'child_placement', nullable: true })
  child_placement: object;

  @Column('json', { name: 'metadata', nullable: true })
  metadata: object | null;

  @Column('tinyint', { name: 'minimap', nullable: true })
  minimap: boolean;

  @Column('timestamp', {
    name: 'updated_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @Column('timestamp', {
    name: 'created_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @Column('json', { name: 'parameters3D', nullable: true })
  parameters3D: object | null;

  @ManyToOne(() => SpaceType, (spaceTypes) => spaceTypes.spaces, {
    eager: true,
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn([{ name: 'spaceTypeId', referencedColumnName: 'id' }])
  spaceType: SpaceType;

  @TreeParent({ onDelete: 'CASCADE' })
  parent: Space;

  @TreeChildren()
  children: Space[];

  @OneToMany(() => UserSpace, (userSpaces) => userSpaces.space)
  userSpaces: UserSpace[];

  @OneToMany(() => OnlineUser, (onlineUsers) => onlineUsers.space)
  onlineUsers: OnlineUser[];

  @OneToMany(() => Vibe, (vibes) => vibes.space)
  vibes: Vibe[];

  @OneToMany(() => SpaceAttribute, (spaceAttributes) => spaceAttributes.space)
  spaceAttributes: SpaceAttribute[];

  @OneToMany(() => SpacePlaylist, (spacePlaylists) => spacePlaylists.space)
  spacePlaylists: SpacePlaylist[];

  @OneToMany(() => SpaceIntegration, (spaceIntegrations) => spaceIntegrations.integrationType)
  spaceIntegrations: SpaceIntegration[];

  @OneToMany(() => UserSpaceAttribute, (userSpaceAttribute) => userSpaceAttribute.space)
  userSpaceAttributes: UserSpaceAttribute[];

  @OneToMany(() => Invitation, (invitations) => invitations.space)
  invitations: Invitation[];

  @ManyToOne(() => User, (users) => users.spaces, {
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn([{ name: 'ownedById', referencedColumnName: 'id' }])
  ownedBy: User;

  @OneToMany(() => UserLkp, (userLkp) => userLkp.space)
  userLkps: UserLkp[];

  @ManyToOne(() => UiType, (uiTypes) => uiTypes.spaces, {
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn([{ name: 'uiTypeId', referencedColumnName: 'id' }])
  uiType: UiType;

  @OneToOne(() => WorldDefinition, (worldDefinition) => worldDefinition.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    primary: true,
  })
  @JoinColumn([{ name: 'id', referencedColumnName: 'id' }])
  worldDefinition: WorldDefinition;

  @BeforeInsert()
  generateUuid() {
    this.id = Buffer.from(uuidv4().replace(/-/g, ''), 'hex');
  }

  @BeforeUpdate()
  updateTimestamp() {
    this.updatedAt = new Date();
  }
}
