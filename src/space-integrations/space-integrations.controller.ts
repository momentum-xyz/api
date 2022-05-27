import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Space } from '../space/space.entity';
import { TokenInterface } from '../auth/auth.interface';
import { User } from '../user/user.entity';
import { bytesToUuid, uuidToBytes } from '../utils/uuid-converter';
import { IntegrationType } from '../integration-type/integration-type.entity';
import { IntegrationTypeService } from '../integration-type/integration-type.service';
import { UserSpaceService } from '../user-space/user-space.service';
import { UserService } from '../user/user.service';
import { SpaceService } from '../space/space.service';
import { SpaceIntegration } from './space-integrations.entity';
import { SpaceIntegrationsGuard } from './space-integrations.guard';
import { IntegrationDto } from './space-integrations.interface';
import { SpaceIntegrationUsersService } from '../space-integration-users/space-integration-users.service';
import { SpaceIntegrationsService } from './space-integrations.service';
import { DashboardAccessGuard } from '../space/dashboard/dashboard-access.guard';
import { IntegrationTypes } from '../integration-type/integration-type.interface';
import { StageModeService } from './stage-mode/stage-mode.service';

@ApiTags('space-integrations')
@Controller('space-integrations')
export class SpaceIntegrationsController {
  constructor(
    private spaceService: SpaceService,
    private spaceIntegrationService: SpaceIntegrationsService,
    private spaceIntegrationUsersService: SpaceIntegrationUsersService,
    private stageModeService: StageModeService,
    private userService: UserService,
    private userSpaceService: UserSpaceService,
    private integrationTypeService: IntegrationTypeService,
  ) {}

  @ApiOperation({
    description: 'Checks if current user is allowed to initiate a space-integration',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a boolean.',
  })
  @Get(':spaceId/check')
  async check(@Param('spaceId') spaceId: string, @Req() request: TokenInterface): Promise<boolean> {
    try {
      const space: Space = await this.getSpace(spaceId);
      const user: User = await this.userService.findOne(uuidToBytes(request.user.sub));

      return await this.isModerator(user, space);
    } catch (e) {
      console.debug(e);
      return false;
    }
  }

  @ApiOperation({
    description: 'Creates a new space-integration instance with a type, sends MQTT to users',
  })
  @ApiResponse({
    status: 201,
    description: 'Returns a space-integration instance',
    type: SpaceIntegration,
  })
  @Post('enable')
  @UseGuards(SpaceIntegrationsGuard)
  async launchIntegration(
    @Body() integrationDto: IntegrationDto,
    @Req() request: TokenInterface,
  ): Promise<SpaceIntegration> {
    const spaceIntegrationExists = await this.checkExisting(integrationDto);

    if (spaceIntegrationExists) {
      const existingSpaceIntegration = await this.getSpaceIntegration(integrationDto);
      if (existingSpaceIntegration.integrationType.name === IntegrationTypes.STAGE_MODE) {
        const user: User = await this.userService.findOne(uuidToBytes(integrationDto.data.userId));
        return this.spaceIntegrationService.edit(existingSpaceIntegration, integrationDto, user);
      }

      return this.spaceIntegrationService.edit(existingSpaceIntegration, integrationDto);
    }

    const space: Space = await this.getSpace(integrationDto.spaceId);
    const initiator: User = await this.userService.findOne(uuidToBytes(request.user.sub));
    const integrationType: IntegrationType = await this.integrationTypeService.findOne(integrationDto.integrationType);

    const spaceIntegration: SpaceIntegration = new SpaceIntegration();
    spaceIntegration.space = space;
    spaceIntegration.integrationType = integrationType;

    const savedSpaceIntegration = await this.spaceIntegrationService.enable(
      spaceIntegration,
      initiator,
      space,
      integrationDto,
    );

    if (!savedSpaceIntegration) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Could not save the space integration',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return savedSpaceIntegration;
  }

  @ApiOperation({
    description: 'Disables the space-integration instance',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a disabled space-integration instance',
    type: SpaceIntegration,
  })
  @Post('disable')
  @UseGuards(SpaceIntegrationsGuard)
  async disableIntegration(@Body() integrationDto: IntegrationDto): Promise<SpaceIntegration> {
    const foundSpaceIntegration = await this.getSpaceIntegration(integrationDto);

    if (!foundSpaceIntegration) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Could not save a space integration',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return this.spaceIntegrationService.disable(foundSpaceIntegration, integrationDto);
  }

  @ApiOperation({
    description: 'Returns a Space Integration instance.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a Space Integration instance.',
    type: SpaceIntegration,
  })
  @Get(':spaceId/:integrationType')
  @UseGuards(DashboardAccessGuard)
  async checkIntegration(
    @Param('spaceId') spaceId: string,
    @Param('integrationType') integrationType: IntegrationTypes,
  ): Promise<SpaceIntegration> {
    const space: Space = await this.getSpace(spaceId);
    const foundIntegrationType: IntegrationType = await this.getIntegrationType(integrationType);
    const spaceIntegration = await this.spaceIntegrationService.findOneBySpaceAndIntegration(
      space,
      foundIntegrationType,
    );
    if (!spaceIntegration) {
      throw new BadRequestException(`Could not find integration for space ${spaceId}. Is it enabled?`);
    }
    return spaceIntegration;
  }

  /** Is gives user considered a moderator of the stage
   *
   * Currently an admin or member of the Space.
   */
  async isModerator(user: User, space: Space): Promise<boolean> {
    return await this.userSpaceService.isMember(space, user);
  }

  /**
   * Get space instance or throw 404.
   */
  async getSpace(spaceId: string): Promise<Space> {
    const space = await this.spaceService.findOne(uuidToBytes(spaceId));
    if (!space) {
      throw new NotFoundException(`Could not find space ${spaceId}.`);
    }
    return space;
  }

  /**
   * Get integration-type instance or throw 404.
   */
  async getIntegrationType(integrationType: IntegrationTypes): Promise<IntegrationType> {
    const iType: IntegrationType = await this.integrationTypeService.findOne(integrationType);
    if (!iType) {
      throw new NotFoundException(`Could not find integration-type`);
    }
    return iType;
  }

  /**
   * Get the stage-mode integration instance for a space.
   *
   * throws BadRequestException if it doesn't exist.
   */
  async getSpaceIntegration(integrationDto: IntegrationDto): Promise<SpaceIntegration> {
    const space: Space = await this.spaceService.findOne(uuidToBytes(integrationDto.spaceId));
    const iType: IntegrationType = await this.integrationTypeService.findOne(integrationDto.integrationType);

    const spaceIntegration = await this.spaceIntegrationService.findOneBySpaceAndIntegration(space, iType);
    if (!spaceIntegration) {
      throw new BadRequestException(
        `Could not find space-integration for space ${integrationDto.spaceId}. Is it enabled?`,
      );
    }
    return spaceIntegration;
  }

  /**
   * Get the stage-mode integration instance for a space.
   *
   * throws BadRequestException if it doesn't exist.
   */
  async checkExisting(integrationDto: IntegrationDto): Promise<boolean> {
    const space: Space = await this.spaceService.findOne(uuidToBytes(integrationDto.spaceId));
    const iType: IntegrationType = await this.integrationTypeService.findOne(integrationDto.integrationType);

    const spaceIntegration = await this.spaceIntegrationService.findOneExisting(space, iType);

    return !!spaceIntegration;
  }
}
