import { Controller, Get, HttpStatus, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ResponseEventDto } from '../event.interfaces';
import { SpaceIntegrationUser } from '../../space-integration-users/space-integration-users.entity';
import { IntegrationTypeService } from '../../integration-type/integration-type.service';
import { TokenInterface } from '../../auth/auth.interface';
import { User } from '../../user/user.entity';
import { UserService } from '../../user/user.service';
import { bytesToUuid, uuidToBytes } from '../../utils/uuid-converter';
import { SpaceIntegrationsService } from '../../space-integrations/space-integrations.service';
import { AttendeeInterface } from './attendee.interface';
import { Attendee } from './attendee.entity';
import { EventsService } from '../events.service';
import { AttendeeService } from './attendee.service';

@ApiTags('attendees')
@Controller('attendees')
export class AttendeeController {
  constructor(
    private readonly spaceIntegrationService: SpaceIntegrationsService,
    private readonly eventAttendeeService: AttendeeService,
    private readonly integrationTypeService: IntegrationTypeService,
    private readonly userService: UserService,
    private readonly eventService: EventsService,
  ) {}

  @ApiBearerAuth()
  @ApiResponse({
    status: 201,
    type: SpaceIntegrationUser,
  })
  @Post('add/:spaceId/:eventId')
  async addAttendee(@Param() params, @Req() request: TokenInterface, @Res() res): Promise<any> {
    try {
      const user: User = await this.userService.findOne(uuidToBytes(request.user.sub));
      const event: ResponseEventDto = await this.eventService.getOne(params.spaceId, params.eventId);

      const eventAttendee = new Attendee();
      eventAttendee.eventId = uuidToBytes(event.id);
      eventAttendee.userId = user.id;

      await this.eventAttendeeService.create(eventAttendee);
      const attendee = await this.eventAttendeeService.findOne(eventAttendee);

      res.status(HttpStatus.CREATED).json({
        id: bytesToUuid(attendee.user.id),
        name: attendee.user.name,
        avatarHash: attendee.user.profile.avatarHash,
        status: attendee.user.status,
      });
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
  @Post('remove/:spaceId/:eventId')
  async removeAttendee(@Param() params, @Req() request: TokenInterface, @Res() res): Promise<any> {
    try {
      const event: ResponseEventDto = await this.eventService.getOne(params.spaceId, params.eventId);
      const user: User = await this.userService.findOne(uuidToBytes(request.user.sub));

      await this.eventAttendeeService.delete(uuidToBytes(event.id), user.id);

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
  @Get(':spaceId/:eventId/:limit')
  async getAttendees(@Param() params, @Req() request: TokenInterface, @Res() res): Promise<any> {
    try {
      const event: ResponseEventDto = await this.eventService.getOne(params.spaceId, params.eventId);
      const attendees: Attendee[] = await this.eventAttendeeService.findAllByEvent(uuidToBytes(event.id), params.limit);

      res.status(HttpStatus.OK).json({ attendees: [...attendees], count: attendees.length });
    } catch (e) {
      console.log(e);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: e.message });
    }
  }
}
