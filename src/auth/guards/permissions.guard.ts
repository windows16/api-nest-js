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

    const organizacionId = this.obtenerOrganizacionId(solicitud);
    if (!organizacionId) {
      throw new ForbiddenException(
        'Se requiere la organización para validar permisos',
      );
    }

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

  private obtenerOrganizacionId(
    solicitud: AuthenticatedRequest,
  ): string | undefined {
    const organizacionDeRuta = solicitud.params?.organizacionId;
    if (typeof organizacionDeRuta === 'string' && organizacionDeRuta) {
      return organizacionDeRuta;
    }

    const organizacionDelEncabezado =
      solicitud.headers['x-organizacion-id'];
    return Array.isArray(organizacionDelEncabezado)
      ? organizacionDelEncabezado[0]
      : organizacionDelEncabezado;
  }
}
