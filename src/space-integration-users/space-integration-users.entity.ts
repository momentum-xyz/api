import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { User } from '../user/user.entity';
import { SpaceIntegration } from '../space-integrations/space-integrations.entity';
import { StageModeUserRole } from '../space-integrations/space-integrations.interface';

@Index('FK_SIU_SPACE_INTEGRATIONS', ['spaceId', 'integrationTypeId'], {})
@Index('FK_SIU_USERS', ['userId'], {})
@Entity('space_integration_users', { schema: 'momentum3a' })
export class SpaceIntegrationUser {
  @Column('binary', { primary: true, name: 'spaceId', length: 16 })
  spaceId: Buffer;

  @Column('binary', { primary: true, name: 'integrationTypeId', length: 16 })
  integrationTypeId: Buffer;

  @Column('binary', { primary: true, name: 'userId', length: 16 })
  userId: Buffer;

  @Column('tinyint', { name: 'flag', default: () => 0 })
  flag: number;

  @Column('json', { name: 'data' })
  data: SpaceIntegrationUserData;

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

  @ManyToOne(() => User, (users) => users.spaceIntegrationUsers, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    primary: true,
  })
  @JoinColumn([{ name: 'userId', referencedColumnName: 'id' }])
  user: User;
}

export interface SpaceIntegrationUserData {
  role?: StageModeUserRole;
}
