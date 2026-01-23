import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ROLES_KEY } from './roles.decorator';

/**
 * Rollere dayalı yetkilendirme guard'u.
 * Controller veya handler üzerinde @Roles() decorator'u ile tanımlanan
 * rolleri kontrol eder ve kullanıcının rolü eşleşmiyorsa erişimi engeller.
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
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Eğer rol tanımı yoksa, erişime izin ver
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const userRoleId = request.headers['x-user-roleid'] as string;

    // Rol bilgisi yoksa erişimi reddet
    if (!userRoleId) {
      throw new ForbiddenException(
        'Kullanıcı rol bilgisi bulunamadı.',
      );
    }

    // Kullanıcının rolü gerekli roller arasında mı kontrol et
    const hasRequiredRole = requiredRoles.includes(userRoleId);

    if (!hasRequiredRole) {
      throw new ForbiddenException(
        'Bu işlem için gerekli yetkiniz bulunmamaktadır.',
      );
    }

    return true;
  }
}
