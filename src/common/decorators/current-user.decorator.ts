import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthenticatedUser {
  id: string;
  nom: string;
  prenom: string | null;
  email: string;
  telephone: string | null;
  role: string;
}

/**
 * Injecte l'utilisateur authentifié (résolu par la stratégie JWT).
 * Usage : `@CurrentUser() user: AuthenticatedUser`
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user: AuthenticatedUser }>();
    return request.user;
  },
);
