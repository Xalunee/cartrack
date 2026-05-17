import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const db = new PrismaClient({ adapter })

async function main() {
  const password = await bcrypt.hash('password123', 12)

  const user = await db.user.upsert({
    where: { email: 'test@cartrack.dev' },
    update: {},
    create: {
      email: 'test@cartrack.dev',
      password,
      name: 'Test User',
      car: {
        create: {
          brand: 'Toyota',
          model: 'Camry',
          year: 2019,
          currentMileage: 87420,
          maintenanceItems: {
            createMany: {
              data: [
                {
                  name: 'Замена масла',
                  intervalKm: 10000,
                  intervalDays: 365,
                  lastServiceMileage: 85120,
                  lastServiceDate: new Date('2024-11-01'),
                  lastServiceCost: 4500,
                },
                {
                  name: 'Тормозные колодки',
                  intervalKm: 30000,
                  lastServiceMileage: 75000,
                  lastServiceCost: 8000,
                },
                {
                  name: 'Воздушный фильтр',
                  intervalKm: 15000,
                  intervalDays: 730,
                  lastServiceMileage: 72000,
                  lastServiceDate: new Date('2023-06-01'),
                  lastServiceCost: 1200,
                },
                {
                  name: 'Шины',
                  intervalKm: 50000,
                  lastServiceMileage: 50000,
                  lastServiceCost: 32000,
                },
              ],
            },
          },
          mileageLogs: {
            createMany: {
              data: [
                { mileage: 86900, recordedAt: new Date('2025-04-28') },
                { mileage: 87150, recordedAt: new Date('2025-05-05') },
                { mileage: 87420, recordedAt: new Date('2025-05-12') },
              ],
            },
          },
        },
      },
    },
  })

  console.log('✓ Seed complete')
  console.log('  Email:    ', user.email)
  console.log('  Password:  password123')
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
