import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttributeService } from './attribute.service';
import { Attribute } from './attribute.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Attribute])],
  exports: [AttributeService],
  providers: [AttributeService],
})
export class AttributeModule {}
