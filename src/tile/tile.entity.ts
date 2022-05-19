import { BeforeInsert, BeforeUpdate, Column, Entity, Index } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export enum TileType {
  TILE_TYPE_TEXT = 'TILE_TYPE_TEXT',
  TILE_TYPE_MEDIA = 'TILE_TYPE_MEDIA',
  TILE_TYPE_VIDEO = 'TILE_TYPE_VIDEO',
}

export enum PermanentType {
  NONE = 'none',
  POSTER = 'poster',
  MEME = 'meme',
  LOGO = 'logo',
  DESCRIPTION = 'description',
  VIDEO = 'video',
  SOLUTION = 'solution',
  PROBLEM = 'problem',
}

@Index('FK_93fc8c2662acb6d36b4935b02c5', ['spaceId', 'uiTypeId'], {})
@Entity('tiles', { schema: 'momentum3a' })
export class Tile {
  @Column('binary', { primary: true, name: 'id', length: 16 })
  id: Buffer;

  @Column('binary', { name: 'spaceId', length: 16 })
  spaceId: Buffer;

  @Column('binary', { name: 'uiTypeId', length: 16 })
  uiTypeId: Buffer;

  @Column('tinyint', { name: 'render', default: 0 })
  render: number;

  @Column('tinyint', { name: 'edited', default: 0 })
  edited: number;

  @Column('varchar', {
    name: 'hash',
    length: 32,
    default: 'a6d61b2bffb785299aa1eb26e1b540e9',
  })
  hash: string | null;

  @Column({
    name: 'permanentType',
    type: 'enum',
    enum: PermanentType,
    nullable: true,
  })
  permanentType: PermanentType;

  @Column('json', { name: 'content' })
  content: object;

  @Column('int', { name: 'row' })
  row: number;

  @Column('int', { name: 'column' })
  column: number;

  @Column({
    type: 'enum',
    enum: TileType,
    default: TileType.TILE_TYPE_TEXT,
  })
  type: TileType;

  @Column('timestamp', {
    name: 'created_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @Column('timestamp', {
    name: 'updated_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @BeforeInsert()
  generateUuid() {
    this.id = Buffer.from(uuidv4().replace(/-/g, ''), 'hex');
  }

  @BeforeUpdate()
  updateTimestamp() {
    this.updatedAt = new Date();
  }
}
