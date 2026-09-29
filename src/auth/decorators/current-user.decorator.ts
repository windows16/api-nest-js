import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { User } from '@supabase/supabase-js';
import type { AuthenticatedRequest } from '../guards/supabase-auth.guard.js';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): User => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.user) {
      throw new Error('Authenticated user was not found');
    }

    return request.user;
  },
);
