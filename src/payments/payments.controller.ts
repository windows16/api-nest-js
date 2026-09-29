import { Controller, Get } from '@nestjs/common';
import type { User } from '@supabase/supabase-js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { PaymentsService } from './payments.service.js';

@Controller('v1/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Roles('admin', 'manager', 'collector')
  @Get()
  findMine(@CurrentUser() user: User) {
    return this.paymentsService.findByUser(user.id);
  }
}
