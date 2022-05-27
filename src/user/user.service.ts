import { HttpService, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { User } from './user.entity';
import { MqttService } from '../services/mqtt.service';
import { bytesToEth } from '../utils/uuid-converter';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private mqttService: MqttService,
    private httpService: HttpService,
  ) {}

  async findOne(userId: Buffer): Promise<User> {
    return this.userRepository.findOne({
      where: {
        id: userId,
      },
      relations: ['userWallets'],
    });
  }

  async findCount(): Promise<number> {
    return this.userRepository.count();
  }

  async findByName(name: string): Promise<User> {
    return this.userRepository.findOne({
      where: {
        name: name,
      },
    });
  }

  async findByWalletAddress(walletAddress: Buffer): Promise<User> {
    return this.userRepository.findOne({
      where: {
        wallet: walletAddress,
      },
    });
  }

  async update(user: User): Promise<User> {
    return this.userRepository.save(user);
  }

  async filter(query: string): Promise<User[]> {
    return this.userRepository.find({
      order: { name: 'ASC' },
      where: [{ name: Like(`%${query}%`) }, { email: Like(`%${query}%`) }],
    });
  }

  async create(user: User): Promise<User> {
    const resp = await this.userRepository.save(user);
    if (resp) {
      const savedUser: User = await this.findOne(user.id);
      if (savedUser.userWallets.length > 0) {
        for (const userWallet of savedUser.userWallets) {
          await this.mqttService.publishUserAccountUpdate({ accountAddress: bytesToEth(userWallet.wallet) });
        }
      }

      return resp;
    }
  }

  async updateProfile(user: User) {
    return this.userRepository.query('UPDATE users SET `profile` = ? WHERE id = ?', [
      JSON.stringify(user.profile),
      user.id,
    ]);
  }

  async findOneByEmail(email: string) {
    return this.userRepository.findOne({
      where: {
        email: email,
      },
    });
  }

  async uploadAvatar(avatar: Express.Multer.File): Promise<any> {
    return this.httpService.axiosRef({
      method: 'post',
      url: `${process.env.RENDER_INTERNAL_URL}/render/addimage`,
      maxBodyLength: 100000000,
      maxContentLength: 100000000,
      data: avatar.buffer,
      headers: { 'Content-Type': `image/png` },
    });
  }

  async deleteTokenGroupUser(tokenGroupUser: User) {
    return this.userRepository.delete(tokenGroupUser);
  }

  async updateStatus(user: User) {
    return this.userRepository.query('UPDATE users SET `status` = ? WHERE id = ?', [user.status, user.id]);
  }
}
