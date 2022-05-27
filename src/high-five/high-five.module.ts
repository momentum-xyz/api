import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HighFiveService } from './high-five.service';
import { HighFive } from './high-five.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HighFive])],
  exports: [HighFiveService],
  providers: [HighFiveService],
})
export class HighFiveModule {}
