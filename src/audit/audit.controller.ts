import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentOrganization } from '../auth/decorators/current-organization.decorator.js';
import { Permisos } from '../auth/decorators/permissions.decorator.js';
import { AuditService } from './audit.service.js';

@ApiTags('Auditoría')
@ApiBearerAuth('supabase-jwt')
@Controller('v1/auditoria')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Permisos('auditoria:leer')
  @ApiOperation({
    summary: 'Obtiene los registros de auditoría de la organización',
    description:
      'La organización se resuelve automáticamente a partir de la membresía del usuario autenticado.',
  })
  @ApiQuery({
    name: 'limite',
    required: false,
    type: Number,
    description: 'Cantidad máxima de registros. Entre 1 y 100.',
    example: 50,
  })
  @ApiResponse({ status: 200, description: 'Registros obtenidos correctamente.' })
  @ApiResponse({ status: 401, description: 'Token ausente o inválido.' })
  @ApiResponse({ status: 403, description: 'Permiso de auditoría insuficiente.' })
  obtenerRegistros(
    @CurrentOrganization() organizacionId: string,
    @Query('limite') limite?: string,
  ) {
    const limiteNormalizado = this.auditService.normalizarLimite(limite);
    return this.auditService.obtenerRegistros(organizacionId, limiteNormalizado);
  }
}
