import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VanityService } from './vanity.service';
import { VanityController } from './vanity.controller';
import { Vanity } from './vanity.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Vanity])],
  exports: [VanityService],
  providers: [VanityService],
  controllers: [VanityController],
})
export class VanityModule {}
