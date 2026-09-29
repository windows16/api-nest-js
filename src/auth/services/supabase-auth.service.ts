import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import type { UserRole } from '../types/user-role.js';

@Injectable()
export class SupabaseAuthService {
  private readonly supabase: SupabaseClient;

  constructor(configService: ConfigService) {
    const supabaseUrl = configService.get<string>('SUPABASE_URL');
    const serviceRoleKey = configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured',
      );
    }

    this.supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  async getUserByAccessToken(accessToken: string): Promise<User> {
    const { data, error } = await this.supabase.auth.getUser(accessToken);

    if (error || !data.user) {
      throw error ?? new Error('Supabase did not return an authenticated user');
    }

    return data.user;
  }

  async updateUserRole(userId: string, role: UserRole): Promise<User> {
    const existingUser = await this.supabase.auth.admin.getUserById(userId);
    if (existingUser.error || !existingUser.data.user) {
      throw new NotFoundException('User not found');
    }

    const { data, error } = await this.supabase.auth.admin.updateUserById(
      userId,
      {
        app_metadata: {
          ...existingUser.data.user.app_metadata,
          role,
        },
      },
    );

    if (error || !data.user) {
      throw new InternalServerErrorException('Unable to update user role');
    }

    return data.user;
  }
}
