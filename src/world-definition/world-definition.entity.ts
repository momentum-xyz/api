import { Column, Entity, Index } from 'typeorm';
import { KusamaConfig } from '../reflector/interfaces';

@Index('fkIdx_828', ['id'], {})
@Entity('world_definition', { schema: 'momentum3a' })
export class WorldDefinition {
  @Column('binary', { primary: true, name: 'id', length: 16 })
  id: Buffer;

  @Column('json', { name: 'tiers' })
  tiers: Tier[];

  @Column('binary', { name: 'gat_anchor_space', length: 16 })
  gatAnchorSpace: Buffer;

  @Column('json', { name: 'config' })
  config: KusamaConfig;

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

  @Column('int', {
    name: 'userSpacesLimit',
    default: 0,
    nullable: false,
  })
  userSpacesLimit: number;
}

export interface Tier {
  spaceTypeId: string;
  childrenLimit: number;
}
