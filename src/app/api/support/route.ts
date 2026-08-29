import { NextResponse } from 'next/server'
import { auth } from '@shared/lib/auth'
import { db } from '@shared/lib/db'
import { notifyAdminOfTicketMessage } from '@shared/lib/support/notify'
import {
  addUserMessage,
  appVersion,
  listUserTickets,
  loadTicketForNotification,
  openTicket,
} from '@shared/lib/support/tickets'
import { supportRequestSchema, type SupportContext } from '@shared/lib/validation/support'

/** What the browser is allowed to see of a thread — never the silent context. */
function toResponse(ticket: {
  id: string
  source: string
  createdAt: Date
  messages: Array<{ id: string; author: string; text: string; createdAt: Date }>
}) {
  return {
    id: ticket.id,
    source: ticket.source,
    createdAt: ticket.createdAt,
    messages: ticket.messages.map((m) => ({
      id: m.id,
      author: m.author,
      text: m.text,
      createdAt: m.createdAt,
    })),
  }
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tickets = await listUserTickets(session.user.id)
  return NextResponse.json(tickets.map(toResponse))
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = supportRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { message, screenshot, standalone, ticketId } = parsed.data

  // --- A follow-up on a conversation that already exists ---
  if (ticketId) {
    const existing = await loadTicketForNotification(ticketId)
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Обращение не найдено' }, { status: 404 })
    }

    const appended = await addUserMessage(ticketId, message)

    // The thread as it read before this message — that is the context worth
    // carrying into the admin chat.
    await notifyAdminOfTicketMessage({
      ticketId: existing.id,
      messageId: appended.id,
      user: { id: existing.user.id, name: existing.user.name },
      source: existing.source,
      context: existing.context as SupportContext | null,
      text: message,
      history: existing.messages,
      screenshot,
    })

    return NextResponse.json({ id: ticketId }, { status: 201 })
  }

  // --- A new ticket ---
  const car = await db.car.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })

  // Assembled here rather than sent up by the client: the user agent and the
  // deploy are things the server already knows first-hand.
  const context: SupportContext = {
    appVersion: appVersion(),
    userAgent: req.headers.get('user-agent') ?? undefined,
    standalone,
    hasCar: Boolean(car),
  }

  const ticket = await openTicket({
    userId: session.user.id,
    text: message,
    source: 'web',
    context,
  })

  await notifyAdminOfTicketMessage({
    ticketId: ticket.id,
    messageId: ticket.messages[0].id,
    user: { id: ticket.user.id, name: ticket.user.name },
    source: ticket.source,
    context,
    text: message,
    screenshot,
  })

  return NextResponse.json({ id: ticket.id, createdAt: ticket.createdAt }, { status: 201 })
}
