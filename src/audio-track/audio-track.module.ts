import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AudioTrackController } from './audio-track.controller';
import { AudioTrackService } from './audio-track.service';
import { AudioTrack } from './audio-track.entity';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { SpacePlaylistService } from '../space-playlist/space-playlist.service';
import { SpacePlaylist } from '../space-playlist/space-playlist.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AudioTrack, SpacePlaylist, User]), HttpModule],
  exports: [AudioTrackService],
  providers: [AudioTrackService, SpacePlaylistService, UserService],
  controllers: [AudioTrackController],
})
export class AudioTrackModule {}
