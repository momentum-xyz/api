import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('user-types')
@Controller('user-types')
export class UserTypeController {
  constructor() {}
}
