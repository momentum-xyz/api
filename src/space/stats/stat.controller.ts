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
      if (col2.name === 'Return') {
        return { ...col2, worldId: bytesToUuid(col2.worldId), value: col2.value + '%' };
      } else if (col2.name === 'Epoch (1 Hour)') {
        const result = epochToString(Number(col2.value));
        const progress = Math.round(100 - Number(col2.value) / 36000);

        return { ...col2, worldId: bytesToUuid(col2.worldId), value: result, progress: progress };
      } else if (col2.name === 'Era (6 Hours)') {
        const progress = Math.round(100 - Number(col2.value) / 216000);
        const result = eraToString(Number(col2.value));

        return { ...col2, worldId: bytesToUuid(col2.worldId), value: result, progress: progress };
      } else {
        return { ...col2, worldId: bytesToUuid(col2.worldId) };
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
