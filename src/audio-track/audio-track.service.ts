import { HttpService, Injectable } from '@nestjs/common';
import { MqttService } from '../services/mqtt.service';
import { AudioTrack } from './audio-track.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';

@Injectable()
export class AudioTrackService {
  constructor(
    @InjectRepository(AudioTrack) private readonly audioTrackRepository: Repository<AudioTrack>,
    private mqttService: MqttService,
    private httpService: HttpService,
  ) {}

  async create(audioTrack: AudioTrack): Promise<AudioTrack> {
    return this.audioTrackRepository.save(audioTrack);
  }

  async findOne(id: Buffer): Promise<AudioTrack> {
    return this.audioTrackRepository.findOne({ where: { id: id } });
  }

  async findAll(): Promise<AudioTrack[]> {
    return this.audioTrackRepository.find();
  }

  async uploadToRenderman(track: Express.Multer.File): Promise<any> {
    return this.httpService.axiosRef({
      method: 'POST',
      url: `${process.env.RENDER_INTERNAL_URL}/addtrack`,
      maxBodyLength: 100000000000,
      maxContentLength: 100000000000,
      data: track.buffer,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  }

  async deleteFromRenderman(file_hash: string): Promise<any> {
    return this.httpService.axiosRef({
      method: 'DELETE',
      url: `${process.env.RENDER_INTERNAL_URL}/deltrack/${file_hash}`,
      maxBodyLength: 100000000000,
      maxContentLength: 100000000000,
      headers: { 'Content-Type': `application/json` },
    });
  }

  async delete(audioTrack: AudioTrack): Promise<DeleteResult> {
    try {
      await this.deleteFromRenderman(audioTrack.file_hash);
    } catch (e) {
      console.error(e);
    }

    return this.audioTrackRepository.delete(audioTrack);
  }
}
