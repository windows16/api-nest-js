import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

export const Permisos = (...permisos: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permisos);
