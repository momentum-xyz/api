import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { User } from '../user/user.entity';
import { Network } from '../network/network.entity';

@Index('fkIdx_495', ['userId'], {})
@Entity('user_wallets', { schema: 'momentum3a' })
export class UserWallet {
  @Column('binary', { primary: true, name: 'userId', length: 16 })
  userId: Buffer;

  @Column('binary', { primary: true, name: 'networkId', length: 16 })
  networkId: Buffer;

  @Column('varbinary', { name: 'wallet', length: 256 })
  wallet: Buffer;

  @ManyToOne(() => User, (users) => users.userWallets, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn([{ name: 'userId', referencedColumnName: 'id' }])
  user: User;

  @ManyToOne(() => Network, (networks) => networks.userWallets, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn([{ name: 'networkId', referencedColumnName: 'id' }])
  network: Network;
}
