/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Intervention` table. All the data in the column will be lost.
  - The `role` column on the `Utilisateur` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `modifieA` to the `Culture` table without a default value. This is not possible if the table is not empty.
  - Added the required column `modifieA` to the `Intervention` table without a default value. This is not possible if the table is not empty.
  - Added the required column `modifieA` to the `Observation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `modifieA` to the `Parcelle` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('AGRICULTEUR', 'PROPRIETAIRE');

-- DropForeignKey
ALTER TABLE "Culture" DROP CONSTRAINT "Culture_parcelleId_fkey";

-- DropForeignKey
ALTER TABLE "Intervention" DROP CONSTRAINT "Intervention_cultureId_fkey";

-- DropForeignKey
ALTER TABLE "Observation" DROP CONSTRAINT "Observation_cultureId_fkey";

-- DropForeignKey
ALTER TABLE "Parcelle" DROP CONSTRAINT "Parcelle_utilisateurId_fkey";

-- AlterTable
ALTER TABLE "Culture" ADD COLUMN     "modifieA" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Intervention" DROP COLUMN "createdAt",
ADD COLUMN     "creeA" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "modifieA" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "date" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Observation" ADD COLUMN     "modifieA" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Parcelle" ADD COLUMN     "description" TEXT,
ADD COLUMN     "modifieA" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "latitude" DROP NOT NULL,
ALTER COLUMN "longitude" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Utilisateur" DROP COLUMN "role",
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'AGRICULTEUR';

-- CreateTable
CREATE TABLE "PointGPS" (
    "id" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "parcelleId" TEXT NOT NULL,

    CONSTRAINT "PointGPS_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "dateAjout" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observationId" TEXT NOT NULL,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Parcelle" ADD CONSTRAINT "Parcelle_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Culture" ADD CONSTRAINT "Culture_parcelleId_fkey" FOREIGN KEY ("parcelleId") REFERENCES "Parcelle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Intervention" ADD CONSTRAINT "Intervention_cultureId_fkey" FOREIGN KEY ("cultureId") REFERENCES "Culture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_cultureId_fkey" FOREIGN KEY ("cultureId") REFERENCES "Culture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointGPS" ADD CONSTRAINT "PointGPS_parcelleId_fkey" FOREIGN KEY ("parcelleId") REFERENCES "Parcelle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_observationId_fkey" FOREIGN KEY ("observationId") REFERENCES "Observation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
