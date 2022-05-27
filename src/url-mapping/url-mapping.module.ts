import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UrlMapping } from './url-mapping.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UrlMapping])],
  exports: [UrlMapping],
  providers: [UrlMapping],
})
export class UrlMappingModule {}
