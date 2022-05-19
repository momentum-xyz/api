import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { UserService } from '../user.service';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { bytesToUuid, uuidToBytes } from '../../utils/uuid-converter';
import { User } from '../user.entity';
import { TokenInterface } from '../../auth/auth.interface';
import { UserSpaceAttributeService } from '../../user-space-attribute/user-space-attribute.service';
import { UserSpaceAttributeCreateDto } from '../../user-space-attribute/user-space-attribute.interface';
import { Space } from '../../space/space.entity';
import { SpaceService } from '../../space/space.service';
import { UserSpaceAttribute } from '../../user-space-attribute/user-space-attribute.entity';
import { Attribute } from '../../attribute/attribute.entity';
import { AttributeService } from '../../attribute/attribute.service';
import { AttributeType } from '../../attribute/attribute.interface';

@ApiTags('favorite')
@Controller('favorite')
export class FavoriteController {
  constructor(
    private attributeService: AttributeService,
    private spaceService: SpaceService,
    private userService: UserService,
    private userSpaceAttributeService: UserSpaceAttributeService,
  ) {}

  @ApiOperation({
    description: 'Returns favorites made by a user',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns all user favorites',
  })
  @Get()
  async findFavorites(@Req() request: TokenInterface, @Res() response: Response): Promise<Response> {
    const attribute: Attribute = await this.attributeService.findOne(AttributeType.FAVORITE);
    const user: User = await this.userService.findOne(uuidToBytes(request.user.sub));

    if (!user) {
      return response.status(HttpStatus.NOT_FOUND).json({
        message: 'Could not find corresponding user',
      });
    }

    const userSpaceAttributes: UserSpaceAttribute[] = await this.userSpaceAttributeService.findAllForUser(
      user,
      attribute,
    );

    const mappedFavorites = userSpaceAttributes.map(({ spaceId, space: { name } }) => {
      const parsedSpaceId = bytesToUuid(spaceId);
      return { spaceId: parsedSpaceId, name };
    });

    return response.status(HttpStatus.OK).json([...mappedFavorites]);
  }

  @ApiOperation({
    description: 'Adds a favorite space for a user',
  })
  @ApiResponse({
    status: 201,
    description: 'Returns 201 when a favorite has been added',
  })
  @Post()
  @ApiBearerAuth()
  async addFavorite(
    @Req() request: TokenInterface,
    @Body() body: UserSpaceAttributeCreateDto,
    @Res() response: Response,
  ): Promise<Response> {
    const attribute: Attribute = await this.attributeService.findOne(AttributeType.FAVORITE);
    const user: User = await this.userService.findOne(uuidToBytes(request.user.sub));
    const space: Space = await this.spaceService.findOne(uuidToBytes(body.spaceId));

    if (!user || !space) {
      return response.status(HttpStatus.NOT_FOUND).json({
        message: 'Could not find corresponding user or space',
      });
    }

    const existingUserSpaceAttribute: UserSpaceAttribute = await this.userSpaceAttributeService.findOne(
      user,
      space,
      attribute,
    );

    if (existingUserSpaceAttribute) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        message: 'Favorite already exists for this user',
      });
    }

    const userSpaceAttribute: UserSpaceAttribute = new UserSpaceAttribute();
    userSpaceAttribute.user = user;
    userSpaceAttribute.space = space;
    userSpaceAttribute.attribute = attribute;

    const savedUserSpaceAttribute: UserSpaceAttribute = await this.userSpaceAttributeService.create(userSpaceAttribute);
    if (!savedUserSpaceAttribute) {
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Could not save user-space-attribute',
      });
    }

    return response
      .status(HttpStatus.CREATED)
      .json({ spaceId: bytesToUuid(userSpaceAttribute.spaceId), name: userSpaceAttribute.space.name });
  }

  @ApiOperation({
    description: 'Deletes a favorite.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a 200 if favorite was deleted successfully.',
  })
  @ApiBearerAuth()
  @Delete(':spaceId')
  async deleteFavorite(@Param() params, @Req() request: TokenInterface, @Res() response: Response): Promise<Response> {
    const attribute: Attribute = await this.attributeService.findOne(AttributeType.FAVORITE);
    const user: User = await this.userService.findOne(uuidToBytes(request.user.sub));
    const space: Space = await this.spaceService.findOne(uuidToBytes(params.spaceId));

    if (!user || !space) {
      return response.status(HttpStatus.NOT_FOUND).json({
        message: 'Could not find corresponding user or space',
      });
    }

    const userSpaceAttribute: UserSpaceAttribute = await this.userSpaceAttributeService.findOne(user, space, attribute);

    if (!userSpaceAttribute) {
      return response.status(HttpStatus.NOT_FOUND).json({
        message: 'Could not find corresponding user-space-attribute',
      });
    }

    await this.userSpaceAttributeService.delete(userSpaceAttribute);

    return response.status(HttpStatus.OK).json({
      status: HttpStatus.OK,
      message: 'Favorite deleted successfully',
    });
  }
}
