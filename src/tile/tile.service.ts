import { HttpService, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, IsNull, Not, Repository } from 'typeorm';
import { PermanentType, Tile } from './tile.entity';
import { Space } from '../space/space.entity';
import { UiType } from '../ui-type/ui-type.entity';
import { bytesToUuid, uuidToBytes } from '../utils/uuid-converter';
import { MqttService } from '../services/mqtt.service';
import { TileDto } from './tile.dto';
import { SpaceType } from '../space-type/space-type.entity';
import { tileFactory } from './tile.factory';

@Injectable()
export class TileService {
  constructor(
    @InjectRepository(Tile)
    private readonly tileRepository: Repository<Tile>,
    private httpService: HttpService,
    private client: MqttService,
  ) {}

  async create(space: Space, tiles: Tile[]): Promise<void> {
    for (const tile of tiles) {
      await this.tileRepository.save(tile);
    }
  }

  async createForDashboard(tile: Tile): Promise<Tile> {
    const savedTile = await this.tileRepository.save(tile);
    if (tile.render === 1) {
      await this.client.signalObjectUpdate(bytesToUuid(savedTile.spaceId));
    }
    return savedTile;
  }

  async createInitiativeTiles(spaceType: SpaceType, uiType: UiType, space: Space, description: string) {
    const defaultTiles: Tile[] = tileFactory(spaceType.default_tiles, spaceType.uiTypeId, space.id);

    if (description) {
      const descriptionTile: any = defaultTiles.filter((tile) => tile.permanentType === PermanentType.DESCRIPTION)[0];

      descriptionTile.content.text = description;
      descriptionTile.hash = await this.renderText(description, PermanentType.DESCRIPTION, spaceType);
      descriptionTile.edited = 1;

      await this.updateQuery(descriptionTile);
    }

    await this.create(space, defaultTiles);
  }

  async update(tile: Tile, tiledt: any, spaceType: SpaceType): Promise<void> {
    tile.content = tiledt.content;

    if (tile.render == 1) {
      switch (tile.type.toUpperCase()) {
        case 'TILE_TYPE_TEXT':
          tile.hash = await this.renderText(tiledt.content.text, tile.permanentType, spaceType);
          break;
        case 'TILE_TYPE_VIDEO':
          tile.hash = await this.renderTube(tiledt.content.url);
          break;
        default:
          tile.hash = tiledt.hash;
      }
    }

    tile.edited = 1;

    await this.updateQuery(tile);
  }

  async updateQuery(tile: Tile) {
    await this.tileRepository.query(
      'UPDATE tiles SET `content` = ?, `hash` = ?, `edited` = ? WHERE id = ? AND spaceId = ?',
      [JSON.stringify(tile.content), tile.hash, tile.edited, tile.id, tile.spaceId],
    );

    if (tile.render === 1) {
      await this.client.signalObjectUpdate(bytesToUuid(tile.spaceId));
    }
  }

  async updatePositions(tiles: TileDto[]): Promise<void> {
    for (const tile of tiles) {
      if (tile.spaceId) {
        // @ts-ignore
        const spaceId = uuidToBytes(bytesToUuid(tile.spaceId.data));
        await this.tileRepository.query('UPDATE tiles SET `row` = ?, `column` = ? WHERE id = ? AND spaceId = ?', [
          tile.row,
          tile.column,
          uuidToBytes(tile.id),
          spaceId,
        ]);
      } else {
        return;
      }
    }
  }

  async delete(tile: Tile): Promise<DeleteResult> {
    return this.tileRepository.query('DELETE FROM tiles WHERE id = ?', [tile.id]);
  }

  async upload(file: Express.Multer.File): Promise<any> {
    return this.httpService.axiosRef({
      method: 'post',
      url: `${process.env.RENDER_INTERNAL_URL}/render/addimage`,
      maxBodyLength: 100000000,
      maxContentLength: 100000000,
      data: file.buffer,
      headers: { 'Content-Type': `image/png` },
    });
  }

  async findTiles(spaceId: Buffer): Promise<Tile[]> {
    return this.tileRepository.find({
      where: {
        spaceId: spaceId,
      },
    });
  }

  async findPermanentTiles(spaceId: Buffer): Promise<Tile[]> {
    return this.tileRepository.find({
      where: {
        spaceId: spaceId,
        permanentType: Not(IsNull()),
        edited: 0,
      },
    });
  }

  async findOne(tileId: Buffer): Promise<Tile> {
    return this.tileRepository.findOne({
      where: {
        id: tileId,
      },
    });
  }

  async renderTube(text: string): Promise<string> {
    const jsonObject = {};
    try {
      const frameResponse = await this.httpService.axiosRef({
        method: 'post',
        url: `${process.env.RENDER_INTERNAL_URL}/render/addtube`,
        data: text,
        headers: { 'Content-Type': `application/json` },
      });
      return frameResponse.data.hash;
    } catch (e) {
      console.error(e);
    }
  }

  async renderText(text: string, type: PermanentType, spaceType: SpaceType): Promise<string> {
    const template: string = JSON.stringify(spaceType.frame_templates[type.toLowerCase()]);
    const etext = JSON.stringify({ key: text });
    const newTemplate = template.replace('%TEXT%', etext.substring(8, etext.length - 2));
    try {
      const frameResponse = await this.httpService.axiosRef({
        method: 'post',
        url: `${process.env.RENDER_INTERNAL_URL}/render/addframe`,
        data: newTemplate,
        headers: { 'Content-Type': `application/json` },
      });

      return frameResponse.data.hash;
    } catch (e) {
      console.error(e);
    }
  }

  async getNewRow(tiles: Tile[]): Promise<number> {
    const firstCol = tiles.filter((tile) => tile.column === 0);
    return firstCol.length;
  }
}
