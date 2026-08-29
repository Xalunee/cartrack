'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useCreateSupportTicketMutation } from '@entities/support-ticket'
import { LIMITS } from '@shared/lib/validation/limits'

/**
 * Continuing an existing conversation, as opposed to opening a new one. No
 * screenshot and no validation ceremony: it is a reply in a thread that already
 * carries all of its context.
 */
export function TicketReplyForm({ ticketId }: { ticketId: string }) {
  const [text, setText] = useState('')
  const mutation = useCreateSupportTicketMutation()

  const trimmed = text.trim()

  async function send() {
    if (trimmed.length < 2) return
    await mutation.mutateAsync({ message: trimmed, ticketId })
    setText('')
  }

  return (
    <div className="space-y-2">
      <Textarea
        rows={2}
        maxLength={LIMITS.textLength}
        placeholder="Добавить к обращению"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={trimmed.length < 2 || mutation.isPending}
          onClick={send}
        >
          {mutation.isPending ? 'Отправляем...' : 'Отправить'}
        </Button>
      </div>
      {mutation.isError && (
        <p className="text-destructive text-sm">
          {mutation.error instanceof Error ? mutation.error.message : 'Не удалось отправить'}
        </p>
      )}
    </div>
  )
}
