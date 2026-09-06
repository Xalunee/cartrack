import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import {
  calculateFuelConsumption,
  MIN_SEGMENTS_FOR_OUTLIER_DETECTION,
  OUTLIER_DEVIATION_RATIO,
  type FuelEntryData,
} from '@shared/lib/calculations/fuel'

/** Заправка через N дней от фиксированной эпохи — тесты не зависят от «сегодня». */
const EPOCH = new Date('2026-01-01T00:00:00.000Z')

function fill(
  id: string,
  dayOffset: number,
  mileage: number | null,
  liters: number,
  extra: Partial<FuelEntryData> = {}
): FuelEntryData {
  return {
    id,
    date: new Date(EPOCH.getTime() + dayOffset * 86_400_000),
    mileage,
    liters,
    isFullTank: true,
    hasMissedEntry: false,
    ...extra,
  }
}

const partial = (
  id: string,
  dayOffset: number,
  mileage: number | null,
  liters: number,
  extra: Partial<FuelEntryData> = {}
) => fill(id, dayOffset, mileage, liters, { isFullTank: false, ...extra })

/**
 * Ряд заправок «до полного» с шагом 500 км: первая — открывающая, каждая
 * следующая закрывает отрезок своими литрами. `litersPerClose[i]` даёт расход
 * i-го отрезка как `liters / 5`.
 */
function fullTankSeries(litersPerClose: number[]): FuelEntryData[] {
  const entries = [fill('open', 0, 10_000, 40)]
  litersPerClose.forEach((liters, i) => {
    entries.push(fill(`close-${i}`, (i + 1) * 10, 10_500 + i * 500, liters))
  })
  return entries
}

beforeAll(() => {
  // Расчёт не смотрит на текущее время, и это тоже проверяется: заморозка
  // ничего в ожиданиях не двигает.
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'))
})

afterAll(() => {
  vi.useRealTimers()
})

