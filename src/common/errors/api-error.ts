/**
 * Exception applicative porteuse d'un **code d'erreur stable**.
 *
 * `HttpException` ne transporte qu'un statut et un message : impossible pour le
 * mobile de distinguer deux situations partageant le même statut (jeton absent
 * vs jeton expiré, par exemple). `ApiException` ajoute le `code` du catalogue
 * `ErrorCode`, que le filtre global recopie tel quel dans la réponse.
 *
 * ```ts
 * throw new ApiException(
 *   ErrorCode.AUTH_SESSION_EXPIRED,
 *   'Votre session a expiré. Veuillez vous reconnecter.',
 *   HttpStatus.UNAUTHORIZED,
 * );
 * ```
 *
 * Le message est **destiné à l'utilisateur final** : français, court, orienté
 * action, sans détail technique.
 */
import { HttpException, HttpStatus } from '@nestjs/common';

import { type ErrorCodeValue } from './error-codes';

export class ApiException extends HttpException {
  constructor(
    code: ErrorCodeValue,
    message: string,
    status: number = HttpStatus.BAD_REQUEST,
  ) {
    super({ code, message, statusCode: status }, status);
  }
}
