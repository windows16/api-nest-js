import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { User } from '@supabase/supabase-js';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import { isUserRole, type UserRole } from '../types/user-role.js';
import type { AuthenticatedRequest } from './supabase-auth.guard.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    const role = this.getUserRole(user);

    if (!role || !requiredRoles.includes(role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }

  private getUserRole(user?: User): UserRole | undefined {
    const role = user?.app_metadata?.role;
    return isUserRole(role) ? role : undefined;
  }
}
