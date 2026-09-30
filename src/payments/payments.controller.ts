import { Controller, Get, Headers } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { User } from '@supabase/supabase-js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Permisos } from '../auth/decorators/permissions.decorator.js';
import { PaymentsService } from './payments.service.js';

@ApiTags('Pagos')
@ApiBearerAuth('supabase-jwt')
@Controller('v1/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Permisos('pagos:leer')
  @Get()
  @ApiOperation({
    summary: 'Obtiene los pagos del usuario autenticado',
    description: 'Requiere el permiso pagos:leer.',
  })
  @ApiHeader({
    name: 'X-Organizacion-Id',
    required: true,
    description: 'UUID de la organización que se desea consultar.',
  })
  @ApiResponse({ status: 200, description: 'Pagos obtenidos correctamente.' })
  @ApiResponse({ status: 401, description: 'Token ausente o inválido.' })
  @ApiResponse({ status: 403, description: 'El rol no tiene permisos para consultar pagos.' })
  buscarPropios(
    @CurrentUser() usuario: User,
    @Headers('x-organizacion-id') organizacionId: string,
  ) {
    return this.paymentsService.buscarPorUsuario(usuario.id, organizacionId);
  }
}
