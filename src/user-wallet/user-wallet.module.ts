import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserWalletService } from './user-wallet.service';
import { UserWallet } from './user-wallet.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserWallet])],
  exports: [UserWalletService],
  providers: [UserWalletService],
})
export class UserWalletModule {}
