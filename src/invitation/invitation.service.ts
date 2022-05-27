import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { Invitation } from './invitation.entity';

@Injectable()
export class InvitationService {
  constructor(
    @InjectRepository(Invitation)
    private readonly inviteRepository: Repository<Invitation>,
  ) {}

  async findOne(invitation: string): Promise<Invitation> {
    return this.inviteRepository.findOne({
      where: {
        invitation: invitation,
      },
    });
  }

  async findOneByEmail(email: string): Promise<Invitation> {
    return this.inviteRepository.findOne({
      where: {
        email: email,
      },
      relations: ['space'],
    });
  }

  async findAll(): Promise<Invitation[]> {
    return this.inviteRepository.find();
  }

  async create(invitation: Invitation): Promise<Invitation> {
    return this.inviteRepository.save(invitation);
  }

  async delete(invitation: Invitation): Promise<DeleteResult> {
    return this.inviteRepository.delete(invitation);
  }
}
