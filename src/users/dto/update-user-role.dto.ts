import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { USER_ROLES, type UserRole } from '../../auth/types/user-role.js';

export class UpdateUserRoleDto {
  @ApiProperty({
    enum: USER_ROLES,
    example: 'cobrador',
    description: 'Rol de aplicación que se asignará al usuario.',
    name: 'rol',
  })
  @IsIn([...USER_ROLES])
  rol!: UserRole;
}
