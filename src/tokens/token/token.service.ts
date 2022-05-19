import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Token } from './token.entity';
import { Network } from '../../network/network.entity';

@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(Token)
    private readonly tokenRepository: Repository<Token>,
  ) {}

  findOne(tokenId: Buffer): Promise<Token> {
    return this.tokenRepository.findOne({
      where: {
        id: tokenId,
      },
      relations: ['network'],
    });
  }

  findByNodeId(nodeId: Buffer): Promise<Token[]> {
    return this.tokenRepository.find({
      where: {
        worldId: nodeId,
      },
      relations: ['network'],
    });
  }

  findByNetworkAndAddress(network: Network, address: Buffer): Promise<Token[]> {
    return this.tokenRepository.find({
      where: {
        network: network,
        contractAddress: address,
      },
      relations: ['network'],
    });
  }

  findApproved(): Promise<Token[]> {
    return this.tokenRepository.find({
      where: {
        whitelisted: +true,
      },
      relations: ['network'],
    });
  }

  async filter(query: string): Promise<Token[]> {
    return this.tokenRepository.find({
      order: { name: 'ASC' },
      where: [{ name: Like(`%${query}%`) }],
    });
  }

  create(token: Token): Promise<Token> {
    return this.tokenRepository.save(token);
  }

  async whitelist(token: Token) {
    token.whitelisted = +true;
    return this.tokenRepository.save(token);
  }
}
