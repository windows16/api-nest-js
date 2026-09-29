import { IsIn } from 'class-validator';
import { USER_ROLES, type UserRole } from '../../auth/types/user-role.js';

export class UpdateUserRoleDto {
  @IsIn([...USER_ROLES])
  role!: UserRole;
}
