import { Injectable } from '@nestjs/common';

@Injectable()
export class PaymentsService {
  buscarPorUsuario(usuarioId: string, organizacionId: string) {
    return {
      usuarioId,
      organizacionId,
      pagos: [],
    };
  }
}
