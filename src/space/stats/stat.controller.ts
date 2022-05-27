import { Controller, Get, HttpStatus, Param, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { StatService } from './stat.service';
import { Stat } from './stat.entity';
import { bytesToUuid, uuidToBytes } from '../../utils/uuid-converter';
import { Space } from '../space.entity';
import { SpaceService } from '../space.service';

@ApiTags('stats')
@Controller('stats')
export class StatController {
  constructor(private statService: StatService, private spaceService: SpaceService) {}

  @ApiOperation({
    description: 'Returns common world stats',
  })
  @ApiBearerAuth()
  @Get(':worldId')
  async getStats(@Param('worldId') worldId, @Res() response: Response, @Param() params): Promise<Response> {
    let stats: any[];
    const column1: any[] = await this.statService.generateColumnOne(uuidToBytes(worldId));

    const column2: Stat[] = await this.statService.findColumn(1);
    const mappedColumn2 = column2.map((col2) => {
      const worldId = bytesToUuid(col2.worldId);
      if (col2.name === 'Return') {
        // Need convert to percents
        // "0.013"
        const result = (+col2.value * 100).toString() + '%';

        return { ...col2, worldId, value: result };
      } else if (col2.name === 'Epoch (1 Hour)') {
        const result = epochToString(Number(col2.value));
        const progress = Math.round(100 - Number(col2.value) / 36000);

        return { ...col2, worldId, value: result, progress: progress };
      } else if (col2.name === 'Era (6 Hours)') {
        const progress = Math.round(100 - Number(col2.value) / 216000);
        const result = eraToString(Number(col2.value));

        return { ...col2, worldId, value: result, progress: progress };
      } else if (col2.name === 'Last Reward') {
        // Need to convert pico KSM to KSM with 4 digits after comma
        // 733414127865111 ->
        // 733.4141 KSM

        const microKSM = picoKSM_to_microKSM(col2.value);

        const result = (microKSM / 1_000_000).toFixed(4) + ' KSM';
        return { ...col2, worldId, value: result };
      } else if (col2.name === 'Total Stake in Era') {
        const microKSM = picoKSM_to_microKSM(col2.value);

        const result = (microKSM / 1_000_000).toFixed(0) + ' KSM';

        return { ...col2, worldId, value: result };
      } else {
        return { ...col2, worldId };
      }
    });

    const final1 = mappedColumn2
      .map((mC) => {
        if (/[A-Z]/.test(mC.name.charAt(0))) {
          return mC;
        }
      })
      .filter((f) => f);

    const final2 = final1.filter((f1) => f1.name !== 'Era Progress' && f1.name !== 'Epoch Progress');
    sortColumnTwo(final2);

    const world: Space = await this.spaceService.findOne(uuidToBytes(worldId));

    switch (world.worldDefinition.config['kind']) {
      case 'Kusama':
        stats = [
          {
            title: 'World Stats',
            items: column1,
          },
          {
            title: 'Kusama Network Stats',
            items: final2,
          },
        ];
        break;
      case 'basic':
        stats = [
          {
            title: 'World Stats',
            items: column1,
          },
        ];
        break;
      default:
        stats = [
          {
            title: 'World Stats',
            items: column1,
          },
        ];
        break;
    }

    return response.status(HttpStatus.OK).json(stats);
  }
}

type Item = {
  worldId: string; // "a91c9235-b545-43cf-8a3a-26b0fd70fe73",
  columnId: number; // 1,
  name: string; //"BEST BLOCK",
  value: string; //"12808374"
};

function picoKSM_to_microKSM(picoKSM: string): number {
  let microKSM = 0;
  if (picoKSM.length > 10) {
    microKSM = parseInt(picoKSM.slice(0, -6));
  } else {
    microKSM = Math.floor(parseInt(picoKSM) / 1_000_000);
  }

  return microKSM;
}

function sortColumnTwo(items: Item[]) {
  // Need to put 'Era (6 Hours)' last
  // And 'Epoch (1 Hour)' before last

  const eraItemIndex = items.findIndex((item) => item.name === 'Era (6 Hours)');
  const eraItem = items[eraItemIndex];
  items.splice(eraItemIndex, 1);

  const epochItemIndex = items.findIndex((item) => item.name === 'Epoch (1 Hour)');
  const epochItem = items[epochItemIndex];
  items.splice(epochItemIndex, 1);

  items.push(epochItem, eraItem);
}

function eraToString(msec) {
  const imin = Math.floor(msec / 1000 / 60);
  const hour = Math.floor(imin / 60);
  const min = imin - hour * 60;
  return hour.toString() + ' HOUR\r\n' + min.toString() + ' MINS';
}

function epochToString(msec) {
  const isec = Math.floor(msec / 1000);
  const min = Math.floor(isec / 60);
  const sec = isec - min * 60;
  return min.toString() + ' MINS\r\n' + sec.toString() + ' SECONDS';
}
