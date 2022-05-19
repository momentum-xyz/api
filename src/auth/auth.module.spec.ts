/**
 * Integration test for AuthModule.
 * TODO: move to nestjs e2e testing structure.
 */
import { APP_GUARD } from '@nestjs/core';
import { Controller, Get, HttpModule, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { createMock } from '@golevelup/ts-jest';
import { Issuer } from 'openid-client';
import * as request from 'supertest';
import * as jwt from 'jsonwebtoken';
import * as jose from 'jose';
import * as nock from 'nock';

import { UserSpaceService } from '../user-space/user-space.service';
import { UserTypeService } from '../user-type/user-type.service';
import { InvitationService } from '../invitation/invitation.service';
import { UserService } from '../user/user.service';
import { SpaceService } from '../space/space.service';

import { AuthGuard } from './auth.module';
import { OIDCClient, OIDCService } from './oidc/oidc.service';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { Unprotected } from './decorators/unprotected.decorator';

const JWT_DUMMY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

/** Controller to test route annotations */
@Controller('dummy')
class DummyController {
  @Get('test')
  async test() {
    return 'hi';
  }

  @Unprotected()
  @Get('open')
  async open() {
    return 'lo';
  }
}

describe('AuthModule integration', () => {
  let key1, key2, key_invalid;
  beforeAll(async () => {
    key1 = await generateKeyPair();
    const pubJWK1 = await jose.exportJWK(key1.public);
    const keys1 = { keys: [pubJWK1] };
    nock('http://localhost/oidc').matchHeader('Accept', 'application/json').get('/jwks').reply(200, keys1);

    key2 = await generateKeyPair();
    const pubJWK2 = await jose.exportJWK(key2.public);
    const keys2 = { keys: [pubJWK2] };
    nock('http://127.0.0.2/oidc').matchHeader('Accept', 'application/json').get('/jwks').reply(200, keys2);

    key_invalid = await generateKeyPair();
  });
  afterAll(() => {
    nock.cleanAll();
  });

  let app: INestApplication;
  let mockUserService: UserService;
  let mockUserSpaceService: UserSpaceService;
  let mockUserTypeService: UserTypeService;
  let mockInvitationService: InvitationService;
  let mockSpaceService: SpaceService;

  beforeEach(async () => {
    mockUserService = createMock<UserService>();
    mockUserSpaceService = createMock<UserSpaceService>();
    mockUserTypeService = createMock<UserTypeService>();
    mockInvitationService = createMock<InvitationService>();
    mockSpaceService = createMock<SpaceService>();
    const module = await Test.createTestingModule({
      imports: [
        // AuthModule, // with .useMocker support, this is horrible (so wait for nest v8.x.y)
        HttpModule,
        JwtModule.register({}),
      ],
      providers: [
        AuthService,
        SpaceService,
        UserService,
        UserSpaceService,
        UserTypeService,
        InvitationService,
        OIDCService,
        {
          provide: APP_GUARD,
          useClass: AuthGuard,
        },
      ],
      controllers: [AuthController, DummyController],
    })
      .overrideProvider(UserService)
      .useValue(mockUserService)
      .overrideProvider(UserSpaceService)
      .useValue(mockUserSpaceService)
      .overrideProvider(UserTypeService)
      .useValue(mockUserTypeService)
      .overrideProvider(InvitationService)
      .useValue(mockInvitationService)
      .overrideProvider(SpaceService)
      .useValue(mockSpaceService)
      .overrideProvider(OIDCService)
      .useFactory({
        factory: async () => {
          const srv = new OIDCService();
          srv.clients = {
            mock: await createMockClient(key1.private),
            alt: await createMockClient(key2.private, 'alt', 'http://127.0.0.2/oidc/jwks'),
          };
          return srv;
        },
      })
      .compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  test('guards routes by default', async () => {
    const srv = app.getHttpServer();
    await request(srv).get('/dummy/test').expect(403);
    await request(srv).get('/dummy/test').set('Authorization', 'Bearer foo.bar.baz').expect(403);
    await request(srv).get('/dummy/test').set('Authorization', `Bearer ${JWT_DUMMY}`).expect(403);
    const expiredJWT = generateMockJWT(key1, { exp: 42 });
    await request(srv).get('/dummy/test').set('Authorization', `Bearer ${expiredJWT}`).expect(403);
    const invalidJWT = generateMockJWT(key_invalid);
    await request(srv).get('/dummy/test').set('Authorization', `Bearer ${invalidJWT}`).expect(403);

    // good cases:
    const validJWT = generateMockJWT(key1);
    await request(srv).get('/dummy/test').set('Authorization', `Bearer ${validJWT}`).expect(200);

    const validJWTAlt = generateMockJWT(key2, { iss: 'alt' });
    await request(srv).get('/dummy/test').set('Authorization', `Bearer ${validJWTAlt}`).expect(200);
  });

  test('@Unprotected decorator', async () => {
    const srv = app.getHttpServer();
    await request(srv).get('/dummy/open').expect(200);
  });
});

async function generateKeyPair() {
  const { publicKey, privateKey } = await jose.generateKeyPair('RS256');
  return { public: publicKey, private: privateKey };
}

async function createMockClient(privateKey, issuerName = 'mock', jwksUri = 'http://localhost/oidc/jwks') {
  const privateJWK = await jose.exportJWK(privateKey);

  const issuer = new Issuer({
    issuer: issuerName,
    authorization_endpoint: 'http://localhost/oidc/auth',
    jwks_uri: jwksUri,
  });
  const client = new issuer.Client(
    {
      client_id: 'mock-oidc-client',
    },
    { keys: [privateJWK] },
    { additionalAuthorizedParties: 'react-client' },
  );
  return client as unknown as OIDCClient;
}

function generateMockJWT(key, payload = {}) {
  const data = {
    iss: 'mock',
    sub: 'user-id',
    aud: ['mock-oidc-client', 'react-client'],
    azp: 'react-client',
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
    ...payload,
  };
  const token = jwt.sign(data, key.private, { algorithm: 'RS256' });
  return token;
}
