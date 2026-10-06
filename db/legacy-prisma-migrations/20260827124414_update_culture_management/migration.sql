/*
  Warnings:

  - You are about to drop the column `dateSemis` on the `Culture` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "StatutCulture" AS ENUM ('PLANIFIEE', 'EN_COURS', 'RECOLTEE', 'ABANDONNEE', 'SUPPRIMEE');

-- AlterTable
ALTER TABLE "Culture" DROP COLUMN "dateSemis",
ADD COLUMN     "datePlantation" TIMESTAMP(3),
ADD COLUMN     "datePrevueRecolte" TIMESTAMP(3),
ADD COLUMN     "description" TEXT,
ADD COLUMN     "raisonSuppression" TEXT,
ADD COLUMN     "statut" "StatutCulture" NOT NULL DEFAULT 'PLANIFIEE',
ADD COLUMN     "variete" TEXT;
