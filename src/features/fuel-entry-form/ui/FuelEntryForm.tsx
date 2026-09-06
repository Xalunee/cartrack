'use client'

import { useEffect, type ReactNode } from 'react'
import { useForm, useWatch, type DefaultValues } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ApiError } from '@shared/api/client'
import type { FuelReceiptQr } from '@shared/lib/fuel-receipt-qr'
import { pricePerLiter } from '@entities/fuel-entry'
import { fuelEntrySchema, FUEL_TYPES, type FuelEntryFormValues } from '../model/schema'
import { SuggestingInput } from './SuggestingInput'

/** A `yyyy-MM-dd` value for a date input, in the user's own timezone. */
export function toDateInputValue(date: Date): string {
  const offsetMs = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 10)
}

interface FuelEntryFormProps {
  /**
   * Partial on purpose: on a new entry the litres and the sum start empty, and
   * an empty required number is `undefined`, not a zero the user has to clear.
   */
  defaultValues: DefaultValues<FuelEntryFormValues>
  /** The user's own past stations, newest first. */
  stations: string[]
  submitLabel: string
  pending: boolean
  error?: Error | null
  onSubmit: (values: FuelEntryFormValues) => void
  onCancel: () => void
  /** A scanned receipt, applied to the fields it can fill. */
  prefill?: FuelReceiptQr | null
  /** The scanner, on the page that has one. */
  children?: ReactNode
}

export function FuelEntryForm({
  defaultValues,
  stations,
  submitLabel,
  pending,
  error,
  onSubmit,
  onCancel,
  prefill,
  children,
}: FuelEntryFormProps) {
  const form = useForm<FuelEntryFormValues>({
    resolver: zodResolver(fuelEntrySchema),
    defaultValues,
  })

  // A scan fills in what it read and leaves the rest alone: litres are never on
  // the receipt QR, and the date is only overwritten when the code actually
  // carried one, so a partial read never wipes a field the user already typed.
  useEffect(() => {
    if (!prefill) return
    if (prefill.date) {
      form.setValue('date', toDateInputValue(prefill.date), { shouldValidate: true })
    }
    if (prefill.totalCost !== null) {
      form.setValue('totalCost', prefill.totalCost, { shouldValidate: true })
    }
  }, [prefill, form])

  // `useWatch` rather than `form.watch`: the latter hands back a fresh function
  // on every render, which the React Compiler refuses to memoize around.
  const liters = useWatch({ control: form.control, name: 'liters' })
  const totalCost = useWatch({ control: form.control, name: 'totalCost' })
  const perLiter =
    typeof liters === 'number' && typeof totalCost === 'number'
      ? pricePerLiter({ liters, totalCost })
      : null

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {children}

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="liters"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Литры</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    placeholder="42,5"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(event) =>
                      field.onChange(event.target.value ? Number(event.target.value) : undefined)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="totalCost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Сумма (₽)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    placeholder="2500"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(event) =>
                      field.onChange(event.target.value ? Number(event.target.value) : undefined)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {perLiter !== null && (
          <p className="text-muted-foreground -mt-2 text-xs tabular-nums">
            {perLiter.toLocaleString('ru', { maximumFractionDigits: 2 })} ₽ за литр
          </p>
        )}

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Дата</FormLabel>
              <FormControl>
                <Input type="date" className="w-full min-w-0 text-sm" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="mileage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Пробег (км), если посмотрели</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  inputMode="numeric"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(event) =>
                    field.onChange(event.target.value ? Number(event.target.value) : undefined)
                  }
                />
              </FormControl>
              <p className="text-muted-foreground text-xs">
                Без пробега заправка попадёт в расходы, но в расчёте расхода не участвует.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isFullTank"
          render={({ field }) => (
            <FormItem>
              <div className="rounded-md border p-3">
                <label className="flex cursor-pointer items-start gap-2.5">
                  <FormControl>
                    <input
                      type="checkbox"
                      className="accent-primary mt-0.5 h-4 w-4 flex-shrink-0"
                      checked={field.value}
                      onChange={(event) => field.onChange(event.target.checked)}
                    />
                  </FormControl>
                  <span className="text-sm">Залил до полного</span>
                </label>
                <p className="text-muted-foreground mt-1.5 ml-[1.625rem] text-xs">
                  Расход считается от одного полного бака до другого. Неполные заправки между
                  ними учитываются, но сами по себе числа не дают.
                </p>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="hasMissedEntry"
          render={({ field }) => (
            <FormItem>
              <div className="rounded-md border p-3">
                <label className="flex cursor-pointer items-start gap-2.5">
                  <FormControl>
                    <input
                      type="checkbox"
                      className="accent-primary mt-0.5 h-4 w-4 flex-shrink-0"
                      checked={field.value}
                      onChange={(event) => field.onChange(event.target.checked)}
                    />
                  </FormControl>
                  <span className="text-sm">Была заправка, которую я не внёс</span>
                </label>
                <p className="text-muted-foreground mt-1.5 ml-[1.625rem] text-xs">
                  Лучше внести пропущенную заправку отдельной записью с её датой — тогда расход
                  посчитается. Этот флажок — на случай, когда чека уже нет: он честно исключит
                  промежуток из расчёта.
                </p>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="station"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Заправка</FormLabel>
              <FormControl>
                <SuggestingInput
                  items={stations}
                  placeholder="Лукойл на Ленина"
                  value={field.value ?? ''}
                  onValueChange={field.onChange}
                  emptyText="Впишите название сами"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fuelType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Топливо</FormLabel>
              <FormControl>
                <SuggestingInput
                  items={[...FUEL_TYPES]}
                  placeholder="АИ-95"
                  value={field.value ?? ''}
                  onValueChange={field.onChange}
                  emptyText="Впишите марку сами"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Заметка</FormLabel>
              <FormControl>
                <Textarea
                  className="min-h-[72px] resize-none"
                  placeholder="Дальняя поездка, трасса"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onCancel}>
            Отмена
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? 'Сохранение...' : submitLabel}
          </Button>
        </div>

        {error && (
          <div className="text-destructive space-y-0.5 text-sm">
            <p>{error.message || 'Ошибка'}</p>
            {error instanceof ApiError && error.suggestion && (
              <p className="text-xs">{error.suggestion}</p>
            )}
          </div>
        )}
      </form>
    </Form>
  )
}
