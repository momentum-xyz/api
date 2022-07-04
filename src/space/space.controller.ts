import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { SpaceService } from './space.service';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { OwnedSpace, SpaceCreateDto, SpaceDto, SpaceEditDto, SpaceResponse } from './space.interface';
import { SpaceTypeService } from '../space-type/space-type.service';
import { UserService } from '../user/user.service';
import { bytesToUuid, uuidToBytes } from '../utils/uuid-converter';
import { UiTypeService } from '../ui-type/ui-type.service';
import { UserSpaceDto } from '../user-space/user-space.interface';
import { UserSpaceService } from '../user-space/user-space.service';
import { TileService } from '../tile/tile.service';
import { SpaceGuard } from './space.guard';
import { Space } from './space.entity';
import { UiType } from '../ui-type/ui-type.entity';
import { SpaceType } from '../space-type/space-type.entity';
import { UserSpace } from '../user-space/user-space.entity';
import { User } from '../user/user.entity';
import { ISpaceType } from '../space-type/space-type.interface';
import { SpaceIntegrationUsersService } from '../space-integration-users/space-integration-users.service';
import { BroadcastService } from '../space-integrations/broadcast/broadcast.service';
import { TokenInterface } from '../auth/auth.interface';
import { Unprotected } from '../auth/decorators/unprotected.decorator';
import { UiTypes } from '../ui-type/ui-type.interface';
import { paginateCollection, PaginatedCollection } from '../utils/pagination';
import { UserTypes } from '../user-type/user-type.interface';
import { SpaceAssignGuard } from './space-assign.guard';

@ApiTags('space')
@Controller('space')
export class SpaceController {
  constructor(
    private broadcastService: BroadcastService,
    private spaceService: SpaceService,
    private spaceTypeService: SpaceTypeService,
    private spaceIntegrationService: SpaceIntegrationUsersService,
    private tileService: TileService,
    private userService: UserService,
    private userSpaceService: UserSpaceService,
    private uiTypeService: UiTypeService,
  ) {}

  @ApiOperation({
    description: 'Returns all world uuids',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns all world uuids',
    type: Space,
  })
  @Unprotected()
  @Get('worlds')
  async findAllWorlds(@Res() response: Response): Promise<Response> {
    const spaceType: SpaceType = await this.spaceTypeService.findOne(ISpaceType.WORLD);

    const worlds: Space[] = await this.spaceService.findAllByType(spaceType);
    const worldIds: string[] = worlds.map((world) => bytesToUuid(world.id));

    return response.status(HttpStatus.OK).json({
      status: HttpStatus.OK,
      data: worldIds,
      message: 'Success',
    });
  }

  @ApiOperation({
    description: 'Returns all spaces a user is part of',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns all spaces a user is part of',
    type: Space,
  })
  @Get('my/spaces')
  async mySpaces(@Res() response: Response, @Req() request: TokenInterface): Promise<Response> {
    const user_id: string = request.user.sub;
    const spaces = await this.spaceService.findMy(user_id);

    return response.status(HttpStatus.OK).json({
      status: HttpStatus.OK,
      data: spaces,
      message: 'Success',
    });
  }

  @ApiOperation({
    description: 'Find spaces based on name, add ?q=.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns space-information based on query.',
    type: Space,
  })
  @ApiBearerAuth()
  @Get('search')
  async search(
    @Query('q') searchQuery: string,
    @Query('limit') limit: number,
    @Query('page') page: number,
    @Query('worldId') worldId: string,
  ): Promise<PaginatedCollection> {
    const spaces = await this.spaceService.filter(searchQuery);

    if (worldId) {
      const filteredSpaces: Space[] = [];
      for (const space of spaces) {
        const wId = await this.spaceService.getWorldId(space);

        if (wId.equals(uuidToBytes(worldId))) {
          filteredSpaces.push(space);
        }
      }

      return paginateCollection(filteredSpaces, page, limit);
    } else {
      return paginateCollection(spaces, page, limit);
    }
  }

