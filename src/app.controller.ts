import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/decorators/public.decorator.js';

@Controller()
export class AppController {
  @Get('v1/health')
  @Public()
  getHealth() {
    return { status: 'ok' };
  }
}
