import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest } from '../guards/supabase-auth.guard.js';

export const CurrentOrganization = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const solicitud =
      context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!solicitud.organizacionId) {
      throw new Error('No se encontró la organización del usuario autenticado');
    }

    return solicitud.organizacionId;
  },
);
