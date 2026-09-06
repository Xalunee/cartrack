import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import type { FuelSegment, FuelSegmentStatus } from '@shared/types'
import {
  calculateConsumptionSeries,
  calculateCostPerKm,
  calculateFuelSpending,
  totalFuelSpent,
  calculatePriceSeries,
  detectConsumptionRise,
  detectMissedFillUp,
  stationsWorthFiltering,
  MIN_SEGMENTS_FOR_HEALTH_SIGNAL,
  MISSED_FILL_UP_FACTOR,
  type FuelStatsEntry,
} from '@shared/lib/calculations/fuel-stats'

const NOW = new Date('2026-09-15T12:00:00.000Z')

function entry(
  id: string,
  date: string,
  { mileage = null, liters = 40, totalCost = 2000, station = null }: Partial<FuelStatsEntry> = {}
): FuelStatsEntry {
  return { id, date: new Date(date), mileage, liters, totalCost, station }
}

function segment(
  toDate: string,
  consumption: number,
  { status = 'ok', distanceKm = 500 }: { status?: FuelSegmentStatus; distanceKm?: number } = {}
): FuelSegment {
  return {
    fromEntryId: `from-${toDate}`,
    toEntryId: `to-${toDate}`,
    fromDate: new Date(toDate),
    toDate: new Date(toDate),
    distanceKm,
    liters: (consumption * distanceKm) / 100,
    consumption,
    status,
  }
}

beforeAll(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})

afterAll(() => {
  vi.useRealTimers()
})

describe('calculateFuelSpending', () => {
  const periodStart = new Date(2026, 6, 1) // 1 июля, местное время

  it('делит траты на всё время и на период', () => {
    const spending = calculateFuelSpending(
      [
        entry('old', '2026-05-20T10:00:00', { totalCost: 1000, liters: 20 }),
        entry('july', '2026-07-10T10:00:00', { totalCost: 2000, liters: 40 }),
        entry('sept', '2026-09-01T10:00:00', { totalCost: 3000, liters: 50 }),
      ],
      { periodStart, now: NOW }
    )

    expect(spending.total).toBe(6000)
    expect(spending.periodTotal).toBe(5000)
    expect(spending.periodLiters).toBe(90)
  })

  it('заправка ровно на границе периода в него входит', () => {
    const spending = calculateFuelSpending([entry('edge', '2026-07-01T00:00:00')], {
      periodStart,
      now: NOW,
    })
    expect(spending.periodTotal).toBe(2000)
  })

  it('заправка за миг до границы — уже прошлый период', () => {
    const spending = calculateFuelSpending([entry('before', '2026-06-30T23:59:59')], {
      periodStart,
      now: NOW,
    })
    expect(spending.periodTotal).toBe(0)
    expect(spending.total).toBe(2000)
  })

  it('держит пустые месяцы — иначе график сжимает паузу в тратах', () => {
    const spending = calculateFuelSpending([entry('sept', '2026-09-01T10:00:00')], {
      periodStart,
      now: NOW,
    })

    expect(spending.months.map((m) => m.start.getMonth())).toEqual([6, 7, 8])
    expect(spending.months.map((m) => m.spent)).toEqual([0, 0, 2000])
  })

  it('складывает несколько заправок одного месяца в один столбик', () => {
    const spending = calculateFuelSpending(
      [
        entry('a', '2026-08-02T10:00:00', { totalCost: 1500, liters: 30 }),
        entry('b', '2026-08-20T10:00:00', { totalCost: 2500, liters: 45 }),
      ],
      { periodStart, now: NOW }
    )

    const august = spending.months.find((m) => m.start.getMonth() === 7)!
    expect(august.spent).toBe(4000)
    expect(august.liters).toBe(75)
  })

  it('без заправок отдаёт нули, а не пустоту', () => {
    const spending = calculateFuelSpending([], { periodStart, now: NOW })
    expect(spending.total).toBe(0)
    expect(spending.months).toHaveLength(3)
  })
})

