import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserService } from '../user/user.service';
import { MagicLinksService } from './magic-links.service';
import { MagicLinkDTO } from './magic-links.dto';
import { bytesToUuid, uuidToBytes } from '../utils/uuid-converter';
import { MagicLinksGuard } from './magic-links.guard';
import { SpaceService } from '../space/space.service';
import { TokenInterface } from '../auth/auth.interface';
import { MagicLink } from './magic-link.entity';

@ApiTags('magic')
@Controller('magic')
export class MagicLinksController {
  constructor(
    private userService: UserService,
    private magicLinksService: MagicLinksService,
    private spaceService: SpaceService,
  ) {}
  //
  @ApiOperation({
    description: 'Generates a magic link',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a magic link',
  })
  @Post('generate-link')
  @UseGuards(MagicLinksGuard)
  async channelLink(@Req() request: TokenInterface, @Body() magicLinkDTO: MagicLinkDTO): Promise<any> {
    const magicLink: MagicLink = new MagicLink();
    magicLink.data = magicLinkDTO.data;
    magicLink.type = magicLinkDTO.type;
    magicLink.created_at = new Date();
    magicLink.updated_at = new Date();

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    magicLink.expire = tomorrow;
    const savedLink = await this.magicLinksService.save(magicLink);

    return {
      ...savedLink,
      id: bytesToUuid(savedLink.id),
    };
  }

  @ApiOperation({
    description: 'Gets magic link details by id',
  })
  @ApiResponse({
    status: 200,
    description: 'Magic link details by id',
  })
  @Get(':id')
  async getById(@Req() request: TokenInterface, @Param() params): Promise<any> {
    const magicLink = await this.magicLinksService.findOne(uuidToBytes(params.id));
    let deleted = false;

    // @ts-ignore
    if (magicLink.data.id) {
      // @ts-ignore
      const space = await this.spaceService.findOne(uuidToBytes(magicLink.data.id));
      if (!space) {
        deleted = true;
      }
    }

    return {
      ...magicLink,
      id: bytesToUuid(magicLink.id),
      expired: false,
      deleted: deleted,
    };
  }
}