  @ApiOperation({
    description: 'Returns a space based on current logged in user based on id param',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a specific space based on current logged in user',
    type: Space,
  })
  @ApiBearerAuth()
  @Get('user/:spaceId')
  async findSpaceWithAdmin(
    @Res() response: SpaceResponse,
    @Param() params,
    @Req() request: TokenInterface,
  ): Promise<Response> {
    const space: Space = await this.spaceService.findOneForDashboard(uuidToBytes(params.spaceId));

    if (!space) {
      return response.status(HttpStatus.NOT_FOUND).json({
        admin: false,
        status: HttpStatus.NOT_FOUND,
        message: 'Could not find space',
      });
    }

    space.userSpaces = space.userSpaces.filter((userSpace) => userSpace.user.userType.name !== UserTypes.TOKEN_GROUPS);

    const user: User = await this.userService.findOne(uuidToBytes(request.user.sub));

    const childrenTree = await this.spaceService.findAllChildren(space);
    const parentsFlatTree: Space = await this.spaceService.findAllParents(space, user);

    const children = childrenTree.length ? childrenTree[0].children : [];

    const isAdmin: boolean = await this.userSpaceService.isAdmin(space, user);
    const isMember: boolean = await this.userSpaceService.isMember(space, user);

    const spaceType: string = space.spaceType.name;

    return response.status(HttpStatus.OK).json({
      space: space,
      ancestors: parentsFlatTree,
      children: children,
      admin: isAdmin,
      member: isMember,
      spaceType: spaceType,
      ownerName: space.ownedBy.name,
      status: HttpStatus.OK,
      message: 'Success',
    });
  }

  @ApiOperation({
    description: 'Returns spaces that current user owns',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns spaces that current user owns',
    type: Space,
  })
  @ApiQuery({ name: 'world', required: false, type: String })
  @ApiBearerAuth()
  @Get('owned-spaces')
  async findOwnedSpaces(
    @Res() response: SpaceResponse,
    @Param() params,
    @Req() request: TokenInterface,
    @Query('world') worldId: string,
  ): Promise<Response> {
    const foundUser: User = await this.userService.findOne(uuidToBytes(request.user.sub));

    if (!foundUser) {
      return response.status(HttpStatus.NOT_FOUND).json({
        status: HttpStatus.NOT_FOUND,
        message: 'Could not find corresponding user',
      });
    }
    let world: Space;
    if (worldId) {
      world = await this.spaceService.findOne(uuidToBytes(worldId));
      if (!world) {
        return response.status(HttpStatus.NOT_FOUND).json({
          status: HttpStatus.NOT_FOUND,
          message: 'Could not find corresponding world',
        });
      }
    }

    const ownedSpaces: OwnedSpace[] = [];

    // Create permission is (now) configured per world, so check without world doesn't make sense
    // But leaving world optional, to be able to retrieve _all_ spaces of a user
    const canCreate = world ? await this.spaceService.checkInitiativeSpaceThreshold(foundUser, world) : false;

    // TODO: add world filter to this query, to avoid N more parent world queries
    const spaces: Space[] = await this.spaceService.ownedSpaces(foundUser);

    const morgueSpaceType: SpaceType = await this.spaceTypeService.findOne(ISpaceType.MORGUE);
    const hel: Space[] = await this.spaceService.findAllByType(morgueSpaceType);

    if (spaces.length > 0) {
      for (const space of spaces) {
        const archived = Buffer.compare(space.parent.id, hel[0].id) === 0;

        if (world) {
          // apply world filtering
          const spaceWorld = await this.spaceService.getWorldId(space);
          if (world.id.equals(spaceWorld)) {
            ownedSpaces.push({ space: space, archived: archived });
          }
        } else {
          ownedSpaces.push({ space: space, archived: archived });
        }
      }
    }

    return response.status(HttpStatus.OK).json({
      ownedSpaces: ownedSpaces,
      canCreate: canCreate,
      status: HttpStatus.OK,
      message: 'Success',
    });
  }

