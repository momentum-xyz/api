import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntegrationTypeService } from './integration-type.service';
import { IntegrationType } from './integration-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([IntegrationType])],
  exports: [IntegrationTypeService],
  providers: [IntegrationTypeService],
})
export class IntegrationTypeModule {}
