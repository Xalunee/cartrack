-- Заправки: расход топлива и траты на него.
--
-- RLS is enabled here for the same reason as in 20260818152000_enable_rls:
-- Supabase exposes every `public` table over PostgREST, and a table created
-- without RLS is readable by the `anon` role. No policies on purpose — the app
-- talks to Postgres as `postgres` (rolbypassrls), so RLS is never evaluated for
-- application traffic, while `anon` gets zero rows.

-- CreateTable
CREATE TABLE "fuel_entries" (
    "id" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "mileage" INTEGER,
    "date" TIMESTAMP(3) NOT NULL,
    "liters" DOUBLE PRECISION NOT NULL,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "isFullTank" BOOLEAN NOT NULL DEFAULT true,
    "hasMissedEntry" BOOLEAN NOT NULL DEFAULT false,
    "station" TEXT,
    "fuelType" TEXT,
    "receiptPhotoUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fuel_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fuel_entries_carId_date_idx" ON "fuel_entries"("carId", "date");

-- AddForeignKey
ALTER TABLE "fuel_entries" ADD CONSTRAINT "fuel_entries_carId_fkey" FOREIGN KEY ("carId") REFERENCES "cars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enable RLS (see header)
ALTER TABLE public.fuel_entries ENABLE ROW LEVEL SECURITY;
