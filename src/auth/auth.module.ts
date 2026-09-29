import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './guards/roles.guard.js';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard.js';
import { SupabaseAuthService } from './services/supabase-auth.service.js';

@Global()
@Module({
  providers: [
    SupabaseAuthService,
    {
      provide: APP_GUARD,
      useClass: SupabaseAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [SupabaseAuthService],
})
export class AuthModule {}
