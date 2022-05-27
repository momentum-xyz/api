import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NetworkType, Network } from './network.entity';

@Injectable()
export class NetworkService {
  constructor(
    @InjectRepository(Network)
    private readonly networkRepository: Repository<Network>,
  ) {}

  find(): Promise<Network[]> {
    return this.networkRepository.find();
  }

  findOne(networkType: NetworkType): Promise<Network> {
    return this.networkRepository.findOne({
      where: {
        name: networkType,
      },
    });
  }

  async getOrCreate(networkType: NetworkType): Promise<Network> {
    const network = await this.findOne(networkType);
    if (network) {
      return network;
    }
    const newNetwork = new Network();
    newNetwork.name = networkType;
    await this.networkRepository
      .createQueryBuilder()
      .insert()
      .into(Network)
      .values(newNetwork)
      .onConflict('("name") DO NOTHING')
      .execute();
    return this.networkRepository.findOneOrFail({
      where: {
        name: networkType,
      },
    });
  }
}
