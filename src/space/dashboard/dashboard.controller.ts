import { Body, Controller, Get, HttpStatus, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import { DashboardDto, TokenInterface } from './dashboard.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { TileService } from '../../tile/tile.service';
import { bytesToUuid, uuidToBytes } from '../../utils/uuid-converter';
import { SpaceService } from '../space.service';
import { UiTypeService } from '../../ui-type/ui-type.service';
import { v4 as uuidv4 } from 'uuid';
import { DashboardGuard } from './dashboard.guard';
import { Space } from '../space.entity';
import { UiType } from '../../ui-type/ui-type.entity';
import { Tile } from '../../tile/tile.entity';
import { UiTypes } from '../../ui-type/ui-type.interface';
import { DashboardAccessGuard } from './dashboard-access.guard';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(
    private uiTypeService: UiTypeService,
    private tileService: TileService,
    private spaceService: SpaceService,
  ) {}

  @ApiOperation({
    description: "Saves the Dashboard with the Tiles. If there's no Dashboard with the given uuid it will create one.",
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a Dashboard with the tiles.',
    type: DashboardDto,
  })
  @Post('update-positions')
  async updatePositions(@Body() dashboardDto: DashboardDto, @Req() request: TokenInterface): Promise<void> {
    return this.tileService.updatePositions(dashboardDto.tiles);
  }

  @ApiOperation({
    description: 'Creates a tile on a dashboard.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a Dashboard with the tiles.',
  })
  @Post('create/:spaceId')
  @UseGuards(DashboardGuard)
  async createTile(@Body() tile: Tile, @Req() request: TokenInterface, @Param() params): Promise<Tile> {
    const space: Space = await this.spaceService.findOne(uuidToBytes(params.spaceId));
    const uiType: UiType = await this.uiTypeService.findOne(UiTypes.DASHBOARD);
    const currentTiles: Tile[] = await this.tileService.findTiles(space.id);

    tile.id = Buffer.from(uuidv4().replace(/-/g, ''), 'hex');
    tile.spaceId = space.id;
    tile.row = await this.tileService.getNewRow(currentTiles);
    tile.uiTypeId = uiType.id;

    return this.tileService.createForDashboard(tile);
  }

  @ApiOperation({
    description: 'Updates a tile from a dashboard.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a Dashboard with the tiles.',
  })
  @Post('update/:tileId')
  @UseGuards(DashboardGuard)
  async updateTile(@Body() tiledt: any, @Req() request: TokenInterface, @Param() params): Promise<void> {
    const tile: Tile = await this.tileService.findOne(uuidToBytes(tiledt.id));
    const space: Space = await this.spaceService.findOne(tile.spaceId);
    await this.tileService.update(tile, tiledt, space.spaceType);
  }

  @ApiOperation({
    description: 'Deletes a tile from a dashboard.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns nothing.',
  })
  @Post('delete/:tileId')
  @UseGuards(DashboardGuard)
  async deleteTile(@Req() request: TokenInterface, @Param() params): Promise<void> {
    const tile: Tile = await this.tileService.findOne(uuidToBytes(params.tileId));

    await this.tileService.delete(tile);
  }

  @ApiOperation({
    description:
      'Returns a Dashboard with Tiles. If no dashboard is available with the given uuid it will return an empty one.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a Dashboard with the tiles.',
    type: DashboardDto,
  })
  @Get(':id')
  @UseGuards(DashboardAccessGuard)
  async findOne(@Res() response: Response, @Param() params): Promise<Response> {
    const space: Space = await this.spaceService.findOne(uuidToBytes(params.id));
    const tiles: Tile[] = await this.tileService.findTiles(space.id);

    const convertedTiles = tiles.map((tile) => {
      return {
        ...tile,
        id: bytesToUuid(tile.id),
        owner_id: bytesToUuid(tile.spaceId),
        type: tile.type.toUpperCase(),
      };
    });

    return response.status(HttpStatus.OK).json({
      owner_id: bytesToUuid(space.id),
      tiles: convertedTiles,
      status: HttpStatus.OK,
      message: 'Success',
    });
  }
}
