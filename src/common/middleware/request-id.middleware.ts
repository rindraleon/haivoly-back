import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

/**
 * Ajoute un identifiant de requête (repris de l'en-tête s'il existe)
 * afin de pouvoir corréler logs et erreurs.
 */
export function requestIdMiddleware(
  req: Request & { requestId?: string },
  res: Response,
  next: NextFunction,
): void {
  const incoming = req.headers['x-request-id'];
  const requestId =
    typeof incoming === 'string' && incoming.length > 0
      ? incoming
      : randomUUID();

  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
}
