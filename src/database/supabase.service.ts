import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  readonly cliente: SupabaseClient;

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

    this.cliente = createClient(urlSupabase, claveRolServicio, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
}
