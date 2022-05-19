import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Network } from './network.entity';
import { NetworkService } from './network.service';

@Module({
  imports: [TypeOrmModule.forFeature([Network]), HttpModule],
  exports: [NetworkService],
  providers: [NetworkService],
})
export class NetworkModule {}
