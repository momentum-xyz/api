import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { UserWallet } from './user-wallet.entity';

@Injectable()
export class UserWalletService {
  constructor(
    @InjectRepository(UserWallet)
    private readonly userWalletRepository: Repository<UserWallet>,
  ) {}

  async findAll(): Promise<UserWallet[]> {
    return this.userWalletRepository.find({ relations: ['network'] });
  }

  async findAllForUser(user: User): Promise<UserWallet[]> {
    return this.userWalletRepository.find({
      where: {
        user: user,
      },
      relations: ['user'],
    });
  }

  async create(userWallet: UserWallet): Promise<UserWallet> {
    return this.userWalletRepository.save(userWallet);
  }

  async delete(userWallet: UserWallet): Promise<DeleteResult> {
    return this.userWalletRepository.delete(userWallet);
  }
}