describe('calculateFuelConsumption', () => {
  describe('базовый расчёт', () => {
    it('считает отрезок между двумя полными баками, не считая литры открывающей', () => {
      const stats = calculateFuelConsumption([
        fill('a', 0, 10_000, 45), // эти 45 л в расчёт не идут
        fill('b', 10, 10_500, 40),
      ])

      expect(stats.segments).toHaveLength(1)
      expect(stats.segments[0]).toMatchObject({
        fromEntryId: 'a',
        toEntryId: 'b',
        distanceKm: 500,
        liters: 40,
        status: 'ok',
      })
      expect(stats.segments[0].consumption).toBeCloseTo(8, 10)
      expect(stats.averageConsumption).toBeCloseTo(8, 10)
      expect(stats.basedOnSegments).toBe(1)
    })

    it('включает литры неполных заправок внутри отрезка', () => {
      const stats = calculateFuelConsumption([
        fill('a', 0, 10_000, 45),
        partial('p', 3, 10_200, 10),
        fill('b', 10, 10_500, 40),
      ])

      expect(stats.segments[0].liters).toBe(50)
      expect(stats.segments[0].consumption).toBeCloseTo(10, 10)
    })

    it('разобранный пример: полный на 10 000, 20/15/25 между, полный на 10 800 с 30 → 11.25 л/100', () => {
      const stats = calculateFuelConsumption([
        fill('a', 0, 10_000, 50),
        partial('p1', 2, 10_200, 20),
        partial('p2', 4, 10_400, 15),
        partial('p3', 6, 10_600, 25),
        fill('b', 8, 10_800, 30),
      ])

      expect(stats.segments).toHaveLength(1)
      expect(stats.segments[0].liters).toBe(90)
      expect(stats.segments[0].distanceKm).toBe(800)
      expect(stats.segments[0].consumption).toBeCloseTo(11.25, 10)
      expect(stats.averageConsumption).toBeCloseTo(11.25, 10)
    })

    it('считает несколько отрезков подряд', () => {
      const stats = calculateFuelConsumption(fullTankSeries([50, 50]))

      expect(stats.segments).toHaveLength(2)
      expect(stats.segments.map((s) => s.consumption)).toEqual([10, 10])
      expect(stats.basedOnSegments).toBe(2)
    })

    it('среднее взвешено по расстоянию, а не по числу отрезков', () => {
      // 100 км на 10 л (10 л/100) и 900 км на 45 л (5 л/100).
      // Взвешенное: 55 л / 1000 км = 5.5, а не среднее из 10 и 5 = 7.5.
      const stats = calculateFuelConsumption([
        fill('a', 0, 10_000, 40),
        fill('b', 1, 10_100, 10),
        fill('c', 20, 11_000, 45),
      ])

      expect(stats.averageConsumption).toBeCloseTo(5.5, 10)
    })
  })

  describe('данных не хватает', () => {
    it('пустой список — без результата и без падения', () => {
      const stats = calculateFuelConsumption([])
      expect(stats.segments).toEqual([])
      expect(stats.averageConsumption).toBeNull()
      expect(stats.basedOnSegments).toBe(0)
    })

    it('одна заправка за всю историю — отрезка нет', () => {
      const stats = calculateFuelConsumption([fill('a', 0, 10_000, 45)])
      expect(stats.segments).toEqual([])
      expect(stats.averageConsumption).toBeNull()
    })

    it('ни одной заправки «до полного» — отрезка нет', () => {
      const stats = calculateFuelConsumption([
        partial('p1', 0, 10_000, 20),
        partial('p2', 5, 10_300, 20),
        partial('p3', 9, 10_600, 20),
      ])
      expect(stats.segments).toEqual([])
      expect(stats.averageConsumption).toBeNull()
    })

    it('закрывающего полного бака ещё нет — хвост из неполных заправок отрезка не даёт', () => {
      const stats = calculateFuelConsumption([
        fill('a', 0, 10_000, 45),
        partial('p1', 3, 10_200, 20),
        partial('p2', 6, 10_400, 20),
      ])
      expect(stats.segments).toEqual([])
      expect(stats.averageConsumption).toBeNull()
    })
  })

  describe('пробег не записан', () => {
    it('запись без одометра внутри отрезка: литры идут в сумму, отрезок считается', () => {
      const stats = calculateFuelConsumption([
        fill('a', 0, 10_000, 45),
        partial('p', 3, null, 10),
        fill('b', 10, 10_500, 40),
      ])

      expect(stats.segments[0].status).toBe('ok')
      expect(stats.segments[0].liters).toBe(50)
      expect(stats.segments[0].distanceKm).toBe(500)
      expect(stats.segments[0].consumption).toBeCloseTo(10, 10)
    })

    it('без одометра на открывающей — отрезок непосчитуем', () => {
      const stats = calculateFuelConsumption([
        fill('a', 0, null, 45),
        fill('b', 10, 10_500, 40),
      ])

      expect(stats.segments[0]).toMatchObject({
        status: 'missing-mileage',
        distanceKm: null,
        consumption: null,
      })
      expect(stats.averageConsumption).toBeNull()
      expect(stats.basedOnSegments).toBe(0)
    })

    it('без одометра на закрывающей — отрезок непосчитуем', () => {
      const stats = calculateFuelConsumption([
        fill('a', 0, 10_000, 45),
        fill('b', 10, null, 40),
      ])

      expect(stats.segments[0].status).toBe('missing-mileage')
      expect(stats.segments[0].consumption).toBeNull()
    })

    it('непосчитуемый отрезок не мешает соседнему считаться', () => {
      const stats = calculateFuelConsumption([
        fill('a', 0, 10_000, 45),
        fill('b', 10, null, 40),
        fill('c', 20, 11_000, 40),
      ])

      expect(stats.segments.map((s) => s.status)).toEqual(['missing-mileage', 'missing-mileage'])
      expect(stats.averageConsumption).toBeNull()
    })
  })

  describe('пропущенная заправка', () => {
    it('признак на закрывающей заправке исключает отрезок', () => {
      const stats = calculateFuelConsumption([
        fill('a', 0, 10_000, 45),
        fill('b', 10, 10_500, 40, { hasMissedEntry: true }),
      ])

      expect(stats.segments[0]).toMatchObject({ status: 'missed-entry', consumption: null })
      expect(stats.averageConsumption).toBeNull()
      expect(stats.basedOnSegments).toBe(0)
    })

    // ⚠️ Случая не было в задании. Признак «была заправка, которую я не записал»
    // на промежуточной записи означает ровно ту же дыру в литрах, что и на
    // закрывающей: пробег отрезка полный, топливо — нет. Показать по такому
    // отрезку число значит показать заниженный расход, поэтому отрезок
    // исключается так же.
    it('признак на промежуточной неполной заправке тоже исключает отрезок', () => {
      const stats = calculateFuelConsumption([
        fill('a', 0, 10_000, 45),
        partial('p', 5, 10_250, 20, { hasMissedEntry: true }),
        fill('b', 10, 10_500, 40),
      ])

      expect(stats.segments[0].status).toBe('missed-entry')
      expect(stats.segments[0].consumption).toBeNull()
    })

    it('признак на открывающей относится к предыдущему отрезку, а не к этому', () => {
      const stats = calculateFuelConsumption([
        fill('a', 0, 10_000, 45, { hasMissedEntry: true }),
        fill('b', 10, 10_500, 40),
      ])

      expect(stats.segments[0].status).toBe('ok')
      expect(stats.segments[0].consumption).toBeCloseTo(8, 10)
    })
  })

  describe('поиск выбросов', () => {
    it(`меньше ${MIN_SEGMENTS_FOR_OUTLIER_DETECTION} отрезков — не помечает ничего, даже при диком разбросе`, () => {
      // 10 и 30 л/100 — расхождение втрое, но истории, с которой сравнивать, ещё нет.
      const stats = calculateFuelConsumption(fullTankSeries([50, 150]))

      expect(stats.segments.map((s) => s.status)).toEqual(['ok', 'ok'])
      expect(stats.basedOnSegments).toBe(2)
      // 200 л на 1000 км
      expect(stats.averageConsumption).toBeCloseTo(20, 10)
    })

    it('помечает и исключает заниженный отрезок', () => {
      // 10, 10, 10 и 5 л/100 — провал вдвое, подпись незаписанной заправки.
      const stats = calculateFuelConsumption(fullTankSeries([50, 50, 50, 25]))

      expect(stats.segments.map((s) => s.status)).toEqual(['ok', 'ok', 'ok', 'outlier'])
      expect(stats.basedOnSegments).toBe(3)
      expect(stats.averageConsumption).toBeCloseTo(10, 10)
    })

    it('помечает и исключает завышенный отрезок', () => {
      // 10, 10, 10 и 16 л/100 — «до полного» там, где бак не долили.
      const stats = calculateFuelConsumption(fullTankSeries([50, 50, 50, 80]))

      expect(stats.segments.map((s) => s.status)).toEqual(['ok', 'ok', 'ok', 'outlier'])
      expect(stats.averageConsumption).toBeCloseTo(10, 10)
    })

    it('сезонный разброс порог не переступает', () => {
      // 10, 10, 10 и 13 л/100 — зимний расход, а не ошибка записи (30% < 35%).
      const stats = calculateFuelConsumption(fullTankSeries([50, 50, 50, 65]))

      expect(stats.segments.every((s) => s.status === 'ok')).toBe(true)
      expect(stats.basedOnSegments).toBe(4)
      expect(stats.averageConsumption).toBeCloseTo(10.75, 10)
    })

    it(`порог — ровно ${OUTLIER_DEVIATION_RATIO * 100}% от медианы, и он не строгий`, () => {
      // Медиана 10, отрезок ровно на 13.5 — на самой границе, не помечаем.
      const onEdge = calculateFuelConsumption(fullTankSeries([50, 50, 50, 67.5]))
      expect(onEdge.segments[3].status).toBe('ok')

      // Чуть дальше — уже выброс.
      const overEdge = calculateFuelConsumption(fullTankSeries([50, 50, 50, 68]))
      expect(overEdge.segments[3].status).toBe('outlier')
    })

    it('одна испорченная запись не сдвигает центр — сравниваем с медианой', () => {
      // Среднее из 10, 10, 10 и 40 равно 17.5, и от него нормальные отрезки
      // сами выглядели бы выбросами. Медиана остаётся 10.
      const stats = calculateFuelConsumption(fullTankSeries([50, 50, 50, 200]))

      expect(stats.segments.map((s) => s.status)).toEqual(['ok', 'ok', 'ok', 'outlier'])
      expect(stats.averageConsumption).toBeCloseTo(10, 10)
    })

    it('непосчитуемые отрезки в поиске выбросов не участвуют', () => {
      const stats = calculateFuelConsumption([
        fill('a', 0, 10_000, 40),
        fill('b', 10, 10_500, 50),
        fill('c', 20, null, 50), // рвёт два отрезка сразу
        fill('d', 30, 11_500, 50),
        fill('e', 40, 12_000, 50),
      ])

      // Посчитались только первый и последний — до порога не хватает.
      expect(stats.segments.map((s) => s.status)).toEqual([
        'ok',
        'missing-mileage',
        'missing-mileage',
        'ok',
      ])
      expect(stats.basedOnSegments).toBe(2)
    })
  })

  describe('порядок и края', () => {
    it('сортирует записи, пришедшие вразнобой', () => {
      const ordered = calculateFuelConsumption([
        fill('a', 0, 10_000, 50),
        partial('p1', 2, 10_200, 20),
        partial('p2', 4, 10_400, 15),
        fill('b', 8, 10_800, 30),
      ])
      const shuffled = calculateFuelConsumption([
        fill('b', 8, 10_800, 30),
        partial('p2', 4, 10_400, 15),
        fill('a', 0, 10_000, 50),
        partial('p1', 2, 10_200, 20),
      ])

      expect(shuffled).toEqual(ordered)
      expect(shuffled.segments[0].liters).toBe(65)
      expect(shuffled.segments[0].consumption).toBeCloseTo(65 / 8, 10)
    })

    it('две заправки в один день упорядочены по одометру', () => {
      // Долили неполный бак и в тот же день закрыли отрезок полным.
      const stats = calculateFuelConsumption([
        fill('a', 0, 10_000, 45),
        fill('close', 5, 10_500, 30),
        partial('same-day', 5, 10_450, 10),
      ])

      expect(stats.segments[0].toEntryId).toBe('close')
      expect(stats.segments[0].liters).toBe(40)
      expect(stats.segments[0].consumption).toBeCloseTo(8, 10)
    })

    it('две заправки «до полного» на одном одометре — делить не на что', () => {
      const stats = calculateFuelConsumption([
        fill('a', 0, 10_000, 45),
        fill('b', 5, 10_000, 30),
      ])

      expect(stats.segments[0]).toMatchObject({
        status: 'no-distance',
        distanceKm: 0,
        consumption: null,
      })
      expect(stats.averageConsumption).toBeNull()
    })

    it('одометр ушёл назад — отрезок непосчитуем, а не отрицателен', () => {
      const stats = calculateFuelConsumption([
        fill('a', 0, 10_500, 45),
        fill('b', 5, 10_000, 30),
      ])

      expect(stats.segments[0].status).toBe('no-distance')
      expect(stats.segments[0].distanceKm).toBe(-500)
      expect(stats.segments[0].consumption).toBeNull()
    })

    it('нулевые литры дают нулевой расход, а не пропуск', () => {
      const stats = calculateFuelConsumption([
        fill('a', 0, 10_000, 45),
        fill('b', 5, 10_500, 0),
      ])

      expect(stats.segments[0].status).toBe('ok')
      expect(stats.segments[0].consumption).toBe(0)
      expect(stats.averageConsumption).toBe(0)
    })

    it('нулевая заправка среди обычных выглядит выбросом и исключается', () => {
      const stats = calculateFuelConsumption(fullTankSeries([50, 50, 50, 0]))

      expect(stats.segments.map((s) => s.status)).toEqual(['ok', 'ok', 'ok', 'outlier'])
      expect(stats.averageConsumption).toBeCloseTo(10, 10)
    })

    it('нулевая медиана поиск выбросов выключает — относительного отклонения от неё нет', () => {
      const stats = calculateFuelConsumption(fullTankSeries([0, 0, 0, 50]))

      expect(stats.segments.every((s) => s.status === 'ok')).toBe(true)
      // 50 л на 2000 км
      expect(stats.averageConsumption).toBeCloseTo(2.5, 10)
    })

    it('не мутирует переданный массив', () => {
      const entries = [fill('b', 10, 10_500, 40), fill('a', 0, 10_000, 45)]
      const snapshot = [...entries]

      calculateFuelConsumption(entries)

      expect(entries).toEqual(snapshot)
    })
  })
})