describe('totalFuelSpent', () => {
  it('складывает все траты, не строя помесячных столбиков', () => {
    expect(
      totalFuelSpent([
        entry('a', '2020-01-01T10:00:00', { totalCost: 1000 }),
        entry('b', '2026-09-01T10:00:00', { totalCost: 2000 }),
      ])
    ).toBe(3000)
  })

  it('совпадает с итогом за всё время из calculateFuelSpending', () => {
    const entries = [
      entry('a', '2026-05-20T10:00:00', { totalCost: 1000 }),
      entry('b', '2026-09-01T10:00:00', { totalCost: 3000 }),
    ]
    const spending = calculateFuelSpending(entries, { periodStart: new Date(2026, 6, 1), now: NOW })
    expect(totalFuelSpent(entries)).toBe(spending.total)
  })

  it('пустой список — ноль', () => {
    expect(totalFuelSpent([])).toBe(0)
  })
})

describe('calculatePriceSeries', () => {
  it('считает цену литра, а не берёт её из данных', () => {
    const series = calculatePriceSeries([entry('a', '2026-09-01T10:00:00', { liters: 40, totalCost: 2400 })])
    expect(series).toHaveLength(1)
    expect(series[0].pricePerLiter).toBe(60)
  })

  it('одна заправка — это точка, а не ошибка', () => {
    // Тренда по одной точке нет, но и падать не на чем: рисовать одну точку —
    // задача UI, а не повод вернуть пустоту.
    expect(calculatePriceSeries([entry('a', '2026-09-01T10:00:00')])).toHaveLength(1)
  })

  it('сортирует по дате, как бы записи ни пришли', () => {
    const series = calculatePriceSeries([
      entry('b', '2026-09-05T10:00:00'),
      entry('a', '2026-09-01T10:00:00'),
    ])
    expect(series.map((p) => p.date.getDate())).toEqual([1, 5])
  })

  it('фильтрует по заправке — иначе скачок цены неотличим от смены АЗС', () => {
    const entries = [
      entry('a', '2026-09-01T10:00:00', { liters: 40, totalCost: 2000, station: 'Лукойл' }),
      entry('b', '2026-09-05T10:00:00', { liters: 40, totalCost: 2800, station: 'Газпром' }),
      entry('c', '2026-09-09T10:00:00', { liters: 40, totalCost: 2040, station: 'Лукойл' }),
    ]

    const lukoil = calculatePriceSeries(entries, { station: 'Лукойл' })
    expect(lukoil.map((p) => p.pricePerLiter)).toEqual([50, 51])
  })

  it('пропускает заправку с нулём литров — цена литра там не определена', () => {
    expect(calculatePriceSeries([entry('a', '2026-09-01T10:00:00', { liters: 0 })])).toEqual([])
  })
})

describe('stationsWorthFiltering', () => {
  it('предлагает только те заправки, где был больше одного раза', () => {
    const stations = stationsWorthFiltering([
      entry('a', '2026-09-01T10:00:00', { station: 'Лукойл' }),
      entry('b', '2026-09-02T10:00:00', { station: 'Лукойл' }),
      entry('c', '2026-09-03T10:00:00', { station: 'Разовая' }),
      entry('d', '2026-09-04T10:00:00', { station: null }),
    ])
    expect(stations).toEqual(['Лукойл'])
  })
})

