import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RtcRole, RtcTokenBuilder, RtmRole, RtmTokenBuilder } from 'agora-access-token';
import { TokenInterface } from '../../auth/auth.interface';
import { AgoraGuard } from './agora.guard';

@ApiTags('agora')
@Controller('agora')
export class AgoraController {
  @Get('token/:channel/:screenshare?')
  @UseGuards(AgoraGuard)
  async getToken(@Param() params, @Req() request: TokenInterface): Promise<string> {
    const appID = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;
    const channelName = params.channel;
    const screenShare = params.screenshare;

    const role = RtcRole.PUBLISHER;

    const expirationTimeInSeconds = 3600 * 24;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    return RtcTokenBuilder.buildTokenWithAccount(
      appID,
      appCertificate,
      channelName,
      (screenShare ? 'ss|' : '') + request.user.sub,
      role,
      privilegeExpiredTs,
    );
  }

  @Get('token')
  async getRtmToken(@Param() params, @Req() request: TokenInterface): Promise<string> {
    const appID = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    const expirationTimeInSeconds = 3600 * 24;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    return RtmTokenBuilder.buildToken(appID, appCertificate, request.user.sub, RtmRole.Rtm_User, privilegeExpiredTs);
  }
}
