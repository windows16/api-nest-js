import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { User } from '@supabase/supabase-js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { CurrentOrganization } from '../auth/decorators/current-organization.decorator.js';
import { Permisos } from '../auth/decorators/permissions.decorator.js';
import { UpdateRolePermissionDto } from './dto/update-role-permission.dto.js';
import { UpdateUserRoleDto } from './dto/update-user-role.dto.js';
import { UsersService } from './users.service.js';

@ApiTags('Usuarios')
@ApiBearerAuth('supabase-jwt')
@Controller('v1')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('/profile')
  @ApiOperation({ summary: 'Obtiene el perfil del usuario autenticado' })
  obtenerPerfil(@CurrentUser() usuario: User) {
    return this.usersService.obtenerPerfil(usuario);
  }

  @Permisos('roles:gestionar')
  @Patch('usuarios/:id/rol')
  @ApiOperation({ summary: 'Actualiza el rol de un usuario' })
  @ApiParam({
    name: 'id',
    description: 'UUID del usuario objetivo.',
    format: 'uuid',
  })
  @ApiBody({ type: UpdateUserRoleDto })
  actualizarRol(
    @Param('id', ParseUUIDPipe) usuarioId: string,
    @CurrentOrganization() organizacionId: string,
    @Body() datosRol: UpdateUserRoleDto,
    @CurrentUser() usuarioActor: User,
  ) {
    return this.usersService.actualizarRol(
      usuarioActor.id,
      usuarioId,
      organizacionId,
      datosRol.rol,
    );
  }

  @Permisos('roles:gestionar')
  @Patch('roles/:rolId/permisos')
  @ApiOperation({ summary: 'Asigna un permiso a un rol' })
  @ApiParam({
    name: 'rolId',
    description: 'UUID del rol.',
    format: 'uuid',
  })
  @ApiBody({ type: UpdateRolePermissionDto })
  @ApiResponse({ status: 204, description: 'Permiso asignado correctamente.' })
  asignarPermiso(
    @Param('rolId', ParseUUIDPipe) rolId: string,
    @CurrentOrganization() organizacionId: string,
    @Body() datosPermiso: UpdateRolePermissionDto,
    @CurrentUser() usuarioActor: User,
  ) {
    return this.usersService.asignarPermiso(
      usuarioActor.id,
      organizacionId,
      rolId,
      datosPermiso.permisoId,
    );
  }

  @Permisos('roles:gestionar')
  @Delete(
    'roles/:rolId/permisos/:permisoId',
  )
  @ApiOperation({ summary: 'Retira un permiso de un rol' })
  @ApiParam({
    name: 'rolId',
    description: 'UUID del rol.',
    format: 'uuid',
  })
  @ApiParam({
    name: 'permisoId',
    description: 'UUID del permiso.',
    format: 'uuid',
  })
  @ApiResponse({ status: 204, description: 'Permiso retirado correctamente.' })
  retirarPermiso(
    @Param('rolId', ParseUUIDPipe) rolId: string,
    @Param('permisoId', ParseUUIDPipe) permisoId: string,
    @CurrentOrganization() organizacionId: string,
    @CurrentUser() usuarioActor: User,
  ) {
    return this.usersService.retirarPermiso(
      usuarioActor.id,
      organizacionId,
      rolId,
      permisoId,
    );
  }
}