describe('calculateCostPerKm', () => {
  it('считает по расстоянию между крайними заправками с одометром, без денег первой', () => {
    const result = calculateCostPerKm([
      entry('a', '2026-08-01T10:00:00', { mileage: 10_000, totalCost: 9999 }),
      entry('b', '2026-08-10T10:00:00', { mileage: 10_400, totalCost: 2000 }),
      entry('c', '2026-08-20T10:00:00', { mileage: 11_000, totalCost: 3000 }),
    ])!

    expect(result.distanceKm).toBe(1000)
    expect(result.spent).toBe(5000)
    expect(result.costPerKm).toBe(5)
  })

  it('деньги заправок без одометра внутри промежутка идут в счёт', () => {
    // Топливо сгорело на том же расстоянии — исключить его значит занизить цену
    // километра ровно на сумму, которую человек заплатил.
    const result = calculateCostPerKm([
      entry('a', '2026-08-01T10:00:00', { mileage: 10_000 }),
      entry('gap', '2026-08-05T10:00:00', { mileage: null, totalCost: 1000 }),
      entry('b', '2026-08-20T10:00:00', { mileage: 11_000, totalCost: 4000 }),
    ])!

    expect(result.spent).toBe(5000)
    expect(result.costPerKm).toBe(5)
  })

  it('заправки без одометра за пределами промежутка в счёт не идут', () => {
    const result = calculateCostPerKm([
      entry('before', '2026-07-01T10:00:00', { mileage: null, totalCost: 7777 }),
      entry('a', '2026-08-01T10:00:00', { mileage: 10_000 }),
      entry('b', '2026-08-20T10:00:00', { mileage: 11_000, totalCost: 5000 }),
      entry('after', '2026-09-01T10:00:00', { mileage: null, totalCost: 8888 }),
    ])!

    expect(result.spent).toBe(5000)
  })

  it('ни у одной заправки нет одометра — числа нет', () => {
    expect(
      calculateCostPerKm([
        entry('a', '2026-08-01T10:00:00'),
        entry('b', '2026-08-20T10:00:00'),
      ])
    ).toBeNull()
  })

  it('одометр только у одной заправки — считать не от чего', () => {
    expect(
      calculateCostPerKm([
        entry('a', '2026-08-01T10:00:00', { mileage: 10_000 }),
        entry('b', '2026-08-20T10:00:00'),
      ])
    ).toBeNull()
  })

  it('одинаковый одометр — деления на ноль не происходит', () => {
    expect(
      calculateCostPerKm([
        entry('a', '2026-08-01T10:00:00', { mileage: 10_000 }),
        entry('b', '2026-08-20T10:00:00', { mileage: 10_000 }),
      ])
    ).toBeNull()
  })

  it('пустой список — не падает', () => {
    expect(calculateCostPerKm([])).toBeNull()
  })
})

describe('calculateConsumptionSeries', () => {
  it('берёт только посчитанные отрезки и помечает выбросы', () => {
    const points = calculateConsumptionSeries([
      segment('2026-08-01T00:00:00', 9),
      { ...segment('2026-08-10T00:00:00', 0), consumption: null, status: 'missed-entry' },
      segment('2026-08-20T00:00:00', 14, { status: 'outlier' }),
    ])

    expect(points.map((p) => p.consumption)).toEqual([9, 14])
    expect(points.map((p) => p.isOutlier)).toEqual([false, true])
  })
})

