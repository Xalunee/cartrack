import type { SupportAuthorName } from '@shared/lib/support/thread'

export interface SupportMessage {
  id: string
  author: SupportAuthorName
  text: string
  createdAt: string
}

export interface SupportTicket {
  id: string
  source: string
  createdAt: string
  messages: SupportMessage[]
}

export interface CreateSupportTicketDto {
  message: string
  /** Data URL, forwarded to Telegram and never stored. */
  screenshot?: string
  standalone?: boolean
  /** Continues an existing thread instead of opening a new one. */
  ticketId?: string
}
