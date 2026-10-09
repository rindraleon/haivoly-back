import { HttpStatus, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { ApiException } from '../../common/errors/api-error';
import { ErrorCode } from '../../common/errors/error-codes';

/** Texte exploitable extrait de l'information fournie par `passport-jwt`. */
function infoTexte(info: unknown): string {
  if (typeof info === 'string') return info;
  if (info instanceof Error) return `${info.name} ${info.message}`;
  return '';
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = unknown>(
    err: unknown,
    user: unknown,
    info: unknown,
  ): TUser {
    const texte = infoTexte(info);
    const absent = !info || /no\s*auth\s*token/i.test(texte);
    const expire = /TokenExpiredError|jwt expired/i.test(texte);

    if (err || !user) {
      if (!absent && expire) {
        throw new ApiException(
          ErrorCode.AUTH_SESSION_EXPIRED,
          'Votre session a expiré. Veuillez vous reconnecter.',
          HttpStatus.UNAUTHORIZED,
        );
      }

      throw new ApiException(
        ErrorCode.AUTH_UNAUTHORIZED,
        absent
          ? 'Vous devez être connecté pour accéder à cette ressource.'
          : 'Votre session n’est plus valide. Veuillez vous reconnecter.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return user as TUser;
  }
}
