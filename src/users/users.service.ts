import { Injectable } from '@nestjs/common';
import type { User } from '@supabase/supabase-js';
import { SupabaseAuthService } from '../auth/services/supabase-auth.service.js';
import type { UserRole } from '../auth/types/user-role.js';

@Injectable()
export class UsersService {
  constructor(private readonly supabaseAuthService: SupabaseAuthService) {}

  getProfile(user: User) {
    return { user };
  }

  updateRole(userId: string, role: UserRole) {
    return this.supabaseAuthService.updateUserRole(userId, role);
  }
}
