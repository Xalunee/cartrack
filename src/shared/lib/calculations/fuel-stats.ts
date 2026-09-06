import { startOfMonth } from 'date-fns'
import type { FuelSegment } from '@shared/types'

/**
 * Всё в этом файле выводится из уже имеющихся данных — записей о заправках и
 * отрезков расхода из `fuel.ts`. Ни одного нового поля в базе и ни одного нового
 * запроса за этим не стоит.
 */
export interface FuelStatsEntry {
  id: string
  date: Date
  mileage: number | null
  liters: number
  totalCost: number
  station?: string | null
}

function byDateAsc<T extends { date: Date }>(entries: T[]): T[] {
  return [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

// --- Траты ---

export interface FuelSpendingMonth {
  /** Первое число месяца — ось графика строит UI. */
  start: Date
  spent: number
  liters: number
}

export interface FuelSpending {
  /** За всё время: число, которое период не меняет. */
  total: number
  periodTotal: number
  periodLiters: number
  /**
   * Помесячно от начала периода до `now` включительно — с пустыми месяцами.
   * Без них график сжимает паузу в тратах и рисует два соседних столбика там,
   * где между заправками прошло полгода.
   */
  months: FuelSpendingMonth[]
}

/**
 * Потрачено на топливо за всё время. Отдельно от `calculateFuelSpending`,
 * потому что вызывающему, которому нужен только итог, незачем строить помесячные
 * столбики: на профиле «за всё время» — это сотни пустых месяцев ради одного
 * числа.
 */
export function totalFuelSpent(entries: FuelStatsEntry[]): number {
  return entries.reduce((sum, entry) => sum + entry.totalCost, 0)
}

export function calculateFuelSpending(
  entries: FuelStatsEntry[],
  { periodStart, now }: { periodStart: Date; now: Date }
): FuelSpending {
  const months: FuelSpendingMonth[] = []
  const cursor = startOfMonth(periodStart)
  const last = startOfMonth(now)

  for (
    let month = new Date(cursor);
    month.getTime() <= last.getTime();
    month = new Date(month.getFullYear(), month.getMonth() + 1, 1)
  ) {
    months.push({ start: month, spent: 0, liters: 0 })
  }

  const byMonth = new Map(months.map((month) => [month.start.getTime(), month]))

  const total = totalFuelSpent(entries)
  let periodTotal = 0
  let periodLiters = 0

  for (const entry of entries) {
    const date = new Date(entry.date)
    if (date.getTime() < periodStart.getTime()) continue

    periodTotal += entry.totalCost
    periodLiters += entry.liters

    // Заправка позже `now` (дата на день вперёд из-за часового пояса) в период
    // входит, но своего столбика не имеет — кладём её в последний.
    const bucket = byMonth.get(startOfMonth(date).getTime()) ?? months[months.length - 1]
    if (bucket) {
      bucket.spent += entry.totalCost
      bucket.liters += entry.liters
    }
  }

  return { total, periodTotal, periodLiters, months }
}

// --- Цена литра ---

export interface PricePoint {
  date: Date
  pricePerLiter: number
  station: string | null
}

/**
 * Цена литра по каждой заправке. Хранить её незачем — это `totalCost / liters`.
 *
 * Фильтр по заправке существует не для красоты: без него скачок цены на графике
 * неотличим от поездки на другую АЗС, и пользователь видит «бензин подорожал»
 * там, где он просто заправился в другом месте.
 */
export function calculatePriceSeries(
  entries: FuelStatsEntry[],
  { station }: { station?: string | null } = {}
): PricePoint[] {
  return byDateAsc(entries)
    .filter((entry) => entry.liters > 0)
    .filter((entry) => !station || (entry.station ?? null) === station)
    .map((entry) => ({
      date: new Date(entry.date),
      pricePerLiter: entry.totalCost / entry.liters,
      station: entry.station ?? null,
    }))
}

/** Заправки, названные больше одного раза — только по ним фильтр имеет смысл. */
export function stationsWorthFiltering(entries: FuelStatsEntry[]): string[] {
  const counts = new Map<string, number>()
  for (const entry of entries) {
    const station = entry.station?.trim()
    if (station) counts.set(station, (counts.get(station) ?? 0) + 1)
  }
  return [...counts.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([station]) => station)
}

// --- Рубли на километр ---

export interface CostPerKm {
  costPerKm: number
  distanceKm: number
  /** Потрачено на топливо, сгоревшее на этом расстоянии. */
  spent: number
  basedOnEntries: number
}

/**
 * Сколько стоит километр. Ради этого числа секция и нужна: оно превращает
 * «потратил 40 000» в величину, которую есть с чем сравнить.
 *
 * Считается по тому же правилу, что и расход: расстояние — между первой и
 * последней заправкой с одометром, деньги — все заправки ПОСЛЕ первой. Топливо
 * первой заправки наполнило бак, сгоревший до неё, и в этот километраж не
 * попадало. Заправки без одометра внутри промежутка в деньги идут: их топливо
 * сгорело на этом же расстоянии.
 *
 * null, когда одометр записан меньше чем у двух заправок или машина между ними
 * не проехала ничего.
 */
export function calculateCostPerKm(entries: FuelStatsEntry[]): CostPerKm | null {
  const sorted = byDateAsc(entries)
  const withMileage = sorted.filter((entry) => entry.mileage !== null)
  if (withMileage.length < 2) return null

  const first = withMileage[0]
  const last = withMileage[withMileage.length - 1]
  const distanceKm = last.mileage! - first.mileage!
  if (distanceKm <= 0) return null

  const firstIndex = sorted.indexOf(first)
  const lastIndex = sorted.indexOf(last)
  const counted = sorted.slice(firstIndex + 1, lastIndex + 1)
  const spent = counted.reduce((sum, entry) => sum + entry.totalCost, 0)

  return { costPerKm: spent / distanceKm, distanceKm, spent, basedOnEntries: counted.length }
}

// --- Расход во времени ---

export interface ConsumptionPoint {
  date: Date
  consumption: number
  /** Помеченный выброс: рисуем, но в тренд и в среднее он не идёт. */
  isOutlier: boolean
}

export function calculateConsumptionSeries(segments: FuelSegment[]): ConsumptionPoint[] {
  return segments
    .filter((segment) => segment.consumption !== null)
    .map((segment) => ({
      date: new Date(segment.toDate),
      consumption: segment.consumption!,
      isOutlier: segment.status === 'outlier',
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
}

// --- Рост расхода как наблюдение ---

/**
 * Сколько промежутков нужно, чтобы у машины вообще была своя норма. Три — это
 * не история, это три поездки. Шесть полных баков — это два-три месяца обычной
 * езды, за которые успевают смешаться и город, и трасса.
 */
export const MIN_SEGMENTS_FOR_HEALTH_SIGNAL = 6

/** Последние N промежутков — «сейчас». Один высокий промежуток не тренд. */
export const RECENT_WINDOW = 3

/**
 * Порог, когда сравнивать не с чем, кроме всей истории машины. Зима честно даёт
 * 10–20%, город против трассы — до 30%, и наблюдение, которое срабатывает на
 * этом, будет срабатывать каждый ноябрь и перестанет что-либо значить. 25% —
 * выше сезонного разброса; и всё равно в тексте наблюдения сезон упоминается,
 * потому что исключить его этим порогом нельзя, только отодвинуть.
 */
export const RISE_THRESHOLD_PLAIN = 0.25

/**
 * Порог, когда норму удалось взять из тех же месяцев прошлых лет. Сезон в таком
 * сравнении уже вычтен — обе стороны мерены в один и тот же ноябрь, — поэтому
 * планку можно опустить до величины, которую сама по себе езда объясняет редко.
 */
export const RISE_THRESHOLD_SEASONAL = 0.12

export interface ConsumptionRise {
  recentConsumption: number
  baselineConsumption: number
  /** Насколько «сейчас» выше нормы, в долях (0.18 — на 18%). */
  risePercent: number
  recentSegments: number
  baselineSegments: number
  /**
   * Норма взята из тех же календарных месяцев прошлых лет. Если да — сезон из
   * сравнения исключён и об этом можно говорить прямо; если нет — часть роста
   * может быть просто похолоданием, и текст обязан это признать.
   */
  seasonMatched: boolean
}

/**
 * Насколько старше окна должен быть промежуток, чтобы считаться «тем же сезоном
 * год назад». Не «другой календарный год»: окно из трёх заправок легко ложится
 * на ноябрь–январь, и тогда январь той же зимы оказывался бы уже «прошлым
 * годом», а ноябрь прошлой — «этим». 300 дней — это заведомо прошлый цикл и при
 * этом меньше года, так что ноябрь против ноября проходит.
 */
export const SEASON_LOOKBACK_MIN_DAYS = 300

/** Круговое расстояние между месяцами: декабрь и январь — соседи. */
function monthDistance(a: number, b: number): number {
  const diff = Math.abs(a - b)
  return Math.min(diff, 12 - diff)
}

/**
 * Расход последних заправок против собственной нормы машины.
 *
 * Это наблюдение, а не диагноз: рост расхода бывает от забитого фильтра,
 * свечей или спущенных шин — и точно так же от зимы, пробок и другого маршрута.
 * Поэтому здесь только два вывода: «выше нормы на N%» и «вот где посмотреть».
 *
 * Считается по промежуткам со статусом 'ok': выбросы уже отброшены шагом 1, и
 * пропущенная заправка не должна выдавать себя за исправную машину.
 */
export function detectConsumptionRise(segments: FuelSegment[]): ConsumptionRise | null {
  const ok = segments
    .filter((segment) => segment.status === 'ok' && segment.consumption !== null)
    .sort((a, b) => new Date(a.toDate).getTime() - new Date(b.toDate).getTime())

  if (ok.length < MIN_SEGMENTS_FOR_HEALTH_SIGNAL) return null

  const recent = ok.slice(-RECENT_WINDOW)
  const earlier = ok.slice(0, -RECENT_WINDOW)

  // «Сейчас» — среднее, взвешенное по расстоянию, как и общее среднее: короткий
  // промежуток не должен весить столько же, сколько поездка через полстраны.
  const recentDistance = recent.reduce((sum, segment) => sum + segment.distanceKm!, 0)
  const recentLiters = recent.reduce((sum, segment) => sum + segment.liters, 0)
  if (recentDistance <= 0) return null
  const recentConsumption = (recentLiters / recentDistance) * 100

  const recentMonths = recent.map((segment) => new Date(segment.toDate).getMonth())
  const windowStart = new Date(recent[0].toDate).getTime()
  const seasonCutoff = windowStart - SEASON_LOOKBACK_MIN_DAYS * 86_400_000
  const seasonal = earlier.filter((segment) => {
    const date = new Date(segment.toDate)
    if (date.getTime() > seasonCutoff) return false
    return recentMonths.some((month) => monthDistance(month, date.getMonth()) <= 1)
  })

  const seasonMatched = seasonal.length >= RECENT_WINDOW
  const baselineSource = seasonMatched ? seasonal : earlier
  // Медиана, а не среднее: одна испорченная запись не должна двигать норму,
  // от которой мерится всё остальное.
  const baselineConsumption = median(baselineSource.map((segment) => segment.consumption!))
  if (baselineConsumption <= 0) return null

  const risePercent = (recentConsumption - baselineConsumption) / baselineConsumption
  const threshold = seasonMatched ? RISE_THRESHOLD_SEASONAL : RISE_THRESHOLD_PLAIN
  if (risePercent <= threshold) return null

  // Один высокий промежуток — ещё не тренд, а среднее по трём он вытягивает
  // сам: 9, 9 и 16 дают +26% при норме 9, и наблюдение сработало бы на одной
  // дальней поездке с прицепом. Поэтому середина окна обязана быть поднята
  // тоже — тогда за порогом стоят как минимум два промежутка из трёх.
  const medianRecent = median(recent.map((segment) => segment.consumption!))
  if ((medianRecent - baselineConsumption) / baselineConsumption <= threshold) return null

  return {
    recentConsumption,
    baselineConsumption,
    risePercent,
    recentSegments: recent.length,
    baselineSegments: baselineSource.length,
    seasonMatched,
  }
}

// --- Пропущенная заправка ---

/** Меньше трёх промежутков между заправками — это не привычка, а совпадение. */
export const MIN_GAPS_FOR_MISSED_FILL_UP = 3

/**
 * Во сколько раз пробег с последней заправки должен превысить обычный, чтобы
 * заправку почти наверняка забыли внести. Запас хода гуляет процентов на 30 —
 * трасса против города, полный бак против половины, — так что полтора обычных
 * пробега означают, что машина проехала больше, чем когда-либо проезжала между
 * заправками.
 */
export const MISSED_FILL_UP_FACTOR = 1.5

export interface MissedFillUp {
  kmSinceLastEntry: number
  /** Обычный пробег между заправками у этой машины — медиана её же истории. */
  typicalKm: number
  lastEntryDate: Date
  lastEntryMileage: number
}

/**
 * «Похоже, одну заправку вы не внесли».
 *
 * Не напоминание по календарю: порог берётся из собственной истории машины,
 * потому что 600 км — это три бака у одного и половина бака у другого. Пока
 * истории на медиану не хватает, наблюдение молчит: выдуманный порог хуже,
 * чем его отсутствие.
 */
export function detectMissedFillUp({
  entries,
  currentMileage,
}: {
  entries: FuelStatsEntry[]
  currentMileage: number
}): MissedFillUp | null {
  const sorted = byDateAsc(entries)
  const newest = sorted[sorted.length - 1]

  // Если у самой свежей заправки одометра нет — мерить не от чего, и молчание
  // здесь единственный честный ответ. Иначе получалось ровно то, ради чего поле
  // сделано nullable: человек не посмотрел на одометр, запись внесена, а мы
  // меряем от предыдущей — и предлагаем внести заправку, которая уже лежит в
  // списке двумя строками выше.
  if (!newest || newest.mileage === null) return null

  const withMileage = sorted.filter((entry) => entry.mileage !== null)
  if (withMileage.length < MIN_GAPS_FOR_MISSED_FILL_UP + 1) return null

  const gaps: number[] = []
  for (let i = 1; i < withMileage.length; i++) {
    const gap = withMileage[i].mileage! - withMileage[i - 1].mileage!
    if (gap > 0) gaps.push(gap)
  }
  if (gaps.length < MIN_GAPS_FOR_MISSED_FILL_UP) return null

  const typicalKm = median(gaps)
  if (typicalKm <= 0) return null

  const last = withMileage[withMileage.length - 1]
  const kmSinceLastEntry = currentMileage - last.mileage!
  if (kmSinceLastEntry <= typicalKm * MISSED_FILL_UP_FACTOR) return null

  return {
    kmSinceLastEntry,
    typicalKm,
    lastEntryDate: new Date(last.date),
    lastEntryMileage: last.mileage!,
  }
}
