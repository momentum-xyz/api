import { Request } from 'express';
import { NetworkType } from '../network/network.entity';

export interface TokenInterface extends Request {
  user: {
    iss: string;
    sub: string;
    email_verified: boolean;
    name: string;
    preferred_username: string;
    given_name: string;
    family_name: string;
    email: string;
    web3_type: NetworkType;
    web3_address: string;
    guest: any;
  };
  accessTokenJWT: string;
  userType: string;
}

export interface EthDto {
  ethAddress: string;
}

// {
//   "active": true,
//   "aud": [],
//   "client_id": "auth-code-client",
//   "exp": 1638799306,
//   "iat": 1638795706,
//   "iss": "http://localhost:4444/",
//   "nbf": 1638795706,
//   "scope": "openid offline",
//   "sub": "abb20a21-1998-48fd-be67-edad5f5b4e54",
//   "eth": "0x7A19A567fb2713c9D8029d29e8b2884645bAa822",
//   "token_type": "Bearer",
//   "token_use": "access_token"
// }
