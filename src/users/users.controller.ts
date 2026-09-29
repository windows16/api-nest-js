import { Controller, Get, Param, Patch, ParseUUIDPipe, Body } from '@nestjs/common';
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
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UpdateUserRoleDto } from './dto/update-user-role.dto.js';
import { UsersService } from './users.service.js';

@ApiTags('Users')
@ApiBearerAuth('supabase-jwt')
@Controller('v1')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Obtiene el perfil del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil del usuario autenticado.' })
  @ApiResponse({ status: 401, description: 'Token ausente o inválido.' })
  getProfile(@CurrentUser() user: User) {
    return this.usersService.getProfile(user);
  }

  @Roles('admin')
  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Actualiza el rol de un usuario' })
  @ApiParam({
    name: 'id',
    description: 'UUID del usuario objetivo.',
    format: 'uuid',
  })
  @ApiBody({ type: UpdateUserRoleDto })
  @ApiResponse({ status: 200, description: 'Rol actualizado correctamente.' })
  @ApiResponse({ status: 400, description: 'UUID o rol inválido.' })
  @ApiResponse({ status: 401, description: 'Token ausente o inválido.' })
  @ApiResponse({ status: 403, description: 'El usuario no es administrador.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  updateRole(
    @Param('id', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.usersService.updateRole(userId, dto.role);
  }
}
