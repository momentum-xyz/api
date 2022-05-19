import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserTypeService } from './user-type.service';
import { UserTypeController } from './user-type.controller';
import { UserType } from './user-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserType])],
  exports: [UserTypeService],
  providers: [UserTypeService],
  controllers: [UserTypeController],
})
export class UserTypeModule {}
