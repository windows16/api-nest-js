import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { User } from '@supabase/supabase-js';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import { SupabaseAuthService } from '../services/supabase-auth.service.js';

export type AuthenticatedRequest = Request & {
  user?: User;
};

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: SupabaseAuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const [scheme, token, ...extraParts] = authorization?.trim().split(/\s+/) ?? [];

    if (
      scheme?.toLowerCase() !== 'bearer' ||
      !token ||
      extraParts.length > 0
    ) {
      throw new UnauthorizedException('Missing or malformed bearer token');
    }

    try {
      request.user = await this.authService.getUserByAccessToken(token);
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }

    return true;
  }
}
