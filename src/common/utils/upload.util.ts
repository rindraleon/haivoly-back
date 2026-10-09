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
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 Mo

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
