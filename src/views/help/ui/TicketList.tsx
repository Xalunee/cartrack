'use client'

import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Clock } from 'lucide-react'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { TicketReplyForm } from '@features/contact-support'
import type { SupportTicket } from '@entities/support-ticket'
import { openingLine, sortMessages, ticketState } from '@shared/lib/support/thread'

function shortDate(value: string): string {
  return format(new Date(value), 'd MMM', { locale: ru })
}

function messageDate(value: string): string {
  return format(new Date(value), 'd MMMM, HH:mm', { locale: ru })
}

/**
 * Collapsed to a single row each: date, the line they opened with, and whether
 * anyone still owes them an answer. A page of full conversations stops being
 * readable at the third ticket.
 */
export function TicketList({ tickets }: { tickets: SupportTicket[] }) {
  return (
    <Accordion>
      {tickets.map((ticket) => {
        const pending = ticketState(ticket.messages) === 'pending'

        return (
          <AccordionItem key={ticket.id} value={ticket.id}>
            <AccordionTrigger>
              <span className="flex min-w-0 flex-1 items-center gap-2 pr-2">
                <span className="text-muted-foreground shrink-0 text-xs">
                  {shortDate(ticket.createdAt)}
                </span>
                <span className="truncate font-normal">{openingLine(ticket.messages)}</span>
                {pending ? (
                  <span className="text-muted-foreground ml-auto inline-flex shrink-0 items-center gap-1 text-xs">
                    <Clock className="h-3 w-3" />
                    Ждёт ответа
                  </span>
                ) : (
                  <span className="text-muted-foreground ml-auto shrink-0 text-xs">Отвечено</span>
                )}
              </span>
            </AccordionTrigger>

            <AccordionContent>
              <div className="space-y-3">
                {sortMessages(ticket.messages).map((message) => (
                  <div
                    key={message.id}
                    className={
                      message.author === 'ADMIN'
                        ? 'bg-muted rounded-md p-3'
                        : 'rounded-md border p-3'
                    }
                  >
                    <p className="text-muted-foreground mb-1 text-xs">
                      {message.author === 'ADMIN' ? 'Поддержка' : 'Вы'} ·{' '}
                      {messageDate(message.createdAt)}
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  </div>
                ))}

                <TicketReplyForm ticketId={ticket.id} />
              </div>
            </AccordionContent>
          </AccordionItem>
        )
      })}
    </Accordion>
  )
}
