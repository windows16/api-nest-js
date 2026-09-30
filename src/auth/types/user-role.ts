export const USER_ROLES = [
  'usuario',
  'cobrador',
  'gerente',
  'administrador',
  'auditor',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const isUserRole = (value: unknown): value is UserRole =>
  typeof value === 'string' &&
  USER_ROLES.some((rol) => rol === value);
