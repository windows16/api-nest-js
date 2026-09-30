import { Injectable } from '@nestjs/common';
import type { User } from '@supabase/supabase-js';
import { SupabaseService } from '../../database/supabase.service.js';

@Injectable()
export class SupabaseAuthService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async obtenerUsuarioPorToken(tokenAcceso: string): Promise<User> {
    const { data: datos, error: errorSupabase } =
      await this.supabaseService.cliente.auth.getUser(tokenAcceso);

    if (errorSupabase || !datos.user) {
      throw errorSupabase ?? new Error('Supabase no devolvió un usuario autenticado');
    }

    return datos.user;
  }
}
