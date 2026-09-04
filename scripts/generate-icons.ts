/**
 * Rasterises public/icons/icon.svg into every binary icon the app ships.
 *
 * Run with `npm run generate-icons` after editing the master SVG. The outputs
 * are committed, so this is a build-time-for-humans script, not part of `next
 * build`.
 */
import sharp from 'sharp'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import {
  LAUNCH_BACKGROUNDS,
  LAUNCH_DEVICES,
  LAUNCH_MARK_SHARE,
  LAUNCH_SCHEMES,
  launchImagePath,
  type LaunchScheme,
} from '../src/shared/config/launch-images'

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

/**
 * One launch image: the flat app background with the mark centred on it.
 *
 * Centring is left to `gravity: 'centre'` rather than computed offsets, so an
 * odd pixel difference lands wherever sharp puts it instead of one pixel off in
 * a direction that depends on the device.
 */
async function renderLaunchImage(pixelWidth: number, pixelHeight: number, background: string) {
  const markSize = Math.round(Math.min(pixelWidth, pixelHeight) * LAUNCH_MARK_SHARE)
  const mark = await render(markSize).toBuffer()

  return sharp({
    create: { width: pixelWidth, height: pixelHeight, channels: 4, background },
  })
    .composite([{ input: mark, gravity: 'centre' }])
    .png({ compressionLevel: 9 })
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

  mkdirSync('public/icons/startup', { recursive: true })
  for (const device of LAUNCH_DEVICES) {
    for (const scheme of LAUNCH_SCHEMES as readonly LaunchScheme[]) {
      // The path comes from the shared table so the file the link claims and
      // the file written here cannot drift apart.
      const out = `public${launchImagePath(device, scheme)}`
      const image = await renderLaunchImage(
        device.width * device.ratio,
        device.height * device.ratio,
        LAUNCH_BACKGROUNDS[scheme]
      )
      await image.toFile(out)
      console.log(`✓ ${out}`)
    }
  }
}

generate().catch((error) => {
  console.error(error)
  process.exit(1)
})
