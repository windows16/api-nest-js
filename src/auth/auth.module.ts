import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuditModule } from '../audit/audit.module.js';
import { PermissionsGuard } from './guards/permissions.guard.js';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard.js';
import { SupabaseAuthService } from './services/supabase-auth.service.js';
import { AuthorizationService } from './services/authorization.service.js';

@Global()
@Module({
  imports: [AuditModule],
  providers: [
    SupabaseAuthService,
    AuthorizationService,
    {
      provide: APP_GUARD,
      useClass: SupabaseAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
  exports: [SupabaseAuthService, AuthorizationService],
})
export class AuthModule {}
