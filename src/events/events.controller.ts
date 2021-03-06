import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { TokenInterface } from '../auth/auth.interface';
import { NewEventDto, ResponseEventDto, UpdateEventDto } from './event.interfaces';
import { EventsService } from './events.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventsGuard } from './events.guard';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService, private eventEmitter: EventEmitter2) {}

  @ApiOperation({
    description: 'Get list of events. List filtered by `end > current timestamp`',
  })
  @ApiResponse({
    status: 200,
    type: [ResponseEventDto],
  })
  @ApiBearerAuth()
  @UseGuards(EventsGuard)
  @Get(':spaceId')
  async getAllEvents(
    @Param('spaceId') spaceId,
    @Req() request: TokenInterface,
    @Res({ passthrough: true }) res,
    @Query('children') children?: string,
  ): Promise<any> {
    const recursive = ['true', '1'].includes(children);
    try {
      return await this.eventsService.getAll(spaceId, recursive);
    } catch (e) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: e.message,
        info: e.toString(),
      });
    }
  }

  @ApiOperation({
    description: 'Image is optional',
  })
  @ApiResponse({
    status: 200,
    type: ResponseEventDto,
  })
  @ApiBearerAuth()
  @UseGuards(EventsGuard)
  @Post(':spaceId')
  @UseInterceptors(FileInterceptor('file'))
  async createEvent(
    @Param() params,
    @Req() request: TokenInterface,
    @Body() newEventDto: NewEventDto,
    @UploadedFile() file: Express.Multer.File,
    @Res({ passthrough: true }) res,
  ): Promise<ResponseEventDto | any> {
    // TODO inject validator service with ajv
    const ajv = new Ajv();
    addFormats(ajv);
    const isValid = ajv.validate(NewEventDto.schema, newEventDto);
    if (!isValid) {
      res.status(HttpStatus.BAD_REQUEST).json({
        error: {
          code: 1,
          message: ajv.errorsText(),
          data: ajv.errors,
        },
      });
      return;
    }

    try {
      const { id, image_hash } = await this.eventsService.create(newEventDto, params.spaceId, file);
      this.eventEmitter.emit('event_changed', id, params.spaceId);
      return { id, image_hash, ...newEventDto };
    } catch (e) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: e.message, info: e.toString() });
    }
  }

  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    type: ResponseEventDto,
  })
  @UseGuards(EventsGuard)
  @Get(':spaceId/:eventId')
  async getEvent(@Param() params, @Req() request: TokenInterface, @Res() res): Promise<any> {
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

  @ApiOperation({
    description: 'Update event. All params are optional. At least one required',
  })
  @ApiBearerAuth()
  @UseGuards(EventsGuard)
  @Put(':spaceId/:eventId')
  async updateEvent(
    @Param() params,
    @Req() request: TokenInterface,
    @Res() res,
    @Body() updateEventDto: UpdateEventDto,
  ): Promise<any> {
    // TODO inject validator service with ajv
    const ajv = new Ajv();
    addFormats(ajv);
    const isValid = ajv.validate(UpdateEventDto.schema, updateEventDto);
    if (!isValid) {
      res.status(HttpStatus.BAD_REQUEST).json({
        error: {
          code: 1,
          message: ajv.errorsText(),
          data: ajv.errors,
        },
      });
      return;
    }

    try {
      const affectedRows = await this.eventsService.update(updateEventDto, params.spaceId, params.eventId);
      if (affectedRows === 0) {
        res
          .status(HttpStatus.NOT_FOUND)
          .json({ error: `Event with id = ${params.eventId} spaceId = ${params.spaceId} not found` });
        return;
      }
      this.eventEmitter.emit('event_changed', params.eventId, params.spaceId);
      res.status(HttpStatus.OK).json(updateEventDto);
    } catch (e) {
      console.log(e);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: e.message, info: e.toString() });
    }
  }

  @ApiBearerAuth()
  @UseGuards(EventsGuard)
  @Delete(':spaceId/:eventId')
  async deleteEvent(@Param() params, @Req() request: TokenInterface, @Res({ passthrough: true }) res): Promise<any> {
    try {
      await this.eventsService.delete(params.spaceId, params.eventId);

      return { success: true };
    } catch (e) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: e.message, info: e.toString() });
    }
  }

  @ApiBearerAuth()
  @UseGuards(EventsGuard)
  @Post(':spaceId/:eventId/image')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Param() params,
    @Req() request: TokenInterface,
    @Res({ passthrough: true }) res,
    @Body() body: Record<string, any>,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<any> {
    try {
      const { affectedRows, image_hash } = await this.eventsService.updateImage(file, params.spaceId, params.eventId);
      if (affectedRows === 0) {
        res
          .status(HttpStatus.NOT_FOUND)
          .json({ error: `Event with id = ${params.eventId} spaceId = ${params.spaceId} not found` });
        return;
      }
      return { image_hash };
    } catch (e) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: e.message, info: e.toString() });
    }
  }
}
