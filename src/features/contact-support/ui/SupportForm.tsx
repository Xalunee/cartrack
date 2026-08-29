'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { ImagePlus, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { useCreateSupportTicketMutation } from '@entities/support-ticket'
import { useMediaQuery } from '@shared/lib/client-env'
import { supportMessageField } from '@shared/lib/validation/support'
import { fileToScreenshotDataUrl } from '../model/screenshot'

// Only the message is a form field. The screenshot is held next to the form
// because it is a processed blob, not something the user types or can correct
// in place — and the technical context is not a field at all.
const formSchema = z.object({ message: supportMessageField() })

type FormValues = z.infer<typeof formSchema>

export function SupportForm() {
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [screenshotError, setScreenshotError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  // Clearing the picked file means remounting the input: touching
  // `fileInput.current.value` from the submit handler would be a ref read on a
  // path React can reach during render.
  const [fileInputKey, setFileInputKey] = useState(0)

  // Part of the silent context: whether they are in the installed app or a tab.
  // Only the browser knows this, so it is the one thing the client reports.
  const standalone = useMediaQuery('(display-mode: standalone)')

  const mutation = useCreateSupportTicketMutation()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { message: '' },
  })

  async function onPickFile(file: File | undefined) {
    if (!file) return
    setScreenshotError(null)
    try {
      setScreenshot(await fileToScreenshotDataUrl(file))
    } catch (e) {
      setScreenshot(null)
      setScreenshotError(e instanceof Error ? e.message : 'Не удалось прикрепить скриншот')
    }
  }

  function clearScreenshot() {
    setScreenshot(null)
    setScreenshotError(null)
    setFileInputKey((key) => key + 1)
  }

  async function onSubmit(values: FormValues) {
    await mutation.mutateAsync({
      message: values.message,
      screenshot: screenshot ?? undefined,
      standalone,
    })
    form.reset({ message: '' })
    clearScreenshot()
    setSent(true)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Что случилось?</FormLabel>
              <FormControl>
                <Textarea
                  rows={5}
                  placeholder="Опишите вопрос или что пошло не так"
                  {...field}
                  onChange={(e) => {
                    setSent(false)
                    field.onChange(e)
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <input
            key={fileInputKey}
            ref={fileInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onPickFile(e.target.files?.[0])}
          />

          {screenshot ? (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- a data URL held in memory, never a served asset */}
              <img
                src={screenshot}
                alt="Прикреплённый скриншот"
                className="h-16 w-16 rounded-md border object-cover"
              />
              <Button type="button" variant="ghost" size="sm" onClick={clearScreenshot}>
                <X className="mr-1 h-3.5 w-3.5" />
                Убрать скриншот
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInput.current?.click()}
            >
              <ImagePlus className="mr-1 h-3.5 w-3.5" />
              Прикрепить скриншот
            </Button>
          )}

          {screenshotError && <p className="text-destructive text-sm">{screenshotError}</p>}
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-muted-foreground text-xs">
            {sent
              ? 'Отправлено — ответ появится ниже, в списке обращений.'
              : 'Обычно отвечаем в течение дня.'}
          </p>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Отправляем...' : 'Отправить'}
          </Button>
        </div>

        {mutation.isError && (
          <p className="text-destructive text-sm">
            {mutation.error instanceof Error
              ? mutation.error.message
              : 'Не удалось отправить обращение'}
          </p>
        )}
      </form>
    </Form>
  )
}
