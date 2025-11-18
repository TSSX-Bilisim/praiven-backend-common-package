import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUserWs = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const client = ctx.switchToWs().getClient();
    return client.user;
  },
);