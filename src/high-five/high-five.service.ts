import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MqttService } from '../services/mqtt.service';
import { HighFive } from './high-five.entity';

@Injectable()
export class HighFiveService {
  constructor(
    @InjectRepository(HighFive)
    private readonly highFiveRepository: Repository<HighFive>,
    private client: MqttService,
  ) {}

  async findCount(): Promise<number> {
    const highFives: HighFive[] = await this.highFiveRepository.find();
    const countArray: number[] = highFives.map((highFive) => highFive.cnt);
    return countArray.reduce((a, b) => a + b, 0);
  }
}
