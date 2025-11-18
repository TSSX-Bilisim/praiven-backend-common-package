import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { RequestUser } from '../auth/types/request-user.type';

/**
 * API Gateway tarafından eklenen 'x-user-id', 'x-user-role' ve 'x-user-is-system'
 * başlıklarını okur, bir 'RequestUser' nesnesine dönüştürür ve döndürür.
 *
 * @example @CurrentUser() user: RequestUser
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): RequestUser => {
    const request = ctx.switchToHttp().getRequest<Request>();

    // 1. Üç ayrı başlığı oku
    const userId = request.headers['x-user-id'] as string;
    const roleId = request.headers['x-user-roleid'] as string;
    const departmentId = request.headers['x-user-departmentid'] as string;

    // 2. Başlıkların varlığını kontrol et
    if (!userId || !roleId || !departmentId) {
      throw new UnauthorizedException(
        'Gerekli kullanıcı başlıkları (x-user-id, x-user-roleid, x-user-departmentid) eksik. Gateway yapılandırmasını kontrol edin.',
      );
    }

    try {
      return {
        userId: userId,
        roleId: roleId,
        departmentId: departmentId,
      };
    } catch (error: any) {
      // 3a veya 3b'deki bir hata buraya düşer
      throw new InternalServerErrorException(
        'Kullanıcı başlıkları parse edilemedi veya yapısal olarak bozuk.',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        error,
      );
    }
  },
);
