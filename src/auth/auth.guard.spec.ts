import { createMock } from '@golevelup/ts-jest';
import { ExecutionContext } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { AuthGuard } from './auth.guard';
import { OIDCService } from './oidc/oidc.service';

describe('AuthGuard', () => {
  let authGuard: AuthGuard;
  let oidcService: OIDCService;
  let reflector: Reflector;

  beforeEach(async () => {
    oidcService = createMock<OIDCService>();
    reflector = createMock<Reflector>({
      getAllAndOverride: () => false,
    });
    authGuard = new AuthGuard(reflector, oidcService);
  });
  describe('no authorization header', () => {
    let mockContext;
    beforeEach(() => {
      mockContext = mockHttpContext({ headers: {} });
    });

    it('should return false', async () => {
      const result = await authGuard.canActivate(mockContext);
      expect(result).toBe(false);
    });
  });

  describe('invalid authorization header', () => {
    let mockContext;
    beforeEach(async () => {
      mockContext = mockHttpContext({
        headers: { authorization: 'foobar' },
      });
    });
    it('should return false', async () => {
      const result = await authGuard.canActivate(mockContext);
      expect(result).toBe(false);
    });
  });
  describe('invalid JWT token', () => {
    let mockContext;
    beforeEach(async () => {
      mockContext = mockHttpContext({
        headers: { authorization: 'Bearer foobar' },
      });
      oidcService.validateJWT = async () => false;
    });
    it('should return false', async () => {
      const result = await authGuard.canActivate(mockContext);
      expect(result).toBe(false);
    });
  });
  describe('valid JWT token', () => {
    let mockContext;
    beforeEach(async () => {
      mockContext = mockHttpContext({
        headers: { authorization: 'Bearer validDummyToken' },
      });
      oidcService.validateJWT = async (token) => {
        if (token === 'validDummyToken') return { header: 'header', payload: 'payload', key: 'key' };
        return false;
      };
    });
    it('should return false', async () => {
      const result = await authGuard.canActivate(mockContext);
      expect(result).toBe(true);
      expect(mockContext.switchToHttp().getRequest().user).toBe('payload');
    });
  });
});

function mockHttpContext(mockRequest) {
  const request = createMock<Request>(mockRequest);
  const httpContext = createMock<HttpArgumentsHost>({
    getRequest: () => request,
  });
  const mockContext = createMock<ExecutionContext>({
    switchToHttp: () => httpContext,
  });
  return mockContext;
}
