import { Controller, Get, HttpStatus, Param, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserService } from '../user/user.service';
import { SpaceService } from './space.service';
import { bytesToUuid, uuidToBytes } from '../utils/uuid-converter';
import { Space } from './space.entity';
import { UserSpaceService } from '../user-space/user-space.service';
import { Response } from 'express';
import { SpaceType } from '../space-type/space-type.entity';
import { ISpaceType } from '../space-type/space-type.interface';
import { SpaceTypeService } from '../space-type/space-type.service';
import { TokenInterface } from '../auth/auth.interface';
import { User } from '../user/user.entity';
import { UserSpace } from '../user-space/user-space.entity';

@ApiTags('tables')
@Controller('tables')
export class TableController {
  constructor(
    private userService: UserService,
    private spaceService: SpaceService,
    private userSpaceService: UserSpaceService,
    private spaceTypeService: SpaceTypeService,
  ) {}

  @ApiOperation({
    description: 'Returns a table associated with a user',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a space of type grab a table if a user has one already',
    type: Space,
  })
  @ApiBearerAuth()
  @Get('find/:userId')
  async findTable(@Param() params, @Res() response: Response): Promise<Response> {
    const spaceType: SpaceType = await this.spaceTypeService.findOne(ISpaceType.GRAB_A_TABLE);
    const user: User = await this.userService.findOne(uuidToBytes(params.userId));
    const tables: Space[] = await this.spaceService.findAllByTypeAndOwner(spaceType, user);

    if (tables.length === 0) {
      return response.status(HttpStatus.NOT_FOUND).json({
        status: HttpStatus.NOT_FOUND,
        message: 'User has no active tables',
      });
    }

    return response.status(HttpStatus.OK).json({
      tableId: bytesToUuid(tables[0].id),
      status: HttpStatus.OK,
      message: 'Success',
    });
  }
}
