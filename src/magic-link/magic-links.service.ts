import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from '../user/user.service';
import { MagicLink } from './magic-link.entity';

@Injectable()
export class MagicLinksService {
  constructor(
    @InjectRepository(MagicLink)
    private readonly magicLinkRepository: Repository<MagicLink>,
    private readonly userService: UserService,
  ) {}

  async save(magicLink: MagicLink): Promise<MagicLink> {
    return await this.magicLinkRepository.save(magicLink);
  }

  async findOne(id: Buffer): Promise<MagicLink> {
    return await this.magicLinkRepository.findOne({ where: { id: id } });
  }

  async findByEventId(eventId: string): Promise<MagicLink> {
    return this.magicLinkRepository.query("SELECT * FROM magic_links WHERE JSON_EXTRACT(data, '$.eventId') = ?", [
      eventId,
    ]);
  }
}
