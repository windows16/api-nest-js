import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from './auth/decorators/public.decorator.js';

@ApiTags('System')
@Controller()
export class AppController {
  @Get('v1/health')
  @Public()
  @ApiOperation({ summary: 'Verifica la disponibilidad de la API' })
  @ApiResponse({ status: 200, description: 'API disponible.' })
  getHealth() {
    return { status: 'ok' };
  }
}