  @ApiOperation({
    description: 'Creates and spawns a space initiative',
  })
  @ApiResponse({
    status: 201,
    description: 'Returns 201 if space has spawned',
  })
  @Post('create-initiative')
  @ApiBearerAuth()
  async createSpaceInitiative(
    @Req() request: TokenInterface,
    @Body() body: SpaceDto,
    @Res() response: Response,
  ): Promise<Response> {
    const foundUser: User = await this.userService.findOne(uuidToBytes(request.user.sub));

    if (!foundUser) {
      return response.status(HttpStatus.NOT_FOUND).json({
        status: HttpStatus.NOT_FOUND,
        message: 'Could not find corresponding user',
      });
    }

    const world: Space = await this.spaceService.findOne(uuidToBytes(body.currentWorldId));
    const spacesTowardsThreshold = await this.spaceService.checkInitiativeSpaceThreshold(foundUser, world);

    if (!spacesTowardsThreshold) {
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Reached space threshold',
      });
    }

    const space: Space = new Space();
    space.name = body.name;

    const uiType: UiType = await this.uiTypeService.findOne(UiTypes.DASHBOARD);
    space.parent = await this.spaceService.findAnchor(world, uiType);

    space.nameHash = await this.spaceService.renderName(space.name);
    space.secret = false;
    space.ownedBy = foundUser;
    space.visible = null;

    const spaceType: SpaceType = await this.spaceTypeService.findOne(ISpaceType.CHALLENGE_INITIATIVE);
    space.uiType = uiType;

    if (!spaceType) {
      return response.status(HttpStatus.NOT_FOUND).json({
        status: HttpStatus.NOT_FOUND,
        message: 'Could not find space type',
      });
    }

    space.spaceType = spaceType;

    const savedSpace: Space = await this.spaceService.create(space);

    if (savedSpace) {
      const foundSpace: Space = await this.spaceService.findOne(savedSpace.id);

      const userSpace: UserSpace = new UserSpace();
      userSpace.space = foundSpace;
      userSpace.isAdmin = true;
      userSpace.user = foundUser;

      await this.userSpaceService.create(userSpace);
      await this.tileService.createInitiativeTiles(spaceType, uiType, foundSpace, body.description);
      await this.spaceService.signalCreate(foundSpace);
      await this.userSpaceService.signalPermissionUpdate(space.id, true);

      return response.status(HttpStatus.CREATED).json({
        id: bytesToUuid(savedSpace.id),
        status: HttpStatus.CREATED,
        message: 'Successfully created and spawned a space initiative',
      });
    } else {
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Could not create or spawn space initiative',
      });
    }
  }

  @ApiOperation({
    description: 'Retrieves an initiative from the archive and places it in the current world',
  })
  @ApiResponse({
    status: 200,
    description: 'Retrieves an initiative from the archive and places it in the current world',
    type: Space,
  })
  @ApiBearerAuth()
  @Post('archive/restore')
  @UseGuards(SpaceGuard)
  async archiveRestore(
    @Req() request: TokenInterface,
    @Body() body: SpaceDto,
    @Res() response: Response,
  ): Promise<Response> {
    const foundUser: User = await this.userService.findOne(uuidToBytes(request.user.sub));

    if (!foundUser) {
      return response.status(HttpStatus.NOT_FOUND).json({
        status: HttpStatus.NOT_FOUND,
        message: 'Could not find corresponding user',
      });
    }

    const world: Space = await this.spaceService.findOne(uuidToBytes(body.currentWorldId));
    const spacesTowardsThreshold = await this.spaceService.checkInitiativeSpaceThreshold(foundUser, world);

    if (!spacesTowardsThreshold) {
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Reached space threshold',
      });
    }

    const space: Space = await this.spaceService.findOne(uuidToBytes(body.spaceId));

    if (space) {
      const oldParentId = space.parent.id;
      const uiType: UiType = await this.uiTypeService.findOne(UiTypes.DASHBOARD);
      space.parent = await this.spaceService.findAnchor(world, uiType);
      space.updatedAt = new Date();

      await this.spaceService.updateSpace(oldParentId, space);

      return response.status(HttpStatus.OK).json({
        status: HttpStatus.OK,
        message: 'Successfully reassigned initiative space',
      });
    } else {
      return response.status(HttpStatus.NOT_FOUND).json({
        status: HttpStatus.NOT_FOUND,
        message: 'Could not find corresponding space',
      });
    }
  }

  @ApiOperation({
    description: 'Creates and spawns a space',
  })
  @ApiResponse({
    status: 201,
    description: 'Returns 201 if space has spawned',
  })
  @Post('create')
  @ApiBearerAuth()
  @UseGuards(SpaceGuard)
  async createSpace(
    @Req() request: TokenInterface,
    @Body() body: SpaceCreateDto,
    @Res() response: Response,
  ): Promise<Response> {
    const foundUser: User = await this.userService.findOne(uuidToBytes(request.user.sub));

    if (!foundUser) {
      return response.status(HttpStatus.NOT_FOUND).json({
        status: HttpStatus.NOT_FOUND,
        message: 'Could not find corresponding user',
      });
    }

    const space: Space = new Space();
    space.name = body.name;

    const spaceType: SpaceType = await this.spaceTypeService.findOne(body.spaceType);

    if (!spaceType) {
      return response.status(HttpStatus.NOT_FOUND).json({
        status: HttpStatus.NOT_FOUND,
        message: 'Could not find space type',
      });
    }

    const isRoot = body.root ?? false;
    if (!isRoot) {
      let parent: Space;
      if (spaceType.name === ISpaceType.GRAB_A_TABLE) {
        const world: Space = await this.spaceService.findOne(uuidToBytes(body.worldId));
        if (!world) {
          return response.status(HttpStatus.BAD_REQUEST).json({
            status: HttpStatus.BAD_GATEWAY,
            message: `worldId is required for ${ISpaceType.GRAB_A_TABLE} type`,
          });
        }
        parent = await this.spaceService.findOne(world.worldDefinition.gatAnchorSpace);
      } else {
        parent = await this.spaceService.findOne(uuidToBytes(body.parentId));

        if (!parent) {
          return response.status(HttpStatus.NOT_FOUND).json({
            status: HttpStatus.NOT_FOUND,
            message: 'Could not find parent space',
          });
        }
      }
      space.parent = parent;
    }

    space.nameHash = await this.spaceService.renderName(space.name);
    space.secret = body.secret ?? false;
    space.ownedBy = foundUser;

    space.uiTypeId = spaceType.uiTypeId; // TODO: for now, need to fix & test with null and fallback
    space.visible = body.visible ?? null;
    space.spaceType = spaceType;

    const savedSpace: Space = await this.spaceService.create(space);

    if (savedSpace) {
      const foundSpace: Space = await this.spaceService.findOne(savedSpace.id);

      const userSpace: UserSpace = new UserSpace();
      userSpace.space = foundSpace;
      userSpace.isAdmin = true;
      userSpace.user = foundUser;

      await this.userSpaceService.create(userSpace);
      await this.spaceService.createDefaultTiles(spaceType, foundSpace);
      await this.spaceService.signalCreate(foundSpace);
      await this.userSpaceService.signalPermissionUpdate(space.id, true);

      return response.status(HttpStatus.CREATED).json({
        id: bytesToUuid(savedSpace.id),
        status: HttpStatus.CREATED,
        message: 'Successfully created and spawned a space',
      });
    } else {
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Could not create or spawn space',
      });
    }
  }

  @ApiOperation({
    description: 'Edits a space',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns 200 if space has been edited',
  })
  @ApiBearerAuth()
  @Put('edit/:spaceId')
  @UseGuards(SpaceGuard)
  async editSpace(@Param() params, @Body() request: SpaceEditDto, @Res() response: Response): Promise<Response> {
    const foundParent: Space = await this.spaceService.findOne(uuidToBytes(request.parentId));

    if (!foundParent) {
      return response.status(HttpStatus.NOT_FOUND).json({
        status: HttpStatus.NOT_FOUND,
        message: 'Could not find a parent to link to',
      });
    } else {
      const space: Space = await this.spaceService.findOne(uuidToBytes(params.spaceId));

      if (!space) {
        return response.status(HttpStatus.NOT_FOUND).json({
          status: HttpStatus.NOT_FOUND,
          message: 'Could not find a space to edit',
        });
      }

      const oldParentId: Buffer = space.parent.id;
      space.name = request.name;
      space.nameHash = await this.spaceService.renderName(space.name);
      space.secret = request.secret;
      space.visible = request.visible ?? null;

      space.parent = foundParent;

      await this.spaceService.updateSpace(oldParentId, space);

      return response.status(HttpStatus.OK).json({
        status: HttpStatus.OK,
        message: 'Successfully edited space',
        spaceId: bytesToUuid(space.id),
      });
    }
  }

  @ApiOperation({
    description: 'Deletes a space based on id param',
  })
  @ApiResponse({
    status: 200,
    description: 'Deletes a specific space',
    type: Space,
  })
  @ApiBearerAuth()
  @Delete('/delete/:spaceId')
  @UseGuards(SpaceGuard)
  async deleteSpace(@Param() params, @Res() response: Response): Promise<Response> {
    const foundSpace: Space = await this.spaceService.findOne(uuidToBytes(params.spaceId));
    const procedureResponse = await this.spaceService.findDescendants(foundSpace);
    const unparsed = JSON.stringify(procedureResponse[0]);

    const items: Space[] = JSON.parse(unparsed);

    if (foundSpace) {
      await this.broadcastService.stopBroadcast(foundSpace);
      await this.broadcastService.stopChildBroadcasts(items);
      await this.spaceService.delete(foundSpace);

      return response.status(HttpStatus.OK).json({
        status: HttpStatus.OK,
        message: 'Successfully deleted space',
      });
    } else {
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Could not delete a space',
      });
    }
  }

  @ApiOperation({
    description:
      'Updates or adds a name to a specific space and sends it to the render-service, takes json {"name": "a name"}',
  })
  @ApiResponse({
    status: 201,
    description: 'Returns a response',
  })
  @ApiBearerAuth()
  @Post(':spaceId/add/name')
  @UseGuards(SpaceGuard)
  async addName(@Param() params, @Body() request, @Res() response: Response): Promise<Response> {
    const space: Space = await this.spaceService.findOne(uuidToBytes(params.spaceId));

    if (!request.name || !space) {
      return response.status(HttpStatus.NOT_FOUND).json({
        status: HttpStatus.NOT_FOUND,
        message: 'Please check your input',
      });
    }

    space.name = request.name;
    space.nameHash = await this.spaceService.renderName(space.name);
    await this.spaceService.updateSpace(space.id, space);
    await this.spaceService.updateMedia(space.id);

    return response.status(HttpStatus.CREATED).json({
      nameHash: space.nameHash,
      status: HttpStatus.CREATED,
      message: 'Successfully updated / added a name for this space',
    });
  }

  @ApiOperation({
    description: 'Assigns a user to a space or changes the role if it already exists',
  })
  @ApiResponse({
    status: 201,
    description: 'Returns a user-space entity',
    type: UserSpace,
  })
  @ApiBearerAuth()
  @Post('assign-user')
  @UseGuards(SpaceAssignGuard)
  async assignUser(@Body() request: UserSpaceDto): Promise<any> {
    const space: Space = await this.spaceService.findOne(uuidToBytes(request.spaceId));
    const user: User = await this.userService.findOne(uuidToBytes(request.userId));

    if (space && user) {
      await this.userSpaceService.assignUser(user, space, request.isAdmin);
      return { status: 200 };
    } else {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error: 'User or space do not exist',
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @ApiOperation({
    description: 'Unassigns a user from a space',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a user-space entity',
    type: UserSpace,
  })
  @ApiBearerAuth()
  @Post('unassign-user')
  @UseGuards(SpaceAssignGuard)
  async removeUser(@Body() request: UserSpaceDto, @Res() response: Response): Promise<Response> {
    const space: Space = await this.spaceService.findOne(uuidToBytes(request.spaceId));
    const user: User = await this.userService.findOne(uuidToBytes(request.userId));

    const foundUserSpace: UserSpace = await this.userSpaceService.findUserInSpace(space, user);

    if (foundUserSpace) {
      await this.userSpaceService.unAssignUser(foundUserSpace);

      return response.status(HttpStatus.OK).json({
        status: HttpStatus.OK,
        message: 'Successfully removed user from space',
      });
    } else {
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Could not remove a user from a space',
      });
    }
  }

  @ApiOperation({
    description: 'Returns all users associated to a space',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns all users associated to a space',
    type: Space,
  })
  @ApiBearerAuth()
  @Get(':spaceId/users')
  @UseGuards(SpaceGuard)
  async findSpaceUsers(@Res() response: Response, @Param() params): Promise<Response> {
    const space: Space = await this.spaceService.findOne(uuidToBytes(params.spaceId));

    if (!space) {
      return response.status(HttpStatus.NOT_FOUND).json({
        status: HttpStatus.NOT_FOUND,
        message: 'Could not find a space to refer to',
      });
    }

    const userSpaces: UserSpace[] = await this.userSpaceService.allUsersInSpace(space);

    return response.status(HttpStatus.OK).json({
      users: userSpaces,
      count: userSpaces.length,
      status: HttpStatus.OK,
      message: 'Success',
    });
  }

  @ApiOperation({
    description: 'Returns space.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a space',
    type: Space,
  })
  @ApiBearerAuth()
  @Get(':spaceId')
  async findSpace(@Res() response: Response, @Param() params): Promise<Response> {
    const space: Space = await this.spaceService.findOne(uuidToBytes(params.spaceId));

    if (!space) {
      return response.status(HttpStatus.NOT_FOUND).json({
        status: HttpStatus.NOT_FOUND,
        message: 'Could not find a space to refer to',
      });
    }

    return response.status(HttpStatus.OK).json({
      space: space,
      status: HttpStatus.OK,
      message: 'Success',
    });
  }
}
