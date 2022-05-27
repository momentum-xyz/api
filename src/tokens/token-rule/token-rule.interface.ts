import { ApiProperty } from '@nestjs/swagger';
import { TokenRuleInterface, TokenRuleStatus } from './token-rule.entity';
import { Network } from '../../network/network.entity';
import { TokenType } from '../token/token.entity';

export class TokenRuleCreateDto {
  @ApiProperty()
  tokenId: string;
  @ApiProperty()
  spaceId: string;
  @ApiProperty()
  rule: TokenRuleInterface;
  @ApiProperty()
  name: string;
}

export class TokenRuleApplyDto {
  @ApiProperty()
  tokenRuleId: string;
}

export class TokenRuleProcessDto {
  @ApiProperty()
  status: TokenRuleStatus;
}

export class TokenRuleMqttDto {
  id: string;
  active: boolean;
  network: Network;
  token: SmartContractMqttDto;
  requirements: RuleRequirementDto;
}

export class SmartContractMqttDto {
  type: string;
  address: string;
  token_id: string;
}

export class RuleRequirementDto {
  minimum_balance: number;
}

export interface PermissionUpdate {
  accountAddress: string;
  ruleUUID: string;
  active: boolean;
}

export class TokenRuleResponseDto {
  @ApiProperty({
    description: 'UUID',
    example: 'a8ffd918-f8c5-4330-910a-305c3a762efe',
  })
  id: string;

  @ApiProperty({
    example: TokenRuleStatus.REQUESTED,
  })
  status: TokenRuleStatus;

  @ApiProperty()
  name: string;

  @ApiProperty({
    description: 'UUID of user who created the rule',
    example: 'c4b2fd1d-1f31-462d-a0f6-c12e8265b909',
  })
  userId: string;

  @ApiProperty({
    description: 'Name of user who created the rule',
  })
  userName: string;

  @ApiProperty({
    description: 'UUID of the token group user',
    example: 'c4b2fd1d-1f31-462d-a0f6-c12e8265b909',
  })
  tokenGroupUserId: string;

  @ApiProperty({
    example: 42,
  })
  minBalance: number;

  @ApiProperty({
    example: 'eth_mainnet',
  })
  network: string;

  @ApiProperty({
    example: '0xd83670c7a12047a4892df9ec75604f74',
  })
  contractAddress: string;

  @ApiProperty({
    example: TokenType.ERC721,
  })
  tokenType: TokenType;

  @ApiProperty({
    example: '1970-01-01T00:00:00.000Z',
  })
  createdAt: string;

  @ApiProperty({
    example: '1970-01-01T00:00:00.000Z',
  })
  updatedAt: string;
}

export class TokenRuleListResponse {
  @ApiProperty({
    example: 1,
  })
  count: number;
  tokenRule: TokenRuleResponseDto[];
}
