import { FuelConsumptionStats, FuelSegment, FuelSegmentStatus } from '@shared/types'

export interface FuelEntryData {
  id: string
  mileage: number | null
  date: Date
  liters: number
  isFullTank: boolean
  hasMissedEntry: boolean
}

/**
 * Сколько посчитанных отрезков нужно, прежде чем вообще искать выбросы.
 * На двух отрезках «медиана» — это просто один из них, и любое честное
 * расхождение между ними выглядит выбросом.
 */
export const MIN_SEGMENTS_FOR_OUTLIER_DETECTION = 3

/**
 * Насколько отрезок должен разойтись с медианой той же машины, чтобы считаться
 * ошибкой записи, а не разбросом езды.
 *
 * Почему 35%: зима против лета даёт примерно 10–20%, город против трассы — до
 * ~30%. Это нормальная жизнь, и порог обязан её пропускать. Ошибки записи
 * выглядят иначе: незаписанная заправка приписывает отрезку весь пробег, но
 * только часть литров — расход проваливается вдвое; заправка, отмеченная
 * «до полного» по ошибке, задирает следующий отрезок примерно так же. 35% лежит
 * выше разброса езды и заметно ниже подписи ошибки.
 *
 * Центр — медиана, а не среднее: медиана трёх значений не сдвигается от одного
 * испорченного, а среднее сдвигается, и порог начинает мерить от кривого центра.
 */
export const OUTLIER_DEVIATION_RATIO = 0.35

/**
 * Хронологический порядок. Одинаковые даты (две заправки в один день — обычное
 * дело в поездке) разводим по одометру, а полностью одинаковые записи — по id,
 * чтобы порядок был устойчивым, а не зависел от того, как база вернула строки.
 * Запись без одометра при равной дате уходит назад: она всё равно не может быть
 * концом отрезка, зато её литры попадут в отрезок, который заканчивается позже.
 */
function sortChronologically(entries: FuelEntryData[]): FuelEntryData[] {
  return [...entries].sort((a, b) => {
    const byDate = new Date(a.date).getTime() - new Date(b.date).getTime()
    if (byDate !== 0) return byDate

    if (a.mileage !== b.mileage) {
      if (a.mileage === null) return -1
      if (b.mileage === null) return 1
      return a.mileage - b.mileage
    }

    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
  })
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

/**
 * Расход топлива по заправкам одной машины.
 *
 * Считать его можно только между двумя подряд идущими заправками «до полного»:
 *
 *   расстояние = одометр закрывающей − одометр открывающей
 *   литры      = всё, что залито ПОСЛЕ открывающей и по закрывающую включительно
 *   расход     = литры / расстояние × 100
 *
 * Литры самой открывающей заправки не в счёт: они наполнили тот бак, который
 * потом и был израсходован. Неполные заправки внутри отрезка, наоборот, входят
 * в сумму — это топливо тоже сгорело на этом расстоянии.
 *
 * Запись без одометра внутри отрезка отрезок не ломает: расстояние меряется по
 * концам, а её литры так же уходят в сумму. Не посчитаться отрезок может по
 * четырём причинам, каждая из них — в `status` (см. FuelSegmentStatus).
 */
export function calculateFuelConsumption(entries: FuelEntryData[]): FuelConsumptionStats {
  const sorted = sortChronologically(entries)
  const fullTankIndexes = sorted
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => entry.isFullTank)
    .map(({ index }) => index)

  const segments: FuelSegment[] = []

  for (let i = 0; i < fullTankIndexes.length - 1; i++) {
    const openIndex = fullTankIndexes[i]
    const closeIndex = fullTankIndexes[i + 1]
    const open = sorted[openIndex]
    const close = sorted[closeIndex]
    // Всё после открывающей и по закрывающую включительно.
    const consumed = sorted.slice(openIndex + 1, closeIndex + 1)
    const liters = consumed.reduce((sum, entry) => sum + entry.liters, 0)

    // Пользователь сам сказал, что запись пропущена — литров в сумме не хватает.
    // Признак на открывающей заправке относится к предыдущему отрезку, а её
    // литры сюда и так не идут, поэтому этот отрезок он не портит.
    const missedEntry = consumed.some((entry) => entry.hasMissedEntry)
    const distanceKm =
      open.mileage !== null && close.mileage !== null ? close.mileage - open.mileage : null

    let status: FuelSegmentStatus = 'ok'
    if (missedEntry) status = 'missed-entry'
    else if (distanceKm === null) status = 'missing-mileage'
    else if (distanceKm <= 0) status = 'no-distance'

    segments.push({
      fromEntryId: open.id,
      toEntryId: close.id,
      fromDate: open.date,
      toDate: close.date,
      distanceKm,
      liters,
      consumption: status === 'ok' ? (liters / distanceKm!) * 100 : null,
      status,
    })
  }

  const computable = segments.filter((segment) => segment.consumption !== null)

  // Выбросы ищем в обе стороны: заниженный расход почти всегда значит
  // незаписанную заправку (пробег посчитан, топливо — нет), завышенный — что
  // «до полного» отмечено там, где бак не долили.
  if (computable.length >= MIN_SEGMENTS_FOR_OUTLIER_DETECTION) {
    const center = median(computable.map((segment) => segment.consumption!))
    // Нулевая медиана означала бы, что половина отрезков прошла без топлива;
    // относительное отклонение от неё не определено, так что не гадаем.
    if (center > 0) {
      for (const segment of computable) {
        const deviation = Math.abs(segment.consumption! - center) / center
        if (deviation > OUTLIER_DEVIATION_RATIO) segment.status = 'outlier'
      }
    }
  }

  const included = segments.filter((segment) => segment.status === 'ok')
  const totalDistance = included.reduce((sum, segment) => sum + segment.distanceKm!, 0)
  const totalLiters = included.reduce((sum, segment) => sum + segment.liters, 0)

  return {
    segments,
    // Среднее взвешено по расстоянию, а не по числу отрезков: отрезок в 900 км
    // говорит о расходе машины больше, чем отрезок в 50 км, и не должен весить
    // столько же.
    averageConsumption: totalDistance > 0 ? (totalLiters / totalDistance) * 100 : null,
    basedOnSegments: included.length,
  }
}
