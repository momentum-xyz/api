import { v4 as uuidv4 } from 'uuid';
import { Body, Controller, HttpStatus, Put, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { UserService } from '../user.service';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { bytesToUuid, uuidToBytes } from '../../utils/uuid-converter';
import { User } from '../user.entity';
import { TokenInterface } from '../../auth/auth.interface';
import { UserStatusChangeDto } from './status.interface';
import { MqttService } from '../../services/mqtt.service';

@ApiTags('status')
@Controller('status')
export class StatusController {
  constructor(private mqttService: MqttService, private userService: UserService) {}

  @ApiOperation({
    description: 'Changes a users status',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns 200 when user status has been changed',
  })
  @Put()
  @ApiBearerAuth()
  async changeStatus(
    @Req() request: TokenInterface,
    @Body() body: UserStatusChangeDto,
    @Res() response: Response,
  ): Promise<Response> {
    const user: User = await this.userService.findOne(uuidToBytes(request.user.sub));

    if (!user) {
      return response.status(HttpStatus.NOT_FOUND).json({
        message: 'Could not find corresponding user',
      });
    }

    user.status = body.status;

    const queryResponse = await this.userService.updateStatus(user);

    if (queryResponse.affectedRows < 0) {
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Could not save user status',
      });
    }

    await this.mqttService.publish(
      `user_control/${bytesToUuid(user.id)}/relay/status`,
      JSON.stringify({
        status: body.status,
      }),
      false,
      uuidv4(),
    );

    return response.status(HttpStatus.OK).json({ ...user });
  }
}