describe('detectConsumptionRise', () => {
  /** N ровных промежутков по 9 л/100, раз в месяц назад от указанного года. */
  function history(count: number, consumption = 9, year = 2026, startMonth = 0): FuelSegment[] {
    return Array.from({ length: count }, (_, i) =>
      segment(new Date(year, startMonth + i, 10).toISOString(), consumption)
    )
  }

  it(`молчит, пока промежутков меньше ${MIN_SEGMENTS_FOR_HEALTH_SIGNAL}`, () => {
    const segments = [...history(2), ...history(3, 20, 2026, 3)]
    expect(segments).toHaveLength(5)
    expect(detectConsumptionRise(segments)).toBeNull()
  })

  it('молчит, когда расход держится', () => {
    expect(detectConsumptionRise(history(8))).toBeNull()
  })

  it('молчит на сезонном разбросе — иначе будет кричать каждый ноябрь', () => {
    // +18%: столько честно даёт зима. Наблюдение об этом молчит.
    const segments = [...history(5, 9), ...history(3, 10.6, 2026, 5)]
    expect(detectConsumptionRise(segments)).toBeNull()
  })

  it('молчит, когда высокий только последний промежуток', () => {
    // Один промежуток — не тренд: окно из трёх усредняет его обратно к норме.
    const segments = [...history(7, 9), ...history(1, 16, 2026, 7)]
    expect(detectConsumptionRise(segments)).toBeNull()
  })

  it('срабатывает, когда последние промежутки заметно выше нормы машины', () => {
    const segments = [...history(5, 9), ...history(3, 12, 2026, 5)]
    const rise = detectConsumptionRise(segments)!

    expect(rise.recentConsumption).toBeCloseTo(12, 6)
    expect(rise.baselineConsumption).toBeCloseTo(9, 6)
    expect(rise.risePercent).toBeCloseTo(1 / 3, 6)
    expect(rise.recentSegments).toBe(3)
    expect(rise.seasonMatched).toBe(false)
  })

  it('срабатывает на неровном росте — середина окна поднята, а не один хвост', () => {
    // 10, 12, 14 при норме 9: и среднее, и середина окна выше порога.
    const segments = [
      ...history(5, 9),
      segment('2026-06-10T00:00:00', 10),
      segment('2026-07-10T00:00:00', 12),
      segment('2026-08-10T00:00:00', 14),
    ]
    expect(detectConsumptionRise(segments)).not.toBeNull()
  })

  it('не срабатывает на падении расхода', () => {
    const segments = [...history(5, 12), ...history(3, 8, 2026, 5)]
    expect(detectConsumptionRise(segments)).toBeNull()
  })

  it('выбросы в сравнение не идут', () => {
    // Три выброса по 20 л/100 не должны ни задрать «сейчас», ни сдвинуть норму.
    const segments = [
      ...history(6, 9),
      ...history(3, 20, 2026, 6).map((s) => ({ ...s, status: 'outlier' as const })),
    ]
    expect(detectConsumptionRise(segments)).toBeNull()
  })

  it('когда есть те же месяцы прошлого года, норма берётся из них', () => {
    // Прошлой зимой машина ела 11 — значит нынешние 11 это не рост, а декабрь.
    const lastWinter = [
      segment('2025-11-15T00:00:00', 11),
      segment('2025-12-15T00:00:00', 11),
      segment('2026-01-15T00:00:00', 11),
    ]
    const summer = [
      segment('2026-06-15T00:00:00', 9),
      segment('2026-07-15T00:00:00', 9),
      segment('2026-08-15T00:00:00', 9),
    ]
    const thisWinter = [
      segment('2026-11-15T00:00:00', 11),
      segment('2026-12-15T00:00:00', 11),
      segment('2027-01-15T00:00:00', 11),
    ]

    expect(detectConsumptionRise([...lastWinter, ...summer, ...thisWinter])).toBeNull()
  })

  it('сезонная норма даёт заметить рост, который годовая бы спрятала', () => {
    // Те же зимы, но нынешняя — 13 вместо прошлогодних 11. Против всей истории
    // (медиана 9.5) это +37%, против прошлой зимы +18% — и сказано это может
    // быть прямо, без оговорки про похолодание.
    const lastWinter = [
      segment('2025-11-15T00:00:00', 11),
      segment('2025-12-15T00:00:00', 11),
      segment('2026-01-15T00:00:00', 11),
    ]
    const summer = [
      segment('2026-06-15T00:00:00', 8),
      segment('2026-07-15T00:00:00', 8),
      segment('2026-08-15T00:00:00', 8),
    ]
    const thisWinter = [
      segment('2026-11-15T00:00:00', 13),
      segment('2026-12-15T00:00:00', 13),
      segment('2027-01-15T00:00:00', 13),
    ]

    const rise = detectConsumptionRise([...lastWinter, ...summer, ...thisWinter])!
    expect(rise.seasonMatched).toBe(true)
    expect(rise.baselineConsumption).toBeCloseTo(11, 6)
    expect(rise.risePercent).toBeCloseTo(2 / 11, 6)
  })
})

