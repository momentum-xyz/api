import { v4 as uuidv4 } from 'uuid';
import { BeforeInsert, Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { SpaceIntegration } from '../space-integrations/space-integrations.entity';
import { Attendee } from './attendees/attendee.entity';

@Entity('space_integration_events', { schema: 'momentum3a' })
export class Event {
  @Column('binary', { primary: true, name: 'id', length: 16 })
  id: Buffer;

  @Column('binary', { primary: true, name: 'spaceId', length: 16 })
  spaceId: Buffer;

  @Column('binary', { primary: true, name: 'integrationTypeId', length: 16 })
  integrationTypeId: Buffer;

  @Column('varchar', { name: 'title', length: 255 })
  title: string;

  @Column('varchar', { name: 'hosted_by', length: 255 })
  hosted_by: string;

  @Column('varchar', { name: 'image_hash', length: 255 })
  image_hash: string;

  @Column('varchar', { name: 'web_link', length: 255 })
  web_link: string;

  @Column('text', { name: 'description' })
  description: string;

  @ManyToOne(() => SpaceIntegration, (spaceIntegration) => spaceIntegration.spaceIntegrationUsers, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    primary: true,
  })
  @JoinColumn([
    { name: 'spaceId', referencedColumnName: 'spaceId' },
    { name: 'integrationTypeId', referencedColumnName: 'integrationTypeId' },
  ])
  spaceIntegration: SpaceIntegration;

  @OneToMany(() => Attendee, (attendee) => attendee.event)
  attendees: Attendee[];

  @Column('timestamp', {
    name: 'start',
  })
  start: Date;

  @Column('timestamp', {
    name: 'end',
    default: () => 'CURRENT_TIMESTAMP',
  })
  end: Date;

  @Column('timestamp', {
    name: 'created',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @Column('timestamp', {
    name: 'modified',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @BeforeInsert()
  generateUuid() {
    this.id = Buffer.from(uuidv4().replace(/-/g, ''), 'hex');
  }
}
