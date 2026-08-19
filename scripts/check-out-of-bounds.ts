/**
 * Read-only audit of rows written before the validation bounds existed.
 *
 * The bounds only guard new writes, so a value stored earlier can sit outside
 * them — and then some forms cannot be submitted at all. The worst shape is a
 * maintenance item whose lastServiceMileage is above the ceiling:
 * createCompleteServiceSchema builds `.min(lastServiceMileage)` on top of the
 * `.max(LIMITS.mileage)` every mileage field carries, so no value satisfies both
 * and the "Заменил" form can never be sent, while the error text points at the
 * minimum and misleads.
 *
 * Prints counts and the offending ids. Writes nothing, deletes nothing —
 * what to do about a hit is a decision for a human.
 */
import { config } from 'dotenv'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { LIMITS } from '../src/shared/lib/validation/limits'

config({ path: '.env.local' })
config()

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL
if (!connectionString) {
  console.error('DATABASE_URL (or DIRECT_URL) is not set — nothing to check against.')
  process.exit(1)
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

interface Offender {
  id: string
  detail: string
}

interface Check {
  label: string
  run: () => Promise<Offender[]>
}

/** Prisma has no "string longer than N" filter, so length checks go through SQL. */
async function longStrings(
  table: string,
  column: string,
  limit: number
): Promise<Offender[]> {
  const rows = await prisma.$queryRawUnsafe<{ id: string; len: bigint }[]>(
    `select id, char_length("${column}") as len from "${table}" where char_length("${column}") > $1 order by len desc`,
    limit
  )
  return rows.map((row) => ({ id: row.id, detail: `${row.len} символов (лимит ${limit})` }))
}

const checks: Check[] = [
  {
    label: `mileage_logs.mileage > ${LIMITS.mileage}`,
    run: async () =>
      (
        await prisma.mileageLog.findMany({
          where: { mileage: { gt: LIMITS.mileage } },
          select: { id: true, mileage: true, carId: true },
          orderBy: { mileage: 'desc' },
        })
      ).map((row) => ({ id: row.id, detail: `${row.mileage} км, carId=${row.carId}` })),
  },
  {
    label: `cars.currentMileage > ${LIMITS.mileage}`,
    run: async () =>
      (
        await prisma.car.findMany({
          where: { currentMileage: { gt: LIMITS.mileage } },
          select: { id: true, currentMileage: true },
          orderBy: { currentMileage: 'desc' },
        })
      ).map((row) => ({ id: row.id, detail: `${row.currentMileage} км` })),
  },
  {
    label: `maintenance_items.lastServiceMileage > ${LIMITS.mileage}`,
    run: async () =>
      (
        await prisma.maintenanceItem.findMany({
          where: { lastServiceMileage: { gt: LIMITS.mileage } },
          select: { id: true, name: true, lastServiceMileage: true },
          orderBy: { lastServiceMileage: 'desc' },
        })
      ).map((row) => ({
        id: row.id,
        detail: `${row.lastServiceMileage} км — «${row.name}» (блокирует форму замены)`,
      })),
  },
  {
    label: `service_records.mileage > ${LIMITS.mileage}`,
    run: async () =>
      (
        await prisma.serviceRecord.findMany({
          where: { mileage: { gt: LIMITS.mileage } },
          select: { id: true, mileage: true, maintenanceItemId: true },
          orderBy: { mileage: 'desc' },
        })
      ).map((row) => ({
        id: row.id,
        detail: `${row.mileage} км, maintenanceItemId=${row.maintenanceItemId}`,
      })),
  },
  {
    label: `maintenance_items.lastServiceCost > ${LIMITS.cost}`,
    run: async () =>
      (
        await prisma.maintenanceItem.findMany({
          where: { lastServiceCost: { gt: LIMITS.cost } },
          select: { id: true, lastServiceCost: true },
        })
      ).map((row) => ({ id: row.id, detail: `${row.lastServiceCost} ₽` })),
  },
  {
    label: `service_records.cost > ${LIMITS.cost}`,
    run: async () =>
      (
        await prisma.serviceRecord.findMany({
          where: { cost: { gt: LIMITS.cost } },
          select: { id: true, cost: true },
        })
      ).map((row) => ({ id: row.id, detail: `${row.cost} ₽` })),
  },
  {
    label: `car_events.cost > ${LIMITS.cost}`,
    run: async () =>
      (
        await prisma.carEvent.findMany({
          where: { cost: { gt: LIMITS.cost } },
          select: { id: true, cost: true },
        })
      ).map((row) => ({ id: row.id, detail: `${row.cost} ₽` })),
  },
  {
    label: `maintenance_items.intervalKm > ${LIMITS.intervalKm}`,
    run: async () =>
      (
        await prisma.maintenanceItem.findMany({
          where: { intervalKm: { gt: LIMITS.intervalKm } },
          select: { id: true, intervalKm: true },
        })
      ).map((row) => ({ id: row.id, detail: `${row.intervalKm} км` })),
  },
  {
    label: `maintenance_items.intervalDays > ${LIMITS.intervalDays}`,
    run: async () =>
      (
        await prisma.maintenanceItem.findMany({
          where: { intervalDays: { gt: LIMITS.intervalDays } },
          select: { id: true, intervalDays: true },
        })
      ).map((row) => ({ id: row.id, detail: `${row.intervalDays} дн.` })),
  },
  // Free text
  { label: 'mileage_logs.note', run: () => longStrings('mileage_logs', 'note', LIMITS.textLength) },
  {
    label: 'maintenance_items.lastServiceNotes',
    run: () => longStrings('maintenance_items', 'lastServiceNotes', LIMITS.textLength),
  },
  {
    label: 'service_records.notes',
    run: () => longStrings('service_records', 'notes', LIMITS.textLength),
  },
  {
    label: 'car_events.description',
    run: () => longStrings('car_events', 'description', LIMITS.textLength),
  },
  // Labels
  { label: 'cars.brand', run: () => longStrings('cars', 'brand', LIMITS.nameLength) },
  { label: 'cars.model', run: () => longStrings('cars', 'model', LIMITS.nameLength) },
  {
    label: 'maintenance_items.name',
    run: () => longStrings('maintenance_items', 'name', LIMITS.nameLength),
  },
  { label: 'car_events.title', run: () => longStrings('car_events', 'title', LIMITS.nameLength) },
  { label: 'users.name', run: () => longStrings('users', 'name', LIMITS.nameLength) },
  {
    label: 'cars.licensePlate',
    run: () => longStrings('cars', 'licensePlate', LIMITS.licensePlateLength),
  },
]

async function main() {
  console.log('Проверка данных на соответствие новым границам валидации.\n')

  let total = 0

  for (const check of checks) {
    const offenders = await check.run()
    total += offenders.length

    if (!offenders.length) {
      console.log(`  ok   ${check.label}`)
      continue
    }

    console.log(`  ⚠️   ${check.label} — ${offenders.length}`)
    for (const offender of offenders) {
      console.log(`         ${offender.id}: ${offender.detail}`)
    }
  }

  console.log(
    total === 0
      ? '\nВсё в границах — править нечего.'
      : `\nВсего строк вне границ: ${total}. Скрипт ничего не менял.`
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