describe('detectMissedFillUp', () => {
  /** Заправки через каждые `step` км, начиная с 10 000. */
  function regular(count: number, step = 500): FuelStatsEntry[] {
    return Array.from({ length: count }, (_, i) =>
      entry(`e${i}`, new Date(2026, 5, 1 + i * 10).toISOString(), { mileage: 10_000 + i * step })
    )
  }

  it('молчит, пока промежутков между заправками меньше трёх', () => {
    // Три заправки дают два промежутка — на медиану этого не хватает, а
    // выдуманный порог хуже, чем его отсутствие.
    expect(detectMissedFillUp({ entries: regular(3), currentMileage: 99_000 })).toBeNull()
  })

  it('молчит, когда пробег в пределах обычного', () => {
    const entries = regular(5) // последняя на 12 000, обычный промежуток 500
    expect(detectMissedFillUp({ entries, currentMileage: 12_600 })).toBeNull()
  })

  it(`молчит ровно на пороге в ${MISSED_FILL_UP_FACTOR} обычного пробега`, () => {
    const entries = regular(5)
    expect(detectMissedFillUp({ entries, currentMileage: 12_000 + 750 })).toBeNull()
  })

  it('срабатывает, когда машина проехала больше, чем когда-либо между заправками', () => {
    const entries = regular(5)
    const missed = detectMissedFillUp({ entries, currentMileage: 13_000 })!

    expect(missed.kmSinceLastEntry).toBe(1000)
    expect(missed.typicalKm).toBe(500)
    expect(missed.lastEntryMileage).toBe(12_000)
    expect(missed.lastEntryDate.getFullYear()).toBe(2026)
  })

  it('порог берётся из истории машины, а не из числа километров', () => {
    // Той же 1 000 км после заправки хватило бы у экономной машины и не хватает
    // у прожорливой: у этой обычный промежуток — 1 200 км.
    const entries = regular(5, 1_200)
    expect(detectMissedFillUp({ entries, currentMileage: entries[4].mileage! + 1_000 })).toBeNull()
  })

  it('заправка без одометра внутри истории медиану не портит', () => {
    // regular(5) заканчивается 10 июля, так что эта запись лежит в середине.
    const entries = [
      ...regular(5),
      entry('no-mileage', '2026-06-15T10:00:00', { mileage: null }),
      entry('last', '2026-07-20T10:00:00', { mileage: 12_500 }),
    ]
    const missed = detectMissedFillUp({ entries, currentMileage: 13_500 })!
    expect(missed.typicalKm).toBe(500)
    expect(missed.lastEntryMileage).toBe(12_500)
  })

  it('молчит, когда у самой свежей заправки одометра нет', () => {
    // Тот самый случай, ради которого поле nullable: человек не посмотрел на
    // одометр, но заправку внёс. Мерить от предыдущей значит предложить ему
    // внести запись, которая уже есть в списке.
    const entries = [
      ...regular(5), // последняя с пробегом — 12 000
      entry('no-mileage', '2026-08-01T10:00:00', { mileage: null }),
    ]
    expect(detectMissedFillUp({ entries, currentMileage: 13_000 })).toBeNull()
  })

  it('снова заговаривает, как только у свежей заправки одометр появился', () => {
    const entries = [
      ...regular(5),
      entry('with-mileage', '2026-08-01T10:00:00', { mileage: 12_400 }),
    ]
    const missed = detectMissedFillUp({ entries, currentMileage: 13_400 })!
    expect(missed.lastEntryMileage).toBe(12_400)
    expect(missed.kmSinceLastEntry).toBe(1_000)
  })

  it('одометр не вырос с последней заправки — молчит', () => {
    const entries = regular(5)
    expect(detectMissedFillUp({ entries, currentMileage: 12_000 })).toBeNull()
  })

  it('пустая история — не падает', () => {
    expect(detectMissedFillUp({ entries: [], currentMileage: 50_000 })).toBeNull()
  })
})
