/**
 * Guards two properties of the built chunk graph that nothing else would notice
 * breaking. Run this after `next build`.
 *
 * 1. Recharts, and the reselect copy nested inside it, must live in exactly one
 *    chunk file. The dashboard used to load Recharts through two `next/dynamic`
 *    entry points; that produced two 343 KiB chunks declaring the same 67 module
 *    ids, and a sub-chunk of one group reached for reselect's `createSelector`
 *    and got a namespace with nothing on it.
 *
 * 2. The Sentry SDK must stay out of the root main chunks. It is 146 KiB gzipped
 *    — about a third of the dashboard's start-up payload — and it is loaded and
 *    parsed before React hydrates, on a critical path an installed iOS web app
 *    feels directly. `src/instrumentation-client.ts` defers it behind an idle
 *    callback and the error boundaries import it on demand, but all it takes to
 *    undo that is one `import * as Sentry` in a client component, and the only
 *    symptom is a slower cold start.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const NEXT_DIR = join(process.cwd(), '.next')
const CHUNKS_DIR = join(NEXT_DIR, 'static', 'chunks')

function chunkFiles(): string[] {
  return readdirSync(CHUNKS_DIR).filter((f) => f.endsWith('.js'))
}

function read(file: string): string {
  return readFileSync(join(CHUNKS_DIR, file), 'utf8')
}

const problems: string[] = []

// 1. Recharts in exactly one chunk. Two copies means two registrations of the
//    same module ids, loaded at once whenever both charts are on a page.
const withRecharts = chunkFiles().filter((f) => read(f).includes('recharts-surface'))
if (withRecharts.length > 1) {
  problems.push(
    `Recharts is bundled ${withRecharts.length} times: ${withRecharts.join(', ')}. ` +
      `Point every dynamic import that needs a chart at one shared module so they land in one chunk group.`
  )
}

// 2. reselect's createSelector declared once.
const withCreateSelector = chunkFiles().filter((f) => /e\.s\(\["createSelector"/.test(read(f)))
const selectorIds = new Map<string, string[]>()
for (const file of withCreateSelector) {
  for (const [, id] of read(file).matchAll(/e\.s\(\["createSelector".{0,120}?\],(\d{3,7})\)/g)) {
    selectorIds.set(id, [...(selectorIds.get(id) ?? []), file])
  }
}
for (const [id, files] of selectorIds) {
  if (files.length > 1) {
    problems.push(`reselect module ${id} is declared by ${files.length} chunks: ${files.join(', ')}.`)
  }
}

// 3. Sentry outside the root main chunks — see the note at the top of the file.
//    `rootMainFiles` is what every route loads before hydrating, so it is the
//    only list that matters here; the SDK is welcome in any async chunk.
const buildManifest = JSON.parse(
  readFileSync(join(NEXT_DIR, 'build-manifest.json'), 'utf8')
) as { rootMainFiles: string[] }

// Two markers because the SDK arrives in two chunks and only one of them keeps
// the package name after minification; the other is @sentry/core's utilities,
// recognisable by the properties it stamps onto wrapped functions. Neither
// string appears in our own code, so a match is always the real SDK.
const SENTRY_MARKER = /__sentry|@sentry\//
const rootWithSentry = buildManifest.rootMainFiles.filter((f) =>
  SENTRY_MARKER.test(readFileSync(join(NEXT_DIR, f), 'utf8'))
)
if (rootWithSentry.length) {
  problems.push(
    `The Sentry SDK is in ${rootWithSentry.length} root main chunk(s): ${rootWithSentry.join(', ')}. ` +
      `Something imports '@sentry/nextjs' at module scope in client code — load it with ` +
      `await import() instead, the way src/instrumentation-client.ts does.`
  )
}

if (problems.length) {
  console.error('Chunk graph check failed:\n')
  for (const p of problems) console.error('  • ' + p + '\n')
  process.exit(1)
}

console.log(
  `Chunk graph OK — Recharts in ${withRecharts.length} chunk(s), ` +
    `reselect declared once per module id (${[...selectorIds.keys()].join(', ') || 'none'}), ` +
    `Sentry out of all ${buildManifest.rootMainFiles.length} root main chunk(s).`
)
