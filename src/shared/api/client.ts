export class ApiError extends Error {
  suggestion?: string

  constructor(message: string, suggestion?: string) {
    super(message)
    this.suggestion = suggestion
  }
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
      (err as { suggestion?: string }).suggestion
    )
  }
  return res.json()
}
