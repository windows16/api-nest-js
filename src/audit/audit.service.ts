import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service.js';

type RegistroAuditoria = {
  id: string;
  organizacion_id: string | null;
  usuario_id: string | null;
  accion: string;
  recurso: string;
  recurso_id: string | null;
  detalles: Record<string, unknown>;
  creado_en: string;
};

export type DatosRegistroAuditoria = {
  usuarioId: string;
  organizacionId: string;
  accion: string;
  recurso: string;
  recursoId?: string;
  detalles?: Record<string, unknown>;
};

@Injectable()
export class AuditService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async registrar(datos: DatosRegistroAuditoria): Promise<void> {
    const { error } = await this.supabaseService.cliente
      .from('registros_auditoria')
      .insert({
        usuario_id: datos.usuarioId,
        organizacion_id: datos.organizacionId,
        accion: datos.accion,
        recurso: datos.recurso,
        recurso_id: datos.recursoId ?? null,
        detalles: datos.detalles ?? {},
      });

    if (error) {
      throw new InternalServerErrorException(
        'No se pudo registrar la operación en auditoría',
      );
    }
  }

  normalizarLimite(valor?: string): number {
    if (valor === undefined) {
      return 50;
    }

    const limite = Number(valor);
    if (!Number.isInteger(limite) || limite < 1 || limite > 100) {
      throw new BadRequestException(
        'El límite debe ser un número entero entre 1 y 100',
      );
    }

    return limite;
  }

  async obtenerRegistros(
    organizacionId: string,
    limite: number,
  ): Promise<RegistroAuditoria[]> {
    const { data, error } = await this.supabaseService.cliente
      .from('registros_auditoria')
      .select(
        'id, organizacion_id, usuario_id, accion, recurso, recurso_id, detalles, creado_en',
      )
      .eq('organizacion_id', organizacionId)
      .order('creado_en', { ascending: false })
      .limit(limite);

    if (error) {
      throw new InternalServerErrorException(
        'No se pudieron obtener los registros de auditoría',
      );
    }

    return data as RegistroAuditoria[];
  }
}
