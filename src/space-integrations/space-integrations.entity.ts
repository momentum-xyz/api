import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { IntegrationType } from '../integration-type/integration-type.entity';
import { Space } from '../space/space.entity';
import { SpaceIntegrationUser } from '../space-integration-users/space-integration-users.entity';
import { IntegrationData } from './space-integrations.interface';

@Index('fkIdx_615', ['integrationTypeId'], {})
@Index('fkIdx_618', ['spaceId'], {})
@Entity('space_integrations', { schema: 'momentum3a' })
export class SpaceIntegration {
  @Column('binary', { primary: true, name: 'spaceId', length: 16 })
  spaceId: Buffer;

  @Column('binary', { primary: true, name: 'integrationTypeId', length: 16 })
  integrationTypeId: Buffer;

  @Column('json', { name: 'data' })
  data: IntegrationData;

  @ManyToOne(() => IntegrationType, (integrationTypes) => integrationTypes.spaceIntegrations, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    primary: true,
  })
  @JoinColumn([{ name: 'integrationTypeId', referencedColumnName: 'id' }])
  integrationType: IntegrationType;

  @ManyToOne(() => Space, (spaces) => spaces.spaceIntegrations, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    primary: true,
  })
  @JoinColumn([{ name: 'spaceId', referencedColumnName: 'id' }])
  space: Space;

  @OneToMany(() => SpaceIntegrationUser, (spaceIntegrationUsers) => spaceIntegrationUsers.spaceIntegration)
  spaceIntegrationUsers: SpaceIntegrationUser[];
}
