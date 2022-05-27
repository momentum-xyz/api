import { Test } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';

import { OIDCClient, OIDCService } from './oidc.service';

const JWT_DUMMY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
const JWT_OTHER_ISS =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJmb28iLCJpYXQiOjF9.p53NXkTjppbGO99EDJL_LUAK-xzWrRBR78Fu_VVI1Bo';

const JWT_MOCK =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJtb2NrIiwiaWF0IjoxfQ.mzCOo4TA3sB0ejg-ahAguv4cADz-HIzZDl5-tHBDnoI';
const JWT_MOCK_ALT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJhbHQiLCJpYXQiOjF9.GYpo9R7BeOSw4NOcOp_y0lUwRLewxpC9MMEPQHwDjJw';

describe('OIDCService', () => {
  let oidcService: OIDCService;
  beforeEach(async () => {
    const mockClient = createMock<OIDCClient>({
      validateJWT: async () => {
        return { header: 'header', payload: 'payload', key: 'key' };
      },
      introspect: async () => {
        return { active: true, iss: 'mock', scope: 'foo' };
      },
    });
    const mockAltClient = createMock<OIDCClient>({
      validateJWT: async () => {
        return { header: 'foo', payload: 'bar', key: 'baz' };
      },
      introspect: async () => {
        return { active: true, iss: 'alt', scope: 'bar' };
      },
    });
    const app = await Test.createTestingModule({
      providers: [
        {
          provide: OIDCService,
          useFactory: async () => {
            const srv = new OIDCService();
            //await srv.loadProviders();
            srv.clients = { mock: mockClient, alt: mockAltClient };
            return srv;
          },
        },
      ],
    }).compile();
    oidcService = app.get<OIDCService>(OIDCService);
  });

  test('validateJWT', async () => {
    for (const jwt of [undefined, 'foobar', JWT_DUMMY, JWT_OTHER_ISS]) {
      expect(await oidcService.validateJWT(jwt)).toBeFalsy();
    }
    expect(await oidcService.validateJWT(JWT_MOCK)).toMatchObject({
      header: 'header',
      payload: 'payload',
      key: 'key',
    });
    expect(await oidcService.validateJWT(JWT_MOCK_ALT)).toMatchObject({
      header: 'foo',
      payload: 'bar',
      key: 'baz',
    });
  });

  test('introspect', async () => {
    expect.assertions(2);
    await expect(oidcService.introspect('foobar')).rejects.toEqual(expect.any(Error));

    const result = await oidcService.introspect(JWT_MOCK);
    expect(result).toMatchObject({
      active: true,
      iss: 'mock',
      scope: 'foo',
    });
  });
});
