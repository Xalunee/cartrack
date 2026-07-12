-- CreateTable
CREATE TABLE "service_records" (
    "id" TEXT NOT NULL,
    "maintenanceItemId" TEXT NOT NULL,
    "mileage" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "cost" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "service_records_maintenanceItemId_idx" ON "service_records"("maintenanceItemId");

-- AddForeignKey
ALTER TABLE "service_records" ADD CONSTRAINT "service_records_maintenanceItemId_fkey" FOREIGN KEY ("maintenanceItemId") REFERENCES "maintenance_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
