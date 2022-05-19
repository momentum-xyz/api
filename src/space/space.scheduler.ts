import * as moment from 'moment';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Space } from './space.entity';
import { SpaceService } from './space.service';
import { SpaceTypeService } from '../space-type/space-type.service';
import { SpaceType } from '../space-type/space-type.entity';
import { ISpaceType } from '../space-type/space-type.interface';
import { TileService } from '../tile/tile.service';

@Injectable()
export class SpaceScheduler {
  private EXPIRY_DATE = 7;

  constructor(
    private spaceService: SpaceService,
    private spaceTypeService: SpaceTypeService,
    private tileService: TileService,
  ) {}

  @Cron(CronExpression.EVERY_4_HOURS)
  async handleCron() {
    const archivedInitiatives: Space[] = [];

    const morgueSpaceType: SpaceType = await this.spaceTypeService.findOne(ISpaceType.MORGUE);

    if (!morgueSpaceType) {
      throw Error('Could not find a morgue space-type');
    }

    const morgue: Space[] = await this.spaceService.findAllByType(morgueSpaceType);

    if (!morgue) {
      throw Error('Could not find a morgue');
    }

    const spaceType: SpaceType = await this.spaceTypeService.findOne(ISpaceType.CHALLENGE_INITIATIVE);

    if (!spaceType) {
      throw Error('Could not find challenge initiative space-type');
    }

    const initiatives: Space[] = await this.spaceService.findAllByType(spaceType);

    for (const initiative of initiatives) {
      const tiles = await this.tileService.findPermanentTiles(initiative.id);
      if (tiles.length > 0 && this.checkDate(initiative.updatedAt) && !initiative.parent.id.equals(morgue[0].id)) {
        archivedInitiatives.push(initiative);
      }
    }

    if (archivedInitiatives.length > 0) {
      await this.spaceService.archiveInitiatives(archivedInitiatives, morgue);
    }
  }

  private checkDate(updatedAt: Date): boolean {
    const currentDate = moment();
    return currentDate.diff(updatedAt, 'days') >= this.EXPIRY_DATE;
  }
}
