import { Controller, Get, HttpStatus, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SpaceIntegrationUsersService } from '../../space-integration-users/space-integration-users.service';
import { ResponseEventDto } from '../event.interfaces';
import { SpaceIntegrationUser } from '../../space-integration-users/space-integration-users.entity';
import { IntegrationType } from '../../integration-type/integration-type.entity';
import { IntegrationTypeService } from '../../integration-type/integration-type.service';
import { IntegrationTypes } from '../../integration-type/integration-type.interface';
import { TokenInterface } from '../../auth/auth.interface';
import { User } from '../../user/user.entity';
import { UserService } from '../../user/user.service';
import { bytesToUuid, uuidToBytes } from '../../utils/uuid-converter';
import { Space } from '../../space/space.entity';
import { SpaceService } from '../../space/space.service';
import { SpaceIntegrationsService } from '../../space-integrations/space-integrations.service';
import { AttendeeInterface } from './attendee.interface';

@ApiTags('attendees')
@Controller('attendees')
export class AttendeeController {
  constructor(
    private readonly spaceIntegrationService: SpaceIntegrationsService,
    private readonly spaceIntegrationUserService: SpaceIntegrationUsersService,
    private readonly integrationTypeService: IntegrationTypeService,
    private readonly userService: UserService,
    private readonly spaceService: SpaceService,
  ) {}

  @ApiBearerAuth()
  @ApiResponse({
    status: 201,
    type: SpaceIntegrationUser,
  })
  @Post('add/:spaceId')
  async addAttendee(@Param() params, @Req() request: TokenInterface, @Res() res): Promise<any> {
    try {
      const integrationType: IntegrationType = await this.integrationTypeService.findOne(IntegrationTypes.EVENT);
      const user: User = await this.userService.findOne(uuidToBytes(request.user.sub));
      const space: Space = await this.spaceService.findOne(uuidToBytes(params.spaceId));

      const spaceIntegrationUser = new SpaceIntegrationUser();
      spaceIntegrationUser.integrationTypeId = integrationType.id;
      spaceIntegrationUser.userId = user.id;
      spaceIntegrationUser.spaceId = space.id;
      spaceIntegrationUser.data = {};
      spaceIntegrationUser.flag = 0;

      await this.spaceIntegrationUserService.create(spaceIntegrationUser);

      res.status(HttpStatus.CREATED).json(spaceIntegrationUser);
    } catch (e) {
      console.log(e);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: e.message });
    }
  }

  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    type: ResponseEventDto,
  })
  @Post('remove/:spaceId')
  async removeAttendee(@Param() params, @Req() request: TokenInterface, @Res() res): Promise<any> {
    try {
      const integrationType: IntegrationType = await this.integrationTypeService.findOne(IntegrationTypes.EVENT);
      const space: Space = await this.spaceService.findOne(uuidToBytes(params.spaceId));
      const user: User = await this.userService.findOne(uuidToBytes(request.user.sub));
      const spaceIntegration = await this.spaceIntegrationService.findOneBySpaceAndIntegration(space, integrationType);

      const attendee = await this.spaceIntegrationUserService.findDistinct(spaceIntegration, user);

      if (!attendee) {
        res
          .status(HttpStatus.NOT_FOUND)
          .json({ error: `attendee for Id=${bytesToUuid(spaceIntegration.spaceId)} not found` });
        return;
      }

      await this.spaceIntegrationUserService.delete(attendee);

      res.status(HttpStatus.OK);
    } catch (e) {
      console.log(e);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: e.message });
    }
  }

  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    type: AttendeeInterface,
  })
  @Get(':spaceId/:limit')
  async getAttendees(@Param() params, @Req() request: TokenInterface, @Res() res): Promise<any> {
    try {
      const integrationType: IntegrationType = await this.integrationTypeService.findOne(IntegrationTypes.EVENT);
      const space: Space = await this.spaceService.findOne(uuidToBytes(params.spaceId));
      const user: User = await this.userService.findOne(uuidToBytes(request.user.sub));
      const spaceIntegration = await this.spaceIntegrationService.findOneBySpaceAndIntegration(space, integrationType);
      const attendees = await this.spaceIntegrationUserService.findAllWhereUserAndIntegration(
        spaceIntegration,
        user,
        params.limit,
      );

      res.status(HttpStatus.OK).json({ attendees: [...attendees], count: attendees.length });
    } catch (e) {
      console.log(e);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: e.message });
    }
  }
}
