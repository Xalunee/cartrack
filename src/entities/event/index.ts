export type { CarEvent, EventType } from './model/types'
export { eventApi } from './api/eventApi'
export {
  useEventsQuery,
  useUpdateEventMutation,
  useDeleteEventMutation,
  EVENT_QUERY_KEY,
} from './api/useEventQuery'
export type { UpdateEventDto } from './api/useEventQuery'

// Legacy alias — used by add-event feature
export const eventKeys = { all: ['events'] as const }
export { EventItem } from './ui/EventItem'
