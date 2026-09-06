/**
 * Российский фискальный QR с чека — это строка запроса:
 *
 *   t=20260905T1230&s=2500.00&fn=9960440301234567&i=12345&fp=1234567890&n=1
 *
 * Нас интересуют `t` (дата и время) и `s` (сумма). Остальное — фискальные
 * идентификаторы: `fn` (номер фискального накопителя), `i` (номер документа),
 * `fp` (фискальный признак), `n` (тип операции). Сами по себе они ничего не
 * говорят, но именно они — ключ к будущему запросу в ОФД/ФНС, который вернёт
 * состав чека: литры, марку топлива и название заправки. Поэтому они
 * сохраняются в разобранном виде, хотя сегодня форма их не показывает.
 */
export interface FuelReceiptQr {
  /** Момент чека. null, если `t` не было или оно нечитаемо. */
  date: Date | null
  /** Итог по чеку в рублях. null, если `s` не было или оно нечитаемо. */
  totalCost: number | null
  /** Ключ к будущему запросу за составом чека — см. заголовок файла. */
  fiscal: {
    fn: string | null
    i: string | null
    fp: string | null
    n: string | null
  }
}

/** `yyyyMMddTHHmm`, иногда с секундами. */
const RECEIPT_DATE = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?$/

/**
 * Время на чеке — местное время той колонки, а не UTC: смещения в строке нет.
 * Собираем через конструктор с полями, он читает их как локальные, и проверяем
 * результат — `new Date(2026, 12, 40)` молча переезжает в следующий месяц.
 */
function parseReceiptDate(value: string): Date | null {
  const match = RECEIPT_DATE.exec(value)
  if (!match) return null

  const [, year, month, day, hours, minutes, seconds] = match
  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hours),
    Number(minutes),
    seconds ? Number(seconds) : 0
  )

  const rolledOver =
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)

  return rolledOver ? null : date
}

/** Сумма приходит как `2500.00`, но встречается и запятая. */
function parseReceiptSum(value: string): number | null {
  const normalized = value.replace(',', '.').trim()
  if (!/^\d+(\.\d+)?$/.test(normalized)) return null

  const sum = Number(normalized)
  return Number.isFinite(sum) ? sum : null
}

/**
 * Разбирает QR с чека. Никогда не бросает: нечитаемый код — это «не прочиталось»,
 * а не падение экрана сканера.
 *
 * Возвращает null, когда из кода не удалось вытащить ни дату, ни сумму — то есть
 * когда он не дал бы форме ничего. Если читается только одно из двух (сумма есть,
 * дата битая), возвращается частичный результат: подставить сумму и оставить
 * сегодняшнюю дату полезнее, чем отказаться от всего чека.
 *
 * Ссылка ОФД вида `https://ofd.ru/check?t=...&s=...` разбирается тоже — это тот
 * же чек, просто завёрнутый в URL. Ссылка без этих полей даст null.
 */
export function parseFuelReceiptQr(raw: string): FuelReceiptQr | null {
  if (typeof raw !== 'string') return null

  const trimmed = raw.trim()
  if (!trimmed) return null

  // Всё до `?` — путь ссылки, если это ссылка; в голом фискальном коде `?` нет.
  const queryStart = trimmed.indexOf('?')
  const query = queryStart === -1 ? trimmed : trimmed.slice(queryStart + 1)

  const params = new Map<string, string>()
  for (const pair of query.split('&')) {
    const separator = pair.indexOf('=')
    if (separator <= 0) continue

    const key = pair.slice(0, separator).trim()
    // Значение может быть процент-кодированным; битую кодировку глотаем.
    let value = pair.slice(separator + 1)
    try {
      value = decodeURIComponent(value)
    } catch {
      // оставляем как есть
    }
    // Первое вхождение выигрывает: дубль ключа — испорченный код, а не команда
    // «возьми последнее».
    if (!params.has(key)) params.set(key, value)
  }

  const date = parseReceiptDate(params.get('t') ?? '')
  const totalCost = parseReceiptSum(params.get('s') ?? '')

  if (date === null && totalCost === null) return null

  return {
    date,
    totalCost,
    fiscal: {
      fn: params.get('fn') ?? null,
      i: params.get('i') ?? null,
      fp: params.get('fp') ?? null,
      n: params.get('n') ?? null,
    },
  }
}
