/*
  Warnings:

  - You are about to drop the column `photo` on the `Recolte` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Recolte" DROP COLUMN "photo";

-- CreateTable
CREATE TABLE "PhotoRecolte" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "dateAjout" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recolteId" TEXT NOT NULL,

    CONSTRAINT "PhotoRecolte_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PhotoRecolte" ADD CONSTRAINT "PhotoRecolte_recolteId_fkey" FOREIGN KEY ("recolteId") REFERENCES "Recolte"("id") ON DELETE CASCADE ON UPDATE CASCADE;
