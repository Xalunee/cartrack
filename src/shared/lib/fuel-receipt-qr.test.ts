import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { parseFuelReceiptQr } from '@shared/lib/fuel-receipt-qr'

const VALID = 't=20260905T1230&s=2500.00&fn=9960440301234567&i=12345&fp=1234567890&n=1'

beforeAll(() => {
  // Разбор от текущего времени не зависит, и это тоже утверждение теста.
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'))
})

afterAll(() => {
  vi.useRealTimers()
})

describe('parseFuelReceiptQr', () => {
  describe('нормальный чек', () => {
    it('читает дату, сумму и фискальные поля', () => {
      const parsed = parseFuelReceiptQr(VALID)

      expect(parsed).not.toBeNull()
      expect(parsed!.totalCost).toBe(2500)
      expect(parsed!.fiscal).toEqual({
        fn: '9960440301234567',
        i: '12345',
        fp: '1234567890',
        n: '1',
      })
    })

    it('читает время чека как местное, а не как UTC', () => {
      const parsed = parseFuelReceiptQr(VALID)
      const date = parsed!.date!

      expect(date.getFullYear()).toBe(2026)
      expect(date.getMonth()).toBe(8) // сентябрь
      expect(date.getDate()).toBe(5)
      expect(date.getHours()).toBe(12)
      expect(date.getMinutes()).toBe(30)
      expect(date.getSeconds()).toBe(0)
    })

    it('принимает форму с секундами', () => {
      const parsed = parseFuelReceiptQr('t=20260905T123045&s=100')
      expect(parsed!.date!.getSeconds()).toBe(45)
    })

    it('принимает запятую в сумме', () => {
      expect(parseFuelReceiptQr('t=20260905T1230&s=2500,50')!.totalCost).toBe(2500.5)
    })

    it('принимает целую сумму без копеек', () => {
      expect(parseFuelReceiptQr('t=20260905T1230&s=2500')!.totalCost).toBe(2500)
    })

    it('не спотыкается о неизвестные поля', () => {
      const parsed = parseFuelReceiptQr(`${VALID}&unknown=1&whatever=%D0%B0%D0%B7%D1%81`)
      expect(parsed!.totalCost).toBe(2500)
      expect(parsed!.fiscal.fn).toBe('9960440301234567')
    })

    it('разбирает ссылку ОФД с теми же полями', () => {
      const parsed = parseFuelReceiptQr('https://ofd.ru/check?t=20260905T1230&s=2500.00&fp=1')
      expect(parsed!.totalCost).toBe(2500)
      expect(parsed!.date).not.toBeNull()
    })
  })

  describe('полей не хватает', () => {
    it('нет суммы — отдаёт дату', () => {
      const parsed = parseFuelReceiptQr('t=20260905T1230&fn=996044')
      expect(parsed!.totalCost).toBeNull()
      expect(parsed!.date).not.toBeNull()
    })

    it('нет даты — отдаёт сумму, форма оставит сегодняшнюю дату', () => {
      const parsed = parseFuelReceiptQr('s=2500.00&fn=996044')
      expect(parsed!.date).toBeNull()
      expect(parsed!.totalCost).toBe(2500)
    })

    it('нет ни даты, ни суммы — читать нечего', () => {
      expect(parseFuelReceiptQr('fn=9960440301234567&i=12345&fp=1234567890')).toBeNull()
    })
  })

  describe('битые значения', () => {
    it('нечитаемая дата не отменяет сумму', () => {
      const parsed = parseFuelReceiptQr('t=05.09.2026&s=2500.00')
      expect(parsed!.date).toBeNull()
      expect(parsed!.totalCost).toBe(2500)
    })

    it('несуществующий день — это не дата, а не «первое октября»', () => {
      // 31 сентября: конструктор Date молча переехал бы на 1 октября.
      const parsed = parseFuelReceiptQr('t=20260931T1230&s=2500.00')
      expect(parsed!.date).toBeNull()
    })

    it('нечисловая сумма не отменяет дату', () => {
      const parsed = parseFuelReceiptQr('t=20260905T1230&s=много')
      expect(parsed!.totalCost).toBeNull()
      expect(parsed!.date).not.toBeNull()
    })

    it('отрицательная сумма не принимается', () => {
      expect(parseFuelReceiptQr('s=-100')).toBeNull()
    })
  })

  describe('это вообще не чек', () => {
    it('обычная ссылка', () => {
      expect(parseFuelReceiptQr('https://example.com/promo')).toBeNull()
    })

    it('пустая строка', () => {
      expect(parseFuelReceiptQr('')).toBeNull()
    })

    it('одни пробелы', () => {
      expect(parseFuelReceiptQr('   ')).toBeNull()
    })

    it('произвольный текст', () => {
      expect(parseFuelReceiptQr('Спасибо за покупку!')).toBeNull()
    })

    it('не строка вовсе — не падает', () => {
      // Декодер отдаёт `string`, но на этом пути стоит сеть, кэш и чужая
      // библиотека; поведение на мусоре должно быть определено, а не случайно.
      expect(parseFuelReceiptQr(null as unknown as string)).toBeNull()
      expect(parseFuelReceiptQr(undefined as unknown as string)).toBeNull()
      expect(parseFuelReceiptQr(42 as unknown as string)).toBeNull()
    })

    it('строка из одних разделителей', () => {
      expect(parseFuelReceiptQr('&&&===&&')).toBeNull()
    })
  })
})
