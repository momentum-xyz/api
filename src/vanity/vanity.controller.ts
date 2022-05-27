import { Controller } from '@nestjs/common';
import { VanityService } from './vanity.service';

@Controller('vanity')
export class VanityController {
  constructor(private vanityService: VanityService) {}
}
