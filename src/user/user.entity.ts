import { BeforeUpdate, Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from 'typeorm';
import { UserType } from '../user-type/user-type.entity';
import { Space } from '../space/space.entity';
import { UserMembership } from '../user-membership/user-membership.entity';
import { UserSpace } from '../user-space/user-space.entity';
import { UserSpaceAttribute } from '../user-space-attribute/user-space-attribute.entity';
import { UserLkp } from '../user-lkp/user-lkp.entity';
import { UserVanity } from '../user-vanity/user-vanity.entity';
import { HighFive } from '../high-five/high-five.entity';
import { Subscription } from '../subscription/subscription.entity';
import { Vibe } from '../vibe/vibe.entity';
import { OnlineUser } from '../online-user/online-user.entity';
import { SpaceIntegrationUser } from '../space-integration-users/space-integration-users.entity';
import { Profile } from './profile/profile.dto';
import { UserWallet } from '../user-wallet/user-wallet.entity';
import { Attendee } from '../events/attendees/attendee.entity';

export enum UserStatus {
  ONLINE = 'online',
  DO_NOT_DISTURB = 'dnd',
  AWAY = 'away',
  INVISIBLE = 'invisible',
}

@Index('fkIdx_471', ['userTypeId'], {})
@Index('ind_537', ['name'], {})
@Index('ind_698', ['email'], {})
@Index('ind_699', ['name', 'email'], {})
@Entity('users', { schema: 'momentum3a' })
export class User {
  @PrimaryColumn('binary', { primary: true, name: 'id', length: 16 })
  id: Buffer;

  @Column('binary', { name: 'userTypeId', length: 16 })
  userTypeId: Buffer;

  @Column('varchar', { name: 'name', length: 255 })
  name: string;

  @Column('varchar', { name: 'email', length: 255 })
  email: string;

  @Column({
    type: 'enum',
    name: 'status',
    enum: UserStatus,
    default: UserStatus.ONLINE,
  })
  status: UserStatus;

  @Column('json', { name: 'profile' })
  profile: Profile;

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

  @Column('text', { name: 'description', nullable: true })
  description: string | null;

  @OneToMany(() => Attendee, (attendee) => attendee.user)
  attendees: Attendee[];

  @ManyToOne(() => UserType, (userTypes) => userTypes.users, {
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn([{ name: 'userTypeId', referencedColumnName: 'id' }])
  userType: UserType;

  @OneToMany(() => Space, (spaces) => spaces.ownedBy)
  spaces: Space[];

  @OneToMany(() => UserMembership, (userMembership) => userMembership.memberOf)
  userMemberships: UserMembership[];

  @OneToMany(() => UserMembership, (userMembership) => userMembership.memberOf2)
  userMemberships2: UserMembership[];

  @OneToMany(() => UserSpace, (userSpaces) => userSpaces.user)
  userSpaces: UserSpace[];

  @OneToMany(() => UserSpaceAttribute, (userSpaceAttribute) => userSpaceAttribute.user)
  userSpaceAttributes: UserSpaceAttribute[];

  @OneToMany(() => UserLkp, (userLkp) => userLkp.user)
  userLkps: UserLkp[];

  @OneToMany(() => OnlineUser, (onlineUsers) => onlineUsers.user)
  onlineUsers: OnlineUser[];

  @OneToMany(() => UserVanity, (userVanity) => userVanity.user)
  userVanities: UserVanity[];

  @OneToMany(() => UserWallet, (userWallets) => userWallets.user)
  userWallets: UserWallet[];

  @OneToMany(() => SpaceIntegrationUser, (spaceIntegrationUsers) => spaceIntegrationUsers.user)
  spaceIntegrationUsers: SpaceIntegrationUser[];

  @OneToMany(() => HighFive, (highFives) => highFives.sender)
  highFives: HighFive[];

  @OneToMany(() => HighFive, (highFives) => highFives.receiver)
  highFives2: HighFive[];

  @OneToMany(() => Subscription, (subscriptions) => subscriptions.user)
  subscriptions: Subscription[];

  @OneToMany(() => Vibe, (vibes) => vibes.user)
  vibes: Vibe[];

  @BeforeUpdate()
  updateTimestamp() {
    this.updatedAt = new Date();
  }
}
