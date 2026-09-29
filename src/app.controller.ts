import { Controller, Get, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from './auth/supabase-auth.guard.js';
import { CurrentUser } from './auth/current-user.decorator.js';
import type { User } from '@supabase/supabase-js';

@Controller()
export class AppController {
  @Get('v1/health')
  getHealth() {
    return { status: 'ok' };
  }

  @Get('v1/profile')
  @UseGuards(SupabaseAuthGuard)
  getProfile(@CurrentUser() user: User) {
    return { user };
  }
}
