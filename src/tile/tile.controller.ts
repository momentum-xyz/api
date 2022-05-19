import { Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TileService } from './tile.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { TileDto } from './tile.dto';

@ApiTags('tile')
@Controller()
export class TileController {
  constructor(private tileService: TileService) {}

  @ApiOperation({
    description: 'Uploads tile media.',
  })
  @ApiResponse({
    status: 201,
    description: 'Returns a media hash',
    type: TileDto,
  })
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@Body() tileDto: TileDto, @UploadedFile() file: Express.Multer.File): Promise<void> {
    const hashResponse = await this.tileService.upload(file);
    return hashResponse.data.hash;
  }
}
