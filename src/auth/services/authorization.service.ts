import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { UserRole } from '../types/user-role.js';

type RegistroRol = { id: string };

@Injectable()
export class AuthorizationService {
  private readonly supabase: SupabaseClient;

  constructor(servicioConfiguracion: ConfigService) {
    const urlSupabase = servicioConfiguracion.get<string>('SUPABASE_URL');
    const serviceRolKey = servicioConfiguracion.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );

    if (!urlSupabase || !serviceRolKey) {
      throw new Error(
        'SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar configuradas',
      );
    }

    this.supabase = createClient(urlSupabase, serviceRolKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  async usuarioTieneRol(
    usuarioId: string,
    organizacionId: string,
    rolesRequeridos: readonly UserRole[],
  ): Promise<boolean> {
    const { data: datos, error: errorSupabase } = await this.supabase
      .from('miembros_organizacion')
      .select('rol:roles!inner(nombre)')
      .eq('usuario_id', usuarioId)
      .eq('organizacion_id', organizacionId)
      .in('roles.nombre', [...rolesRequeridos])
      .limit(1);

    if (errorSupabase) {
      throw new InternalServerErrorException(
        'No se pudieron verificar los permisos',
      );
    }

    return datos.length > 0;
  }

  async usuarioTienePermisos(
    usuarioId: string,
    organizacionId: string,
    permisosRequeridos: readonly string[],
  ): Promise<boolean> {
    const { data: datosMembresia, error: errorMembresia } = await this.supabase
      .from('miembros_organizacion')
      .select('rol_id')
      .eq('usuario_id', usuarioId)
      .eq('organizacion_id', organizacionId);

    if (errorMembresia) {
      throw new InternalServerErrorException(
        'No se pudieron consultar los permisos del usuario',
      );
    }

    const idsRol = datosMembresia.map((registro) => registro.rol_id);
    if (!idsRol.length) {
      return false;
    }

    const { data: datosRolPermiso, error: errorRolPermiso } =
      await this.supabase
        .from('roles_permisos')
        .select('permiso_id')
        .in('rol_id', idsRol);

    if (errorRolPermiso) {
      throw new InternalServerErrorException(
        'No se pudieron consultar las relaciones de permisos',
      );
    }

    const idsPermiso = datosRolPermiso.map((registro) => registro.permiso_id);
    if (!idsPermiso.length) {
      return false;
    }

    const { data: datosPermiso, error: errorPermiso } = await this.supabase
      .from('permisos')
      .select('nombre')
      .in('id', idsPermiso);

    if (errorPermiso) {
      throw new InternalServerErrorException(
        'No se pudieron consultar los permisos',
      );
    }

    const nombresPermiso = new Set(
      datosPermiso.map((registro) => registro.nombre),
    );
    return permisosRequeridos.every((permiso) => nombresPermiso.has(permiso));
  }

  async obtenerOrganizacionDelUsuario(usuarioId: string): Promise<string> {
    const { data, error } = await this.supabase
      .from('miembros_organizacion')
      .select('organizacion_id')
      .eq('usuario_id', usuarioId)
      .limit(2);

    if (error) {
      throw new InternalServerErrorException(
        'No se pudo obtener la organización del usuario',
      );
    }

    const organizaciones = [
      ...new Set(data.map((registro) => registro.organizacion_id)),
    ];

    if (organizaciones.length === 0) {
      throw new ForbiddenException(
        'El usuario no pertenece a ninguna organización',
      );
    }

    if (organizaciones.length > 1) {
      throw new ForbiddenException(
        'El usuario pertenece a más de una organización',
      );
    }

    return organizaciones[0];
  }

  async asignarRol(
    usuarioActorId: string,
    usuarioObjetivoId: string,
    organizacionId: string,
    rol: UserRole,
  ): Promise<void> {
    await this.comprobarGestionDeRoles(usuarioActorId, organizacionId);

    const { data: registroRol, error: errorRol } = await this.supabase
      .from('roles')
      .select('id')
      .eq('nombre', rol)
      .single<RegistroRol>();

    if (errorRol || !registroRol) {
      throw new NotFoundException('Rol no encontrado');
    }

    const { error: errorActualizacion } = await this.supabase
      .from('miembros_organizacion')
      .upsert(
        {
          usuario_id: usuarioObjetivoId,
          organizacion_id: organizacionId,
          rol_id: registroRol.id,
        },
        { onConflict: 'organizacion_id,usuario_id' },
      );

    if (errorActualizacion) {
      throw new InternalServerErrorException('No se pudo asignar el rol');
    }
  }

  async asignarPermisoARol(
      usuarioActorId: string,
      organizacionId: string,
      rolId: string,
      permisoId: string,
    ): Promise<void> {
      await this.comprobarGestionDeRoles(usuarioActorId, organizacionId);
      await this.comprobarRegistroExistente('roles', rolId, 'Rol no encontrado');
      await this.comprobarRegistroExistente(
        'permisos',
        permisoId,
        'Permiso no encontrado',
      );

      const { error } = await this.supabase.from('roles_permisos').upsert(
        { rol_id: rolId, permiso_id: permisoId },
        { onConflict: 'rol_id,permiso_id' },
      );

      if (error) {
        throw new InternalServerErrorException(
          'No se pudo asignar el permiso al rol',
        );
      }
    }

  async retirarPermisoDeRol(
      usuarioActorId: string,
      organizacionId: string,
      rolId: string,
      permisoId: string,
    ): Promise<void> {
      await this.comprobarGestionDeRoles(usuarioActorId, organizacionId);

      const { error } = await this.supabase
        .from('roles_permisos')
        .delete()
        .eq('rol_id', rolId)
        .eq('permiso_id', permisoId);

      if (error) {
        throw new InternalServerErrorException(
          'No se pudo retirar el permiso del rol',
        );
      }
    }

  private async comprobarGestionDeRoles(
      usuarioId: string,
      organizacionId: string,
    ): Promise<void> {
      const puedeGestionar = await this.usuarioTienePermisos(
        usuarioId,
        organizacionId,
        ['roles:gestionar'],
      );

      if (!puedeGestionar) {
        throw new ForbiddenException('Se requiere el permiso roles:gestionar');
      }
    }

  private async comprobarRegistroExistente(
      tabla: 'roles' | 'permisos',
      id: string,
      mensaje: string,
    ): Promise<void> {
      const { data, error } = await this.supabase
        .from(tabla)
        .select('id')
        .eq('id', id)
        .maybeSingle();

      if (error || !data) {
        throw new NotFoundException(mensaje);
      }
  }
}
