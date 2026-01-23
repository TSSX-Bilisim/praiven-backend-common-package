# Roles Decorator ve RolesGuard Kullanımı

## Genel Bakış

`@Roles` decorator'u ve `RolesGuard`, controller veya handler seviyesinde rol tabanlı yetkilendirme sağlar. Auth servisindeki seed rolleri ile senkronize çalışır.

## Rol Hiyerarşisi

RolesGuard, hiyerarşik bir yapıda çalışır. Belirtilen rol **minimum gereksinim** olarak değerlendirilir:

```
user < manager < admin < super_admin
```

**Önemli:** Daha yüksek seviyeli roller, düşük seviyeli rollerin yetkilerine de sahiptir.

Örneğin `@Roles(UserRoles.MANAGER)` kullanıldığında:
- **USER**: Erişim ❌
- **MANAGER**: Erişim ✅
- **ADMIN**: Erişim ✅
- **SUPER_ADMIN**: Erişim ✅

## Mevcut Roller

```typescript
export const UserRoles = {
  SUPER_ADMIN: 'role_superadmin_001',  // Seviye: 4
  ADMIN: 'role_admin_002',              // Seviye: 3
  MANAGER: 'role_manager_003',          // Seviye: 2
  USER: 'role_user_004',                // Seviye: 1
} as const;
```

## Kurulum

### 1. Backend-common Package Güncelleme

Package.json'da backend-common package versiyonunu güncelleyin:

```bash
pnpm add @tssx-bilisim/praiven-backend-common-package@latest
```

### 2. RolesGuard'u Global Olarak Kaydetme

`app.module.ts` veya ana modül dosyanızda:

```typescript
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from '@tssx-bilisim/praiven-backend-common-package';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
```

## Kullanım Örnekleri

### Örnek 1: Minimum Rol Gereksinimi (Önerilen Kullanım)

```typescript
import { Controller, Get } from '@nestjs/common';
import { Roles, UserRoles } from '@tssx-bilisim/praiven-backend-common-package';

@Controller('admin')
export class AdminController {
  @Roles(UserRoles.MANAGER) // Manager ve üstü erişebilir
  @Get('dashboard')
  getDashboard() {
    return { message: 'Manager, Admin, Super Admin can access' };
  }

  @Roles(UserRoles.ADMIN) // Admin ve üstü erişebilir
  @Get('settings')
  getSettings() {
    return { message: 'Only Admin and Super Admin can access' };
  }

  @Roles(UserRoles.SUPER_ADMIN) // Sadece Super Admin erişebilir
  @Get('system')
  getSystemSettings() {
    return { message: 'Only Super Admin can access' };
  }
}
```

### Örnek 2: Birden Fazla Rol (En Düşük Seviyeli Rol Geçerli Olur)

```typescript
import { Controller, Get } from '@nestjs/common';
import { Roles, UserRoles } from '@tssx-bilisim/praiven-backend-common-package';

@Controller('reports')
export class ReportsController {
  // MANAGER en düşük seviyeli olduğundan, MANAGER ve üstü erişebilir
  @Roles(UserRoles.SUPER_ADMIN, UserRoles.ADMIN, UserRoles.MANAGER)
  @Get('metrics')
  getMetrics() {
    return { message: 'Manager and above can access' };
  }
}
```

### Örnek 3: Controller Seviyesinde Rol

```typescript
import { Controller, Get } from '@nestjs/common';
import { Roles, UserRoles, CurrentUser, RequestUser } from '@tssx-bilisim/praiven-backend-common-package';

@Controller('users')
@Roles(UserRoles.ADMIN) // Tüm endpoint'ler minimum ADMIN rolü gerektirir
export class UsersController {
  @Get()
  getAllUsers() {
    return { message: 'List of users' };
  }

  @Get('profile')
  getProfile(@CurrentUser() user: RequestUser) {
    return { userId: user.userId, roleId: user.roleId };
  }
}
  }
}
```

### Örnek 4: Handler Seviyesinde Override

```typescript
import { Controller, Get, Post } from '@nestjs/common';
import { Roles, UserRoles } from '@tssx-bilisim/praiven-backend-common-package';

@Controller('content')
@Roles(UserRoles.USER) // Controller seviyesinde USER rolü
export class ContentController {
  @Get()
  getContent() {
    // USER rolü ile erişilebilir
    return { message: 'Content list' };
  }

  @Post()
  @Roles(UserRoles.ADMIN, UserRoles.SUPER_ADMIN) // Handler seviyesinde override
  createContent() {
    // Sadece ADMIN veya SUPER_ADMIN erişebilir
    return { message: 'Content created' };
  }
}
```

### Örnek 5: Rol Olmadan (Public Endpoint)

```typescript
import { Controller, Get } from '@nestjs/common';

@Controller('public')
export class PublicController {
  @Get('health')
  healthCheck() {
    // @Roles() decorator'u yoksa herkes erişebilir
    return { status: 'ok' };
  }
}
```

## Hata Mesajları

### 403 Forbidden - Yetkisiz Erişim

```json
{
  "statusCode": 403,
  "message": "Bu işlem için gerekli yetkiniz bulunmamaktadır.",
  "error": "Forbidden"
}
```

### 403 Forbidden - Rol Bilgisi Yok

```json
{
  "statusCode": 403,
  "message": "Kullanıcı rol bilgisi bulunamadı.",
  "error": "Forbidden"
}
```

## Notlar

- `RolesGuard`, Gateway'den gelen `x-user-roleid` header'ını kontrol eder
- Eğer bir endpoint'te `@Roles()` decorator'u yoksa, herkes erişebilir
- Handler seviyesindeki roller, controller seviyesindeki rolleri override eder
- **Hiyerarşik kontrol:** Belirtilen rol, minimum gereksinim olarak değerlendirilir
- Birden fazla rol belirtildiğinde, en düşük seviyeli rol minimum gereksinim olur

## Test Örneği

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { UserRoles } from '@tssx-bilisim/praiven-backend-common-package';

describe('RolesGuard (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('should allow access with correct role', () => {
    return request(app.getHttpServer())
      .get('/admin/settings')
      .set('x-user-id', 'test-user-id')
      .set('x-user-roleid', UserRoles.SUPER_ADMIN)
      .set('x-user-departmentid', 'test-dept-id')
      .expect(HttpStatus.OK);
  });

  it('should deny access with incorrect role', () => {
    return request(app.getHttpServer())
      .get('/admin/settings')
      .set('x-user-id', 'test-user-id')
      .set('x-user-roleid', UserRoles.USER)
      .set('x-user-departmentid', 'test-dept-id')
      .expect(HttpStatus.FORBIDDEN);
  });

  afterAll(async () => {
    await app.close();
  });
});
```
