import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { User } from '@supabase/supabase-js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { PaymentsService } from './payments.service.js';

@ApiTags('Payments')
@ApiBearerAuth('supabase-jwt')
@Controller('v1/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Roles('admin', 'manager', 'collector')
  @Get()
  @ApiOperation({ summary: 'Obtiene los pagos del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Pagos obtenidos correctamente.' })
  @ApiResponse({ status: 401, description: 'Token ausente o inválido.' })
  @ApiResponse({ status: 403, description: 'Rol sin permisos para pagos.' })
  findMine(@CurrentUser() user: User) {
    return this.paymentsService.findByUser(user.id);
  }
}
