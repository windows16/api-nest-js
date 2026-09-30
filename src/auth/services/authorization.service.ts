import {
  ForbiddenException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service.js';
import { AuditService } from '../../audit/audit.service.js';
import type { UserRole } from '../types/user-role.js';

type RegistroRol = { id: string };
const ROLES_PROTEGIDOS = new Set([
  'usuario',
  'gerente',
  'administrador',
  'auditor',
]);

@Injectable()
export class AuthorizationService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly auditService: AuditService,
  ) {}

  async usuarioTieneRol(
    usuarioId: string,
    organizacionId: string,
    rolesRequeridos: readonly UserRole[],
  ): Promise<boolean> {
    const { data: datos, error: errorSupabase } = await this.supabaseService.cliente
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
    const { data: datosMembresia, error: errorMembresia } = await this.supabaseService.cliente
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
      await this.supabaseService.cliente
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

    const { data: datosPermiso, error: errorPermiso } = await this.supabaseService.cliente
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
    const { data, error } = await this.supabaseService.cliente
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

    const { data: registroRol, error: errorRol } = await this.supabaseService.cliente
      .from('roles')
      .select('id')
      .eq('nombre', rol)
      .single<RegistroRol>();

    if (errorRol || !registroRol) {
      throw new NotFoundException('Rol no encontrado');
    }

    const { error: errorActualizacion } = await this.supabaseService.cliente
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

    await this.auditService.registrar({
      usuarioId: usuarioActorId,
      organizacionId,
      accion: 'asignar_rol',
      recurso: 'miembros_organizacion',
      recursoId: usuarioObjetivoId,
      detalles: {
        rol,
      },
    });
  }

  async crearRol(
    usuarioActorId: string,
    organizacionId: string,
    nombre: string,
    descripcion?: string,
  ) {
    await this.comprobarGestionDeRoles(usuarioActorId, organizacionId);

    const { data, error } = await this.supabaseService.cliente
      .from('roles')
      .insert({ nombre, descripcion: descripcion ?? null })
      .select('id, nombre, descripcion, creado_en')
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new ConflictException('Ya existe un rol con ese nombre');
      }
      throw new InternalServerErrorException('No se pudo crear el rol');
    }

    await this.auditService.registrar({
      usuarioId: usuarioActorId,
      organizacionId,
      accion: 'crear_rol',
      recurso: 'roles',
      recursoId: data.id,
      detalles: { nombre },
    });

    return data;
  }

  async listarRoles(usuarioActorId: string, organizacionId: string) {
    await this.comprobarGestionDeRoles(usuarioActorId, organizacionId);

    const { data, error } = await this.supabaseService.cliente
      .from('roles')
      .select('id, nombre, descripcion, creado_en')
      .order('nombre', { ascending: true });

    if (error) {
      throw new InternalServerErrorException('No se pudieron obtener los roles');
    }

    return data;
  }

  async actualizarRolCatalogo(
    usuarioActorId: string,
    organizacionId: string,
    rolId: string,
    descripcion?: string,
  ) {
    await this.comprobarGestionDeRoles(usuarioActorId, organizacionId);
    const { data, error } = await this.supabaseService.cliente
      .from('roles')
      .update({ descripcion: descripcion ?? null })
      .eq('id', rolId)
      .select('id, nombre, descripcion, creado_en')
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('No se pudo actualizar el rol');
    }
    if (!data) {
      throw new NotFoundException('Rol no encontrado');
    }

    await this.auditService.registrar({
      usuarioId: usuarioActorId,
      organizacionId,
      accion: 'actualizar_rol',
      recurso: 'roles',
      recursoId: rolId,
      detalles: { descripcion: descripcion ?? null },
    });

    return data;
  }

  async eliminarRol(
    usuarioActorId: string,
    organizacionId: string,
    rolId: string,
  ): Promise<void> {
    await this.comprobarGestionDeRoles(usuarioActorId, organizacionId);

    const { data: rol, error: errorRol } = await this.supabaseService.cliente
      .from('roles')
      .select('id, nombre')
      .eq('id', rolId)
      .maybeSingle();

    if (errorRol) {
      throw new InternalServerErrorException('No se pudo consultar el rol');
    }
    if (!rol) {
      throw new NotFoundException('Rol no encontrado');
    }
    if (ROLES_PROTEGIDOS.has(rol.nombre)) {
      throw new ConflictException('No se puede eliminar un rol del sistema');
    }

    const { count, error: errorMembresias } = await this.supabaseService.cliente
      .from('miembros_organizacion')
      .select('usuario_id', { count: 'exact', head: true })
      .eq('rol_id', rolId);

    if (errorMembresias) {
      throw new InternalServerErrorException(
        'No se pudo comprobar el uso del rol',
      );
    }
    if ((count ?? 0) > 0) {
      throw new ConflictException(
        'No se puede eliminar un rol asignado a usuarios',
      );
    }

    const { error } = await this.supabaseService.cliente
      .from('roles')
      .delete()
      .eq('id', rolId);

    if (error) {
      throw new InternalServerErrorException('No se pudo eliminar el rol');
    }

    await this.auditService.registrar({
      usuarioId: usuarioActorId,
      organizacionId,
      accion: 'eliminar_rol',
      recurso: 'roles',
      recursoId: rolId,
      detalles: { nombre: rol.nombre },
    });
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

      const { error } = await this.supabaseService.cliente.from('roles_permisos').upsert(
        { rol_id: rolId, permiso_id: permisoId },
        { onConflict: 'rol_id,permiso_id' },
      );

      if (error) {
        throw new InternalServerErrorException(
          'No se pudo asignar el permiso al rol',
        );
      }

      await this.auditService.registrar({
        usuarioId: usuarioActorId,
        organizacionId,
        accion: 'asignar_permiso',
        recurso: 'roles_permisos',
        recursoId: rolId,
        detalles: {
          permisoId,
        },
      });
    }

  async retirarPermisoDeRol(
      usuarioActorId: string,
      organizacionId: string,
      rolId: string,
      permisoId: string,
    ): Promise<void> {
      await this.comprobarGestionDeRoles(usuarioActorId, organizacionId);

      const { error } = await this.supabaseService.cliente
        .from('roles_permisos')
        .delete()
        .eq('rol_id', rolId)
        .eq('permiso_id', permisoId);

      if (error) {
        throw new InternalServerErrorException(
          'No se pudo retirar el permiso del rol',
        );
      }

      await this.auditService.registrar({
        usuarioId: usuarioActorId,
        organizacionId,
        accion: 'retirar_permiso',
        recurso: 'roles_permisos',
        recursoId: rolId,
        detalles: {
          permisoId,
        },
      });
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
      const { data, error } = await this.supabaseService.cliente
        .from(tabla)
        .select('id')
        .eq('id', id)
        .maybeSingle();

      if (error || !data) {
        throw new NotFoundException(mensaje);
      }
  }
}
