import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vibe } from './vibe.entity';
import { VibeService } from './vibe.service';
import { VibeController } from './vibe.controller';
import { UserService } from '../user/user.service';
import { User } from '../user/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Vibe]), HttpModule],
  controllers: [VibeController],
  exports: [VibeService],
  providers: [UserService, VibeService],
})
export class VibeModule {}
