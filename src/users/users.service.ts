import { Injectable } from '@nestjs/common';
import type { User } from '@supabase/supabase-js';
import { AuthorizationService } from '../auth/services/authorization.service.js';
import type { UserRole } from '../auth/types/user-role.js';
import type { CreateRoleDto } from './dto/create-role.dto.js';
import type { UpdateRoleDto } from './dto/update-role.dto.js';

@Injectable()
export class UsersService {
  constructor(private readonly authorizationService: AuthorizationService) {}

  obtenerPerfil(usuario: User) {
    return { usuario };
  }

  actualizarRol(
    usuarioActorId: string,
    usuarioObjetivoId: string,
    organizacionId: string,
    rol: UserRole,
  ) {
    return this.authorizationService.asignarRol(
      usuarioActorId,
      usuarioObjetivoId,
      organizacionId,
      rol,
    );
  }

  asignarPermiso(
    usuarioActorId: string,
    organizacionId: string,
    rolId: string,
    permisoId: string,
  ) {
    return this.authorizationService.asignarPermisoARol(
      usuarioActorId,
      organizacionId,
      rolId,
      permisoId,
    );
  }

  retirarPermiso(
    usuarioActorId: string,
    organizacionId: string,
    rolId: string,
    permisoId: string,
  ) {
    return this.authorizationService.retirarPermisoDeRol(
      usuarioActorId,
      organizacionId,
      rolId,
      permisoId,
    );
  }

  crearRol(usuarioActorId: string, organizacionId: string, datos: CreateRoleDto) {
    return this.authorizationService.crearRol(
      usuarioActorId,
      organizacionId,
      datos.nombre,
      datos.descripcion,
    );
  }

  listarRoles(usuarioActorId: string, organizacionId: string) {
    return this.authorizationService.listarRoles(
      usuarioActorId,
      organizacionId,
    );
  }

  actualizarRolCatalogo(
    usuarioActorId: string,
    organizacionId: string,
    rolId: string,
    datos: UpdateRoleDto,
  ) {
    return this.authorizationService.actualizarRolCatalogo(
      usuarioActorId,
      organizacionId,
      rolId,
      datos.descripcion,
    );
  }

  eliminarRol(usuarioActorId: string, organizacionId: string, rolId: string) {
    return this.authorizationService.eliminarRol(
      usuarioActorId,
      organizacionId,
      rolId,
    );
  }
}
