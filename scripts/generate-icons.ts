/**
 * Rasterises public/icons/icon.svg into every binary icon the app ships.
 *
 * Run with `npm run generate-icons` after editing the master SVG. The outputs
 * are committed, so this is a build-time-for-humans script, not part of `next
 * build`.
 */
import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'node:fs'

const SOURCE = 'public/icons/icon.svg'

/** The master's viewBox edge. Density below is derived from it. */
const VIEWBOX = 120

/** PWA icons referenced by public/manifest.json. */
const MANIFEST_SIZES = [192, 512] as const

/** Sizes packed into the multi-resolution favicon.ico. */
const FAVICON_SIZES = [16, 32, 48] as const

/** App Router file-convention icon (src/app/icon.png). */
const APP_ICON_SIZE = 512

const svg = readFileSync(SOURCE)

/**
 * librsvg rasterises at 72dpi against the SVG's own width, so a plain
 * `.resize(512)` would upscale a 120px bitmap and soften every edge. Scaling
 * the density instead renders the vector at the target size directly.
 */
function render(size: number) {
  return sharp(svg, { density: Math.ceil((72 * size) / VIEWBOX) })
    .resize(size, size)
    .png({ compressionLevel: 9 })
}

/**
 * Builds an .ico container around already-encoded PNGs. ICO has allowed PNG
 * payloads since Vista, and every browser that still asks for favicon.ico
 * accepts them, so there is no need for a BMP encoder here.
 */
function buildIco(images: { size: number; data: Buffer }[]): Buffer {
  const HEADER = 6
  const ENTRY = 16

  const header = Buffer.alloc(HEADER)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(images.length, 4)

  let offset = HEADER + ENTRY * images.length
  const entries = images.map(({ size, data }) => {
    const entry = Buffer.alloc(ENTRY)
    entry.writeUInt8(size === 256 ? 0 : size, 0) // 0 encodes 256
    entry.writeUInt8(size === 256 ? 0 : size, 1)
    entry.writeUInt8(0, 2) // palette size: not paletted
    entry.writeUInt8(0, 3) // reserved
    entry.writeUInt16LE(1, 4) // colour planes
    entry.writeUInt16LE(32, 6) // bits per pixel
    entry.writeUInt32LE(data.length, 8)
    entry.writeUInt32LE(offset, 12)
    offset += data.length
    return entry
  })

  return Buffer.concat([header, ...entries, ...images.map((image) => image.data)])
}

async function generate() {
  for (const size of MANIFEST_SIZES) {
    const out = `public/icons/icon-${size}.png`
    await render(size).toFile(out)
    console.log(`✓ ${out}`)
  }

  await render(APP_ICON_SIZE).toFile('src/app/icon.png')
  console.log('✓ src/app/icon.png')

  const frames = await Promise.all(
    FAVICON_SIZES.map(async (size) => ({ size, data: await render(size).toBuffer() }))
  )
  writeFileSync('src/app/favicon.ico', buildIco(frames))
  console.log(`✓ src/app/favicon.ico (${FAVICON_SIZES.join(', ')}px)`)
}

generate().catch((error) => {
  console.error(error)
  process.exit(1)
})
