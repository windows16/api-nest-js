import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

@Injectable()
export class SupabaseAuthService {
  private readonly supabase: SupabaseClient;

  constructor(servicioConfiguracion: ConfigService) {
    const urlSupabase = servicioConfiguracion.get<string>('SUPABASE_URL');
    const claveRolServicio = servicioConfiguracion.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );

    if (!urlSupabase || !claveRolServicio) {
      throw new Error(
        'SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar configuradas',
      );
    }

    this.supabase = createClient(urlSupabase, claveRolServicio, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  async obtenerUsuarioPorToken(tokenAcceso: string): Promise<User> {
    const { data: datos, error: errorSupabase } =
      await this.supabase.auth.getUser(tokenAcceso);

    if (errorSupabase || !datos.user) {
      throw errorSupabase ?? new Error('Supabase no devolvió un usuario autenticado');
    }

    return datos.user;
  }
}
