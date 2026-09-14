-- CreateEnum
CREATE TYPE "StatutParcelle" AS ENUM ('ACTIVE', 'ABANDONNEE', 'ARCHIVEE', 'SUPPRIMEE');

-- AlterTable
ALTER TABLE "Parcelle" ADD COLUMN     "raisonSuppression" TEXT,
ADD COLUMN     "statut" "StatutParcelle" NOT NULL DEFAULT 'ACTIVE';
