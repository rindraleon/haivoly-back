import { SetMetadata } from '@nestjs/common';
import type { Role } from '../enums/domain.enums';

export const ROLES_KEY = 'roles';

/** Restreint un endpoint à certains rôles (vérifié côté backend). */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
