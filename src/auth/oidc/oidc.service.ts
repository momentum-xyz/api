import { Injectable, Logger } from '@nestjs/common';
import { Client as _Client, ClientAuthMethod, Issuer, errors } from 'openid-client';
import * as jwtlib from 'jsonwebtoken';
import * as jose from 'jose';

// No type spec for validate function
export type OIDCClient = _Client & {
  validateJWT: (jwt: string, expectedAlg: string, required?: string[]) => Promise<{ header; payload; key }>;
};
type JWT = { header; payload; signature };

@Injectable()
export class OIDCService {
  private readonly logger = new Logger(OIDCService.name);
  clients: Record<string, OIDCClient>;
  jwkSets: Record<string, jose.JWTVerifyGetKey>;

  async loadProviders() {
    this.clients = {};
    this.jwkSets = {};
    const providers = process.env['OIDC_PROVIDERS'].split(',');
    for (const name of providers) {
      const { key, client, jwkSet } = await getOIDCClient(name);
      this.clients[key] = client;
      this.jwkSets[key] = jwkSet;
    }
    // should probably assert atleast one here :)
  }

  async validateJWT(token: string): Promise<{ header; payload; key } | false> {
    try {
      const jwt: JWT = this.decodeJWT(token);
      const client = this.getClient(jwt);
      const algo = client.metadata.authorization_signed_response_alg;
      const { header, payload, key } = await client.validateJWT(token, algo);
      return { header, payload, key };
    } catch (e) {
      if (e instanceof errors.RPError && e.message.startsWith('JWT expired')) {
        this.logger.debug(e.message);
      } else {
        this.logger.error(e.messag, e.stack);
      }
    }
    return false;
  }

  async validateIDToken(token: string): Promise<{ header; payload; key } | false> {
    try {
      const jwt: JWT = this.decodeJWT(token);
      const client = this.getClient(jwt);
      const algo = client.metadata.id_token_signed_response_alg;
      const JWKS = this.getJWKS(jwt.payload.iss);
      const { protectedHeader, payload, key } = await jose.jwtVerify(token, JWKS, {
        algorithms: [algo],
      });
      const header = protectedHeader;
      return { header, payload, key };
    } catch (e) {
      if (e instanceof jose.errors.JWTExpired) {
        this.logger.debug(e.message);
      } else {
        this.logger.error(e.messag, e.stack);
      }
    }
    return false;
  }

  async introspect(token: string) {
    const jwt: JWT = this.decodeJWT(token);
    const client = this.getClient(jwt);

    return await client.introspect(token);
  }

  public decodeJWT(token: string): JWT | null {
    // null a bit annoying, would prefer exception so we can show
    // what was wrong with the parsing
    const result = jwtlib.decode(token, { complete: true });
    if (result) {
      return result;
    }
    throw Error(`Could not decode JWT string ${token}`);
  }

  private getClient(jwt: JWT): OIDCClient {
    const issuerField = jwt.payload.iss;
    if (!issuerField) {
      throw Error('No iss field in JWT');
    }
    const client = this.clients[issuerField];
    if (!client) {
      throw Error(`No supported client found for ${issuerField}`);
    }
    return client;
  }

  private getJWKS(issuer: string) {
    const jwks = this.jwkSets[issuer];
    if (!jwks) {
      throw Error(`No supported JWKS found for ${issuer}`);
    }
    return jwks;
  }
}

async function getOIDCClient(key: string) {
  const name = key.toUpperCase();
  const discoverURL = process.env[`OIDC_${name}_URL`];
  const clientID = process.env[`OIDC_${name}_ID`];
  const clientSecret = process.env[`OIDC_${name}_SECRET`];
  const additionalParty = process.env[`OIDC_${name}_ADDITIONAL_PARTY`];
  const introspectionURL = process.env[`OIDC_${name}_INTROSPECTION_URL`];
  const introspectionAuth = process.env[`OIDC_${name}_INTROSPECTION_AUTH`];
  const addParties = additionalParty ? { additionalAuthorizedParties: additionalParty } : undefined;
  const metadata = introspectionURL
    ? {
        introspection_endpoint_auth_method: (introspectionAuth || 'none') as ClientAuthMethod,
      }
    : undefined;

  try {
    const issuer = await Issuer.discover(discoverURL);
    if (introspectionURL) {
      issuer.introspection_endpoint = introspectionURL;
    }
    const { Client } = issuer;
    const client = new Client(
      {
        client_id: clientID,
        client_secret: clientSecret,
        ...metadata,
      },
      undefined, // jwt keys, we got from discovery
      addParties,
    );
    const jwkSet = jose.createRemoteJWKSet(new URL(issuer.metadata.jwks_uri));
    return { key: issuer.metadata.issuer, client: client as OIDCClient, jwkSet: jwkSet };
  } catch (e) {
    console.debug(e);
    throw Error(`Unable to discover OIDC client for ${discoverURL}`);
  }
}
