import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { USER_ROLES, type UserRole } from '../../auth/types/user-role.js';

export class UpdateUserRoleDto {
  @ApiProperty({
    enum: USER_ROLES,
    example: 'collector',
    description: 'Rol de aplicación que se asignará al usuario.',
  })
  @IsIn([...USER_ROLES])
  role!: UserRole;
}
