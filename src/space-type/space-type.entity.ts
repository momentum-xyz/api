import { BeforeInsert, Column, Entity, Index, OneToMany } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Space } from '../space/space.entity';

@Index('ind_533', ['name'], {})
@Index('ind_534', ['auxiliaryTables'], {})
@Entity('space_types', { schema: 'momentum3a' })
export class SpaceType {
  @Column('binary', { primary: true, name: 'id', length: 16 })
  id: Buffer;

  @Column('binary', { name: 'uiTypeId', nullable: false, length: 16 })
  uiTypeId: Buffer;

  @Column('varchar', { name: 'name', length: 127 })
  name: string;

  @Column('json', { name: 'child_placement', nullable: false })
  child_placement: object;

  @Column('binary', { name: 'asset', nullable: true, length: 16 })
  asset: Buffer;

  @Column('tinyint', { name: 'minimap', default: () => 1 })
  minimap: boolean;

  @Column('tinyint', { name: 'visible', default: () => 1 })
  visible: boolean;

  @Column('json', { name: 'auxiliary_tables' })
  auxiliaryTables: object;

  @Column('varchar', { name: 'description', nullable: true, length: 255 })
  description: string | null;

  @Column('json', { name: 'type_parameters' })
  typeParameters: object;

  @Column('json', { name: 'default_instance_parameters', nullable: true })
  defaultInstanceParameters: object | null;

  @Column('text', { name: 'asset_types', nullable: true })
  assetTypes: string | null;

  @Column('json', { name: 'type_parameters_2D', nullable: true })
  typeParameters_2D: object | null;

  @Column('json', { name: 'type_parameters_3D', nullable: true })
  typeParameters_3D: object | null;

  @Column('json', { name: 'default_tiles', nullable: true })
  default_tiles: object | null;

  @Column('json', { name: 'frame_templates', nullable: false })
  frame_templates: object;

  @Column('json', { name: 'allowed_subspaces', nullable: false })
  allowed_subspaces: string[];

  @OneToMany(() => Space, (spaces) => spaces.spaceType)
  spaces: Space[];

  @BeforeInsert()
  generateUuid() {
    this.id = Buffer.from(uuidv4().replace(/-/g, ''), 'hex');
  }
}
