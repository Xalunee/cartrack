interface ParserApiFine {
  enable_discount: boolean
  date_discount: string | null
  date_decision: string
  koap_code: string
  koap_text: string
  num_post: string
  sum: string
  division_name?: string
}

interface ParserApiResponse {
  success: number
  fines: ParserApiFine[]
}

// NOTE: exact endpoint path and param names must be verified against parser-api.com
// docs after registering (https://www.parser-api.com/fines) — this is the single
// place to adjust once the real contract is confirmed.
export async function fetchFines(regNumber: string, stsNumber: string): Promise<ParserApiFine[]> {
  const key = process.env.PARSER_API_KEY
  if (!key) throw new Error('PARSER_API_KEY not set')

  const url = new URL('https://parser-api.com/api/gibdd_fines')
  url.searchParams.set('key', key)
  url.searchParams.set('regNumber', regNumber)
  url.searchParams.set('stsNumber', stsNumber)

  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(30000) })
  if (!res.ok) throw new Error(`Fines API error: ${res.status}`)

  const data: ParserApiResponse = await res.json()
  if (data.success !== 1) throw new Error('Fines API returned failure')
  return data.fines ?? []
}
