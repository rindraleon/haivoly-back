-- CreateTable
CREATE TABLE "Recolte" (
    "id" TEXT NOT NULL,
    "dateRecolte" TIMESTAMP(3) NOT NULL,
    "quantite" DOUBLE PRECISION NOT NULL,
    "unite" TEXT NOT NULL,
    "description" TEXT,
    "prixVente" DOUBLE PRECISION,
    "coutRecolte" DOUBLE PRECISION,
    "photo" TEXT,
    "creeA" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieA" TIMESTAMP(3) NOT NULL,
    "cultureId" TEXT NOT NULL,

    CONSTRAINT "Recolte_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Recolte_cultureId_key" ON "Recolte"("cultureId");

-- AddForeignKey
ALTER TABLE "Recolte" ADD CONSTRAINT "Recolte_cultureId_fkey" FOREIGN KEY ("cultureId") REFERENCES "Culture"("id") ON DELETE CASCADE ON UPDATE CASCADE;
