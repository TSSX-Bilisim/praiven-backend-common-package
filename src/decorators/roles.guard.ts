import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ROLES_KEY } from './roles.decorator';
import { UserRoles, UserRole } from '../types/user-roles.constant';

/**
 * Rol hiyerarşisi: user < manager < admin < super_admin
 * Daha yüksek seviyeli roller, düşük seviyeli rollerin yetkilerine de sahiptir.
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRoles.USER]: 1,
  [UserRoles.MANAGER]: 2,
  [UserRoles.ADMIN]: 3,
  [UserRoles.SUPER_ADMIN]: 4,
};

/**
 * Rollere dayalı yetkilendirme guard'u.
 * Controller veya handler üzerinde @Roles() decorator'u ile tanımlanan
 * rolleri kontrol eder ve kullanıcının rolü yetersizse erişimi engeller.
 *
 * Rol Hiyerarşisi: user < manager < admin < super_admin
 * Belirtilen rol, minimum gereksinim olarak çalışır.
 * Örneğin @Roles(UserRoles.MANAGER) kullanıldığında:
 * - USER: Erişim YOK
 * - MANAGER: Erişim VAR
 * - ADMIN: Erişim VAR
 * - SUPER_ADMIN: Erişim VAR
 *
 * @example
 * // AppModule veya ilgili modülde global olarak kullanım:
 * {
 *   provide: APP_GUARD,
 *   useClass: RolesGuard,
 * }
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Handler ve class düzeyinde tanımlı rolleri al
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Eğer rol tanımı yoksa, erişime izin ver
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const userRoleId = request.headers['x-user-roleid'] as UserRole;

    // Rol bilgisi yoksa erişimi reddet
    if (!userRoleId) {
      throw new ForbiddenException(
        'Kullanıcı rol bilgisi bulunamadı.',
      );
    }

    // Kullanıcının rol seviyesini al
    const userRoleLevel = ROLE_HIERARCHY[userRoleId];

    // Kullanıcının rol seviyesi tanımlı değilse erişimi reddet
    if (userRoleLevel === undefined) {
      throw new ForbiddenException(
        'Geçersiz kullanıcı rolü.',
      );
    }

    // Gereken minimum rol seviyesini bul (en düşük seviyeli rol)
    const minimumRequiredLevel = Math.min(
      ...requiredRoles.map((role) => ROLE_HIERARCHY[role] ?? Infinity),
    );

    // Kullanıcının rolü yeterli mi kontrol et (hiyerarşik karşılaştırma)
    const hasRequiredRole = userRoleLevel >= minimumRequiredLevel;

    if (!hasRequiredRole) {
      throw new ForbiddenException(
        'Bu işlem için gerekli yetkiniz bulunmamaktadır.',
      );
    }

    return true;
  }
}
