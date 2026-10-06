-- CreateTable
CREATE TABLE "PointGPSCulture" (
    "id" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "ordre" INTEGER NOT NULL,
    "creeA" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieA" TIMESTAMP(3) NOT NULL,
    "cultureId" TEXT NOT NULL,

    CONSTRAINT "PointGPSCulture_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PointGPSCulture_cultureId_ordre_key" ON "PointGPSCulture"("cultureId", "ordre");

-- AddForeignKey
ALTER TABLE "PointGPSCulture" ADD CONSTRAINT "PointGPSCulture_cultureId_fkey" FOREIGN KEY ("cultureId") REFERENCES "Culture"("id") ON DELETE CASCADE ON UPDATE CASCADE;
