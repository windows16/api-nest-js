import { Controller, Get, Param, Patch, ParseUUIDPipe, Body } from '@nestjs/common';
import type { User } from '@supabase/supabase-js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UpdateUserRoleDto } from './dto/update-user-role.dto.js';
import { UsersService } from './users.service.js';

@Controller('v1')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  getProfile(@CurrentUser() user: User) {
    return this.usersService.getProfile(user);
  }

  @Roles('admin')
  @Patch('users/:id/role')
  updateRole(
    @Param('id', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.usersService.updateRole(userId, dto.role);
  }
}
