/**
 * NestJS controller method decorator to mark a resource to not need authentication.
 *
 * Default policy in this project is the require authentication.
 * Apply this decorator to skip this.
 *
 * @see auth/auth.guard.ts
 */

import { applyDecorators, SetMetadata } from '@nestjs/common';

export const UNPROTECTED = 'momentum-unprotected';

export function Unprotected() {
  return applyDecorators(SetMetadata(UNPROTECTED, true));
}
