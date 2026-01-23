  import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../types/user-roles.constant';

/**
 * Controller veya handler'ın erişimi için gerekli rolleri tanımlar.
 * RolesGuard ile birlikte kullanılır.
 *
 * @example
 * import { UserRoles } from '@tssx-bilisim/praiven-backend-common-package';
 *
 * @Roles(UserRoles.ADMIN, UserRoles.SUPER_ADMIN)
 * @Get('protected')
 * async protectedRoute() { ... }
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
