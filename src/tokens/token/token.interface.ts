import { ApiProperty } from '@nestjs/swagger';
import { TokenType } from './token.entity';
import { IsNotEmpty } from 'class-validator';
import { NetworkType } from '../../network/network.entity';

export class TokenCreateDto {
  @ApiProperty()
  @IsNotEmpty()
  tokenName: string;

  @ApiProperty()
  @IsNotEmpty()
  contractAddress: string;

  @ApiProperty()
  @IsNotEmpty()
  network: NetworkType;

  @ApiProperty()
  @IsNotEmpty()
  tokenType: TokenType;
}
