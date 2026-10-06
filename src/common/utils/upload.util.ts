import { BadRequestException } from '@nestjs/common';
import { extname } from 'path';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';

export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 Mo

/**
 * Configuration multer partagée par tous les endpoints d'upload.
 * Les fichiers sont stockés dans `./uploads/<folder>` et seules des
 * extensions d'image sont acceptées.
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
      if (!ALLOWED_IMAGE_EXTENSIONS.includes(extension)) {
        return callback(
          new BadRequestException(
            'Format d’image non autorisé. Formats acceptés : JPG, JPEG, PNG, WEBP',
          ),
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
    throw new BadRequestException('L’URL de la photo est obligatoire');
  }

  if (/^https?:\/\//i.test(url)) {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new BadRequestException('URL de photo invalide');
    }

    if (parsed.pathname.startsWith(expectedPrefix)) {
      const filename = parsed.pathname.slice(expectedPrefix.length).trim();
      if (!filename) {
        throw new BadRequestException('Le nom du fichier photo est manquant');
      }
      return `${expectedPrefix}${filename}`;
    }

    return url;
  }

  if (url.startsWith(expectedPrefix)) {
    const filename = url.slice(expectedPrefix.length).trim();
    if (!filename) {
      throw new BadRequestException('Le nom du fichier photo est manquant');
    }
    return `${expectedPrefix}${filename}`;
  }

  throw new BadRequestException(
    `La photo doit utiliser un chemin ${expectedPrefix}... ou une URL externe valide`,
  );
}
