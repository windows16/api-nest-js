import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator.js';
import { AuthorizationService } from '../services/authorization.service.js';
import type { AuthenticatedRequest } from './supabase-auth.guard.js';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permisosRequeridos = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!permisosRequeridos?.length) {
      return true;
    }

    const solicitud =
      context.switchToHttp().getRequest<AuthenticatedRequest>();
    const usuario = solicitud.user;

    if (!usuario) {
      throw new ForbiddenException('Se requiere un usuario autenticado');
    }

    const organizacionId =
      await this.authorizationService.obtenerOrganizacionDelUsuario(usuario.id);
    solicitud.organizacionId = organizacionId;

    const tienePermisos = await this.authorizationService.usuarioTienePermisos(
      usuario.id,
      organizacionId,
      permisosRequeridos,
    );

    if (!tienePermisos) {
      throw new ForbiddenException('Permisos insuficientes');
    }

    return true;
  }
}
