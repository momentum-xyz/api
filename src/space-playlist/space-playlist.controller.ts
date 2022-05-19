import { Body, Controller, Delete, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { uuidToBytes } from '../utils/uuid-converter';
import { SpaceService } from '../space/space.service';
import { SpacePlaylistService } from './space-playlist.service';
import { SpacePlaylistDto } from './space-playlist.interface';
import { SpacePlaylist } from './space-playlist.entity';
import { Space } from '../space/space.entity';
import { AudioTrack } from '../audio-track/audio-track.entity';
import { AudioTrackService } from '../audio-track/audio-track.service';

@ApiTags('space-playlist')
@Controller('space-playlist')
export class SpacePlaylistController {
  constructor(
    private spacePlaylistService: SpacePlaylistService,
    private spaceService: SpaceService,
    private audioTrackService: AudioTrackService,
  ) {}

  @ApiOperation({
    description: 'Fetches a sorted array of space-playlist instances',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a sorted space-playlist array',
  })
  @Get(':spaceId')
  async all(@Param() params: any): Promise<SpacePlaylist[]> {
    try {
      const space: Space = await this.spaceService.findOne(uuidToBytes(params.spaceId));

      if (!space) {
        throw new NotFoundException(`Could not find space ${params.spaceId}.`);
      }

      return await this.spacePlaylistService.findBySpace(space);
    } catch (e) {
      console.debug(e);
    }
  }

  @ApiOperation({
    description: 'Adds a new track to a space playlist',
  })
  @ApiResponse({
    status: 201,
    description: 'Returns an space-playlist instance',
    type: SpacePlaylistDto,
  })
  @Post('add')
  async add(@Body() body: SpacePlaylistDto): Promise<SpacePlaylist[]> {
    const space: Space = await this.spaceService.findOne(uuidToBytes(body.spaceId));

    if (!space) {
      throw new NotFoundException(`Could not find space ${body.spaceId}.`);
    }

    const sortedPlaylist: SpacePlaylist[] = await this.spacePlaylistService.findBySpace(space);
    const track: AudioTrack = await this.audioTrackService.findOne(uuidToBytes(body.trackId));

    if (!track) {
      throw new NotFoundException(`Could not find track ${body.trackId}.`);
    }

    const playlistEntry: SpacePlaylist = new SpacePlaylist();
    playlistEntry.spaceId = space.id;
    playlistEntry.trackId = track.id;

    if (sortedPlaylist.length <= 0) {
      playlistEntry.order = 0;

      await this.spacePlaylistService.create(playlistEntry);
    } else {
      await this.spacePlaylistService.insertTrack(body.order, space, playlistEntry);
    }

    return this.spacePlaylistService.findBySpace(space);
  }

  @ApiOperation({
    description: 'Adds a new track to a space playlist',
  })
  @ApiResponse({
    status: 201,
    description: 'Returns an space-playlist instance',
    type: SpacePlaylistDto,
  })
  @Post('reorder')
  async reorder(@Body() body: SpacePlaylistDto): Promise<SpacePlaylist[]> {
    const space: Space = await this.spaceService.findOne(uuidToBytes(body.spaceId));

    if (!space) {
      throw new NotFoundException(`Could not find space ${body.spaceId}.`);
    }

    const track: AudioTrack = await this.audioTrackService.findOne(uuidToBytes(body.trackId));

    if (!track) {
      throw new NotFoundException(`Could not find track ${body.trackId}.`);
    }

    const playlistEntry: SpacePlaylist = await this.spacePlaylistService.findOne(space, track, body.order);

    if (!playlistEntry) {
      throw new NotFoundException(`Playlist entry not found.`);
    }

    await this.spacePlaylistService.removeTrack(playlistEntry, space);
    await this.spacePlaylistService.insertTrack(body.newOrder, space, playlistEntry);

    return this.spacePlaylistService.findBySpace(space);
  }

  @ApiOperation({
    description: 'Deletes a track from the playlist',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns an updated playlist if track was deleted successfully.',
  })
  @Delete()
  async deleteTrack(@Body() body: SpacePlaylistDto): Promise<SpacePlaylist[]> {
    const space: Space = await this.spaceService.findOne(uuidToBytes(body.spaceId));

    if (!space) {
      throw new NotFoundException(`Could not find space ${body.spaceId}.`);
    }

    const track: AudioTrack = await this.audioTrackService.findOne(uuidToBytes(body.trackId));

    if (!track) {
      throw new NotFoundException(`Could not find track ${body.trackId}.`);
    }

    const playlistEntry: SpacePlaylist = await this.spacePlaylistService.findOne(space, track, body.order);

    if (!playlistEntry) {
      throw new NotFoundException(`Playlist entry not found.`);
    }

    await this.spacePlaylistService.removeTrack(playlistEntry, space);
    return this.spacePlaylistService.findBySpace(space);
  }
}
