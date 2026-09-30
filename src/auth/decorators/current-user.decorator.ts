import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { User } from '@supabase/supabase-js';
import type { AuthenticatedRequest } from '../guards/supabase-auth.guard.js';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): User => {
    const solicitud =
      context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!solicitud.user) {
      throw new Error('No se encontró el usuario autenticado');
    }

    return solicitud.user;
  },
);
