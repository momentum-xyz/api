import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AudioTrackDto } from './audio-track.dto';
import { AudioTrackService } from './audio-track.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { TokenInterface } from '../auth/auth.interface';
import { Response } from 'express';
import { uuidToBytes } from '../utils/uuid-converter';
import { AudioTrack } from './audio-track.entity';
import { SpacePlaylistService } from '../space-playlist/space-playlist.service';
import { SpacePlaylist } from '../space-playlist/space-playlist.entity';

@ApiTags('audio-track')
@Controller('audio-track')
export class AudioTrackController {
  constructor(private audioTrackService: AudioTrackService, private spacePlaylistService: SpacePlaylistService) {}

  @ApiOperation({
    description: 'Returns all audio tracks',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns all audio tracks',
    type: AudioTrack,
  })
  @Get('all')
  async findAllTracks(): Promise<AudioTrack[]> {
    return await this.audioTrackService.findAll();
  }

  @ApiOperation({
    description:
      'Uploads a new audio-track to the render-man and stores the returned hash in the database, accepts track as form-data key and music file as value',
  })
  @ApiResponse({
    status: 201,
    description: 'Returns an audio-track instance',
    type: AudioTrackDto,
  })
  @Post('upload')
  @UseInterceptors(FileInterceptor('track'))
  async uploadAudioFile(
    @Req() request: TokenInterface,
    @Body() body: AudioTrackDto,
    @Param() params,
    @UploadedFile() track: Express.Multer.File,
    @Res() response: Response,
  ): Promise<Response> {
    const hashResponse = await this.audioTrackService.uploadToRenderman(track);

    if (hashResponse) {
      const audioTrack: AudioTrack = new AudioTrack();
      audioTrack.name = body.name;
      audioTrack.file_hash = hashResponse.data.hash;
      const savedAudioTrack = await this.audioTrackService.create(audioTrack);
      if (savedAudioTrack) {
        return response.status(HttpStatus.CREATED).json({
          status: HttpStatus.CREATED,
          message: 'Successfully uploaded a new audio track',
          hash: hashResponse.data.hash,
        });
      }
    } else {
      return response.status(HttpStatus.BAD_GATEWAY).json({
        status: HttpStatus.BAD_GATEWAY,
        message: 'Could not get a hash from renderman',
      });
    }
  }

  @ApiOperation({
    description: 'Delete an audio track.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a 200 if audio track was deleted successfully.',
  })
  @ApiBearerAuth()
  @Delete(':audioTrackId')
  async deleteAudioTrack(
    @Param() params,
    @Req() request: TokenInterface,
    @Res() response: Response,
  ): Promise<Response> {
    const audioTrack = await this.audioTrackService.findOne(uuidToBytes(params.audioTrackId));
    if (!audioTrack) {
      return response.status(HttpStatus.NOT_FOUND).json({
        status: HttpStatus.NOT_FOUND,
        message: 'Could not find audio-track',
      });
    }

    const playlistEntries: SpacePlaylist[] = await this.spacePlaylistService.findByTrack(audioTrack);

    for (const entry of playlistEntries) {
      await this.spacePlaylistService.removeTrack(entry, entry.space);
    }

    await this.audioTrackService.delete(audioTrack);

    return response.status(HttpStatus.OK).json({
      status: HttpStatus.OK,
      message: 'Audio-track deleted successfully',
    });
  }
}
