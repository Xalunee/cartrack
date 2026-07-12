-- AlterTable
ALTER TABLE "cars" ADD COLUMN     "stsNumber" TEXT,
ADD COLUMN     "lastFinesCheckAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "fines" (
    "id" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "numPost" TEXT NOT NULL,
    "koapCode" TEXT,
    "koapText" TEXT,
    "sum" DOUBLE PRECISION NOT NULL,
    "enableDiscount" BOOLEAN NOT NULL DEFAULT false,
    "dateDiscount" TIMESTAMP(3),
    "dateDecision" TIMESTAMP(3),
    "divisionName" TEXT,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "notifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fines_numPost_key" ON "fines"("numPost");

-- AddForeignKey
ALTER TABLE "fines" ADD CONSTRAINT "fines_carId_fkey" FOREIGN KEY ("carId") REFERENCES "cars"("id") ON DELETE CASCADE ON UPDATE CASCADE;
