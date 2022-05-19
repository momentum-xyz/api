import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Space } from '../space/space.entity';
import { SpacePlaylist } from './space-playlist.entity';
import { SpacePlaylistService } from './space-playlist.service';
import { SpacePlaylistController } from './space-playlist.controller';
import { AudioTrack } from '../audio-track/audio-track.entity';
import { AudioTrackService } from '../audio-track/audio-track.service';

@Module({
  imports: [TypeOrmModule.forFeature([AudioTrack, Space, SpacePlaylist]), HttpModule],
  exports: [SpacePlaylistService],
  controllers: [SpacePlaylistController],
  providers: [AudioTrackService, SpacePlaylistService],
})
export class SpacePlaylistModule {}
