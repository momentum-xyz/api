import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorldDefinitionService } from './world-definition.service';
import { WorldDefinition } from './world-definition.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WorldDefinition])],
  exports: [WorldDefinitionService],
  providers: [WorldDefinitionService],
})
export class WorldDefinitionModule {}
