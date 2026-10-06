import {
  BadRequestException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { extname } from 'path';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';

import { ErrorCode } from '../errors/error-codes';

export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];
/**
 * Taille maximale d'une image reçue.
 *
 * Le mobile **compresse la photo avant l'envoi** (1920 px de côté maximum,
 * JPEG qualité 0,82 — voir `mobile/src/utils/image.ts`) : une photo de
 * téléphone passe ainsi de 3–8 Mo à 200–600 Ko. La limite serveur reste un
 * garde-fou pour les clients tiers, elle n'est jamais atteinte par l'application.
 */
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 Mo

/**
 * Configuration multer partagée par tous les endpoints d'upload.
 * Les fichiers sont stockés dans `./uploads/<folder>`.
 *
 * Double contrôle : l'**extension** et le **type MIME** déclarés doivent être
 * ceux d'une image. Un fichier renommé `photo.jpg` mais déclaré
 * `application/x-sh` est refusé (415).
 */
export function imageUploadOptions(
  folder: 'observations' | 'interventions' | 'recoltes',
  prefix: string,
): MulterOptions {
  return {
    storage: diskStorage({
      destination: `./uploads/${folder}`,
      filename: (_req, file, callback) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const extension = extname(file.originalname).toLowerCase();
        callback(null, `${prefix}-${uniqueSuffix}${extension}`);
      },
    }),
    limits: { fileSize: MAX_IMAGE_SIZE_BYTES },
    fileFilter: (_req, file, callback) => {
      const extension = extname(file.originalname).toLowerCase();
      const typeMime = (file.mimetype ?? '').toLowerCase();

      if (
        !ALLOWED_IMAGE_EXTENSIONS.includes(extension) ||
        !ALLOWED_IMAGE_MIME_TYPES.includes(typeMime)
      ) {
        return callback(
          new UnsupportedMediaTypeException({
            code: ErrorCode.UNSUPPORTED_MEDIA_TYPE,
            message:
              'Fichier refusé : seules les images JPG, JPEG, PNG et WEBP sont acceptées.',
          }),
          false,
        );
      }

      callback(null, true);
    },
  };
}

/**
 * Normalise l'URL d'une photo :
 *  • URL absolue pointant vers nos uploads → chemin relatif (évite de figer
 *    une adresse IP ou un domaine dans la base) ;
 *  • URL externe → conservée telle quelle ;
 *  • chemin relatif valide → conservé.
 */
export function normalizeUploadUrl(
  value: string | undefined,
  folder: 'observations' | 'interventions' | 'recoltes',
): string {
  const url = value?.trim();
  const expectedPrefix = `/uploads/${folder}/`;

  if (!url) {
    throw new BadRequestException({
      code: ErrorCode.VALIDATION_REQUIRED,
      message: 'L’URL de la photo est obligatoire',
    });
  }

  if (/^https?:\/\//i.test(url)) {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new BadRequestException({
        code: ErrorCode.VALIDATION_INVALID_FORMAT,
        message: 'URL de photo invalide',
      });
    }

    if (parsed.pathname.startsWith(expectedPrefix)) {
      const filename = parsed.pathname.slice(expectedPrefix.length).trim();
      if (!filename) {
        throw new BadRequestException({
          code: ErrorCode.VALIDATION_REQUIRED,
          message: 'Le nom du fichier photo est manquant',
        });
      }
      return `${expectedPrefix}${filename}`;
    }

    return url;
  }

  if (url.startsWith(expectedPrefix)) {
    const filename = url.slice(expectedPrefix.length).trim();
    if (!filename) {
      throw new BadRequestException({
        code: ErrorCode.VALIDATION_REQUIRED,
        message: 'Le nom du fichier photo est manquant',
      });
    }
    return `${expectedPrefix}${filename}`;
  }

  throw new BadRequestException({
    code: ErrorCode.VALIDATION_INVALID_VALUE,
    message: `La photo doit utiliser un chemin ${expectedPrefix}... ou une URL externe valide`,
  });
}
