import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

config({ path: ".env.local" });
config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const items = await prisma.maintenanceItem.findMany({
    where: {
      OR: [{ lastServiceMileage: { not: null } }, { lastServiceDate: { not: null } }],
    },
    include: { car: true },
  });

  let created = 0;

  for (const item of items) {
    const existing = await prisma.serviceRecord.findFirst({
      where: { maintenanceItemId: item.id },
    });
    if (existing) continue;

    await prisma.serviceRecord.create({
      data: {
        maintenanceItemId: item.id,
        mileage: item.lastServiceMileage ?? item.car.currentMileage,
        date: item.lastServiceDate ?? item.createdAt,
        cost: item.lastServiceCost,
        notes: item.lastServiceNotes,
      },
    });
    created++;
  }

  console.log(`Backfilled ${created} service record(s) for ${items.length} maintenance item(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
