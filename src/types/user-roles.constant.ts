/**
 * Sistemdeki mevcut roller.
 * Auth servisindeki seed ile senkronize edilmiştir.
 */
export const UserRoles = {
  SUPER_ADMIN: 'role_superadmin_001',
  ADMIN: 'role_admin_002',
  MANAGER: 'role_manager_003',
  USER: 'role_user_004',
} as const;

export type UserRole = typeof UserRoles[keyof typeof UserRoles];
