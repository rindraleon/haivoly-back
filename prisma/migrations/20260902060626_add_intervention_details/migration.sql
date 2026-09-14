-- CreateEnum
CREATE TYPE "TypeIntervention" AS ENUM ('PLANTATION', 'IRRIGATION', 'FERTILISATION', 'DESHERBAGE', 'TRAITEMENT', 'ENTRETIEN', 'INSPECTION', 'AUTRE');

-- AlterTable
ALTER TABLE "Intervention" ADD COLUMN     "cout" DOUBLE PRECISION,
ADD COLUMN     "produit" TEXT,
ADD COLUMN     "quantite" DOUBLE PRECISION,
ADD COLUMN     "unite" TEXT;

-- CreateTable
CREATE TABLE "PhotoIntervention" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "dateAjout" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "interventionId" TEXT NOT NULL,

    CONSTRAINT "PhotoIntervention_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PhotoIntervention" ADD CONSTRAINT "PhotoIntervention_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES "Intervention"("id") ON DELETE CASCADE ON UPDATE CASCADE;
