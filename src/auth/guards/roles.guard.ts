import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import type { UserRole } from '../types/user-role.js';
import type { AuthenticatedRequest } from './supabase-auth.guard.js';
import { AuthorizationService } from '../services/authorization.service.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rolesRequeridos = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!rolesRequeridos?.length) {
      return true;
    }

    const solicitud =
      context.switchToHttp().getRequest<AuthenticatedRequest>();
    const usuario = solicitud.user;
    if (!usuario) {
      throw new ForbiddenException('Se requiere un usuario autenticado');
    }

    const organizacionId = solicitud.headers['x-organizacion-id'];
    const organizacionIdNormalizada = Array.isArray(organizacionId)
      ? organizacionId[0]
      : organizacionId;

    if (!organizacionIdNormalizada) {
      throw new ForbiddenException(
        'Se requiere el encabezado X-Organizacion-Id',
      );
    }

    const tieneRol = await this.authorizationService.usuarioTieneRol(
      usuario.id,
      organizacionIdNormalizada,
      rolesRequeridos,
    );

    if (!tieneRol) {
      throw new ForbiddenException('Permisos insuficientes');
    }

    return true;
  }
}
