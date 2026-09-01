/**
 * Guards the one property that the production `createSelector` crash depended on:
 * Recharts, and the reselect copy nested inside it, must live in exactly one
 * chunk file, and every chunk that consumes a module id must travel in the same
 * chunk group as the chunk that declares it.
 *
 * The dashboard used to load Recharts through two `next/dynamic` entry points.
 * That produced two 343 KiB chunks declaring the same 67 module ids, and a
 * sub-chunk of one group reached for reselect's `createSelector` and got a
 * namespace with nothing on it. Run this after `next build`.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const CHUNKS_DIR = join(process.cwd(), '.next', 'static', 'chunks')

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

if (problems.length) {
  console.error('Chunk graph check failed:\n')
  for (const p of problems) console.error('  • ' + p + '\n')
  process.exit(1)
}

console.log(
  `Chunk graph OK — Recharts in ${withRecharts.length} chunk(s), ` +
    `reselect declared once per module id (${[...selectorIds.keys()].join(', ') || 'none'}).`
)
