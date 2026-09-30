import { Injectable } from '@nestjs/common';
import type { User } from '@supabase/supabase-js';
import { AuthorizationService } from '../auth/services/authorization.service.js';
import type { UserRole } from '../auth/types/user-role.js';

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
}
