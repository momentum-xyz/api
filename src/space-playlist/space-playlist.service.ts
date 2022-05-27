import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MqttService } from '../services/mqtt.service';
import { SpacePlaylist } from './space-playlist.entity';
import { Space } from '../space/space.entity';
import { AudioTrack } from '../audio-track/audio-track.entity';

@Injectable()
export class SpacePlaylistService {
  constructor(
    @InjectRepository(SpacePlaylist)
    private readonly spacePlaylistRepository: Repository<SpacePlaylist>,
    private client: MqttService,
  ) {}

  async findBySpace(space: Space): Promise<SpacePlaylist[]> {
    const spacePlaylist = await this.spacePlaylistRepository.find({
      where: {
        space: space,
      },
      relations: ['track'],
    });
    return spacePlaylist.sort((a, b) => a.order - b.order);
  }

  async findByTrack(track: AudioTrack) {
    const spacePlaylist = await this.spacePlaylistRepository.find({
      where: {
        track: track,
      },
      relations: ['space'],
    });
    return spacePlaylist.sort((a, b) => b.order - a.order);
  }

  async findOne(space: Space, track: AudioTrack, order: number): Promise<SpacePlaylist> {
    return this.spacePlaylistRepository.findOne({
      where: {
        space: space,
        track: track,
        order: order,
      },
    });
  }

  async insertTrack(newOrder: number, space: Space, entry: SpacePlaylist) {
    const sortedPlaylist: SpacePlaylist[] = await this.findBySpace(space);
    let order: number;
    if (newOrder >= 0 && newOrder <= sortedPlaylist.length) {
      order = newOrder;
    } else {
      order = sortedPlaylist.length;
    }

    entry.order = order;
    sortedPlaylist.splice(order, 0, entry);

    for (let i = sortedPlaylist.length - 1; i >= 1; i--) {
      if (i >= order + 1) {
        const oldOrder = sortedPlaylist[i].order;
        sortedPlaylist[i].order += 1;
        await this.update(sortedPlaylist[i], oldOrder);
      }
    }
    await this.create(entry);
  }

  async removeTrack(entry: SpacePlaylist, space: Space) {
    const sortedPlaylist: SpacePlaylist[] = await this.findBySpace(space);
    await this.delete(entry);

    for (let i = 0; i < sortedPlaylist.length; ++i) {
      if (i >= entry.order) {
        const oldOrder = sortedPlaylist[i].order;
        sortedPlaylist[i].order -= 1;
        await this.update(sortedPlaylist[i], oldOrder);
      }
    }
  }

  async create(spacePlaylist: SpacePlaylist) {
    return this.spacePlaylistRepository.query('INSERT INTO space_playlists VALUES (?, ?, ?)', [
      spacePlaylist.spaceId,
      spacePlaylist.trackId,
      spacePlaylist.order,
    ]);
  }

  async update(spacePlaylist: SpacePlaylist, oldOrder: number) {
    return this.spacePlaylistRepository.query(
      'UPDATE space_playlists SET `order` = ? WHERE spaceId = ? AND trackId = ? AND `order` = ?',
      [spacePlaylist.order, spacePlaylist.spaceId, spacePlaylist.trackId, oldOrder],
    );
  }

  private async delete(spacePlaylist: SpacePlaylist) {
    return this.spacePlaylistRepository.delete(spacePlaylist);
  }
}
