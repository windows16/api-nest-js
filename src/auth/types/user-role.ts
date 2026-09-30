export type UserRole = string;

export const isUserRole = (value: unknown): value is UserRole =>
  typeof value === 'string' && value.length > 0;
