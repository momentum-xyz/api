import { Body, Controller, Get, HttpStatus, Param, Put, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { UserService } from '../user.service';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { uuidToBytes } from '../../utils/uuid-converter';
import { User } from '../user.entity';
import { ProfileDto } from './profile.dto';
import { Unprotected } from '../../auth/decorators/unprotected.decorator';
import { TokenInterface } from '../../auth/auth.interface';

@ApiTags('profile')
@Controller('profile')
export class ProfileController {
  constructor(private userService: UserService) {}

  @ApiOperation({
    description: 'Returns a user profile',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a specific profile',
  })
  @Unprotected()
  @Get(':userId')
  async findProfile(@Param('userId') userId: string): Promise<any> {
    const user: User = await this.userService.findOne(uuidToBytes(userId));
    return user.profile;
  }

  @ApiOperation({
    description: 'Edits a profile',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns 200 if profile has been edited',
  })
  @ApiBearerAuth()
  @Put('edit')
  async editProfile(
    @Param() params,
    @Body() request: ProfileDto,
    @Res() response: Response,
    @Req() token: TokenInterface,
  ): Promise<Response> {
    const foundUser: User = await this.userService.findOne(uuidToBytes(token.user.sub));

    if (!foundUser) {
      return response.status(HttpStatus.NOT_FOUND).json({
        status: HttpStatus.NOT_FOUND,
        message: 'Could not find a user',
      });
    } else {
      if (request.name) {
        const user = await this.userService.findByName(request.name);

        if (user && user.name && !foundUser.id.equals(user.id)) {
          return response.status(HttpStatus.BAD_REQUEST).json({ errors: { name: 'This name is already in use' } });
        }

        foundUser.name = request.name;
      }
      foundUser.profile = request.profile;
      foundUser.profile.onBoarded = true;
      const savedUser: User = await this.userService.update(foundUser);

      if (savedUser) {
        return response.status(HttpStatus.OK).json({
          status: HttpStatus.OK,
          message: 'Successfully edited user profile',
          userOnboarded: savedUser.profile.onBoarded,
        });
      } else {
        return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Could not edit this user profile',
        });
      }
    }
  }
}
