import { Body, Controller, Get, HttpStatus, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SpaceIntegrationUsersService } from '../../space-integration-users/space-integration-users.service';
import { EventsGuard } from '../events.guard';
import { ResponseEventDto } from '../event.interfaces';
import { SpaceIntegrationUser } from '../../space-integration-users/space-integration-users.entity';
import { IntegrationType } from '../../integration-type/integration-type.entity';
import { IntegrationTypeService } from '../../integration-type/integration-type.service';
import { IntegrationTypes } from '../../integration-type/integration-type.interface';
import { TokenInterface } from '../../auth/auth.interface';

export interface AttendeeAddDto {}

@ApiTags('attendees')
@Controller('attendees')
export class AttendeeController {
  constructor(private readonly spaceIntegrationUserService: SpaceIntegrationUsersService, private readonly integrationTypeService: IntegrationTypeService) {}

  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    type: ResponseEventDto,
  })
  @UseGuards(EventsGuard)
  @Post('add')
  async addAttendee(@Body() body: AttendeeAddDto, @Req() request: TokenInterface, @Res() res): Promise<any> {
    try {
      const integrationType: IntegrationType = await this.integrationTypeService.findOne(IntegrationTypes.EVENT);

      const spaceIntegrationUser = new SpaceIntegrationUser();
      spaceIntegrationUser.integrationTypeId = integrationType.id;
      spaceIntegrationUser.userId = integrationType.id;
      spaceIntegrationUser.spaceId = integrationType.id;
      const sIU = await this.spaceIntegrationUserService.create(params.spaceId, params.eventId);

      res.status(HttpStatus.OK).json(event);
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
  @UseGuards(EventsGuard)
  @Post('remove')
  async removeAttendee(@Param() params, @Req() request: TokenInterface, @Res() res): Promise<any> {
    try {
      const event = await this.eventsService.getOne(params.spaceId, params.eventId);

      if (!event) {
        res.status(HttpStatus.NOT_FOUND).json({ error: `event with Id=${params.eventId} not found` });
        return;
      }

      res.status(HttpStatus.OK).json(event);
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
  @UseGuards(EventsGuard)
  @Get()
  async getAttendees(@Param() params, @Req() request: TokenInterface, @Res() res): Promise<any> {
    try {
      const event = await this.eventsService.getOne(params.spaceId, params.eventId);

      if (!event) {
        res.status(HttpStatus.NOT_FOUND).json({ error: `event with Id=${params.eventId} not found` });
        return;
      }

      res.status(HttpStatus.OK).json(event);
    } catch (e) {
      console.log(e);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: e.message });
    }
  }
}
