import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { User } from '@supabase/supabase-js';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import { SupabaseAuthService } from '../services/supabase-auth.service.js';

export type AuthenticatedRequest = Request & {
  user?: User;
};

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: SupabaseAuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const solicitud =
      context.switchToHttp().getRequest<AuthenticatedRequest>();
    const autorizacion = solicitud.headers.authorization;
    const [esquema, token, ...partesAdicionales] =
      autorizacion?.trim().split(/\s+/) ?? [];

    if (
      esquema?.toLowerCase() !== 'bearer' ||
      !token ||
      partesAdicionales.length > 0
    ) {
      throw new UnauthorizedException('Token Bearer ausente o mal formado');
    }

    try {
      solicitud.user = await this.authService.obtenerUsuarioPorToken(token);
    } catch {
      throw new UnauthorizedException('Token de acceso inválido');
    }

    return true;
  }
}
