'use client'

import Link from 'next/link'
import { ChevronLeft, HelpCircle, MessageSquare } from 'lucide-react'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SupportForm } from '@features/contact-support'
import { useSupportTicketsQuery } from '@entities/support-ticket'
import { FAQ } from '../model/faq'
import { TicketList } from './TicketList'

export function HelpPage() {
  const { data: tickets, isPending, isError } = useSupportTicketsQuery()

  return (
    <div className="page-enter mx-auto max-w-2xl space-y-5 px-4 py-6 md:max-w-4xl lg:max-w-5xl">
      {/* Same way back as elsewhere: installed as a PWA there is no browser
          back button. Service owns /help, so that is where back leads. */}
      <div className="mb-5 flex items-center gap-1">
        <Link
          href="/service"
          aria-label="Назад в сервис"
          className="text-muted-foreground hover:bg-accent hover:text-foreground -ml-2 flex h-9 w-9 items-center justify-center rounded-md transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-semibold tracking-tight">Помощь</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <HelpCircle className="h-4 w-4" />
            Частые вопросы
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion>
            {FAQ.map((entry) => (
              <AccordionItem key={entry.id} value={entry.id}>
                <AccordionTrigger>{entry.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {entry.answer.map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4" />
            Написать в поддержку
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SupportForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Мои обращения</CardTitle>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <div className="space-y-2">
              <div className="skeleton h-16 rounded-lg" />
              <div className="skeleton h-16 rounded-lg" />
            </div>
          ) : isError ? (
            // Never the empty state on failure: "обращений не было" is exactly
            // what a user reads as "моё обращение пропало".
            <p className="text-destructive text-sm">
              Не удалось загрузить обращения. Обновите страницу — отправленные никуда не делись.
            </p>
          ) : tickets && tickets.length > 0 ? (
            <TicketList tickets={tickets} />
          ) : (
            <p className="text-muted-foreground text-sm">
              Пока обращений не было. Ответ на новое придёт сюда — и в Telegram, если он привязан.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
