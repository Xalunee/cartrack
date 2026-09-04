export class ApiError extends Error {
  /**
   * The HTTP status the route answered with. Carried separately because the
   * message is the server's own Russian text — `/api/car` answers a missing car
   * with "Car not found", so a retry rule that greps the message for "404"
   * never matches and the query retries a state that cannot change.
   */
  status: number
  suggestion?: string

  constructor(message: string, status: number, suggestion?: string) {
    super(message)
    this.status = status
    this.suggestion = suggestion
  }
}

/** A response no retry can improve: the request itself was the problem. */
export function isClientError(error: unknown): boolean {
  return error instanceof ApiError && error.status >= 400 && error.status < 500
}

export async function apiClient<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new ApiError(
      (err as { error?: string }).error ?? `HTTP ${res.status}`,
      res.status,
      (err as { suggestion?: string }).suggestion
    )
  }
  return res.json()
}
