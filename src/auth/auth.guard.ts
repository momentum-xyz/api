import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UNPROTECTED } from './decorators/unprotected.decorator';
import { OIDCService } from './oidc/oidc.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly oidcService: OIDCService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isUnprotected = this.reflector.getAllAndOverride<boolean>(UNPROTECTED, [context.getHandler()]);
    if (isUnprotected) {
      return true;
    }

    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();
    const token = bearerToken(request.headers);
    if (token) {
      const result = await this.oidcService.validateJWT(token);
      if (result && result.key) {
        // TODO: check result.key?
        const introspectResult = await this.oidcService.introspect(token);

        if (!introspectResult.active) {
          console.debug('Token inactive');
          throw new UnauthorizedException();
        }

        request.user = result.payload;
        return true;
      }
    }

    throw new UnauthorizedException();
  }
}

function bearerToken(headers: { [key: string]: string }): string | undefined {
  if (headers && headers.authorization) {
    const [type, code] = headers.authorization.split(' ');
    if (type.toLowerCase() == 'bearer') {
      return code;
    }
  }
}
