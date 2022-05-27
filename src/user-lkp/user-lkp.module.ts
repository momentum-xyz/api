import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserLkp } from './user-lkp.entity';
import { UserLkpService } from './user-lkp.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserLkp]), HttpModule],
  exports: [UserLkpService],
  providers: [UserLkpService],
})
export class UserLkpModule {}
