import { Body, Controller, Get, HttpStatus, Param, Post, Res, UseGuards } from '@nestjs/common';
import { SpaceTypeService } from './space-type.service';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { SpaceTypeDto } from './space-type.interface';
import { SpaceTypeGuard } from './space-type.guard';
import { SpaceGuard } from '../space/space.guard';
import { SpaceService } from '../space/space.service';
import { uuidToBytes } from '../utils/uuid-converter';
import { Space } from '../space/space.entity';
import { SpaceType } from './space-type.entity';

@ApiTags('space-type')
@Controller('space-type')
export class SpaceTypeController {
  constructor(private spaceTypeService: SpaceTypeService, private spaceService: SpaceService) {}

  @ApiOperation({
    description: 'Returns all objects and their associations',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns all objects and their associations',
    type: Space,
  })
  @ApiBearerAuth()
  @Get('all')
  @UseGuards(SpaceGuard)
  async findAll(): Promise<SpaceType[]> {
    return this.spaceTypeService.findAll();
  }

  @ApiOperation({
    description: 'Returns all allowed space-types for a space',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns all allowed space-types for a space',
    type: Space,
  })
  @ApiBearerAuth()
  @Get(':spaceId')
  @UseGuards(SpaceGuard)
  async findAllForSpace(@Param() params): Promise<string[]> {
    const space: Space = await this.spaceService.findOne(uuidToBytes(params.spaceId));
    const spaceTypeIds: Buffer[] = [];

    if (space.allowed_subspaces) {
      for (const subSpace of space.allowed_subspaces) {
        spaceTypeIds.push(uuidToBytes(subSpace));
      }
    } else {
      for (const subSpace of space.spaceType.allowed_subspaces) {
        spaceTypeIds.push(uuidToBytes(subSpace));
      }
    }
    const spaceTypes = await this.spaceTypeService.find(spaceTypeIds);

    return spaceTypes.map((st) => st.name);
  }

  @ApiOperation({
    description: 'Creates and spawns a space-type',
  })
  @ApiResponse({
    status: 201,
    description: 'Returns 201 if space-type has spawned',
  })
  @ApiBearerAuth()
  @Post('create')
  @UseGuards(SpaceTypeGuard)
  async createSpaceType(@Body() body: SpaceTypeDto, @Res() response: Response): Promise<Response> {
    const spaceType: SpaceType = new SpaceType();
    spaceType.name = body.name;

    if (true) {
      return response.status(HttpStatus.CREATED).json({
        status: HttpStatus.CREATED,
        message: 'Successfully created and spawned a space-type',
      });
    } else {
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Could not create or spawn space-type',
      });
    }
  }
}
