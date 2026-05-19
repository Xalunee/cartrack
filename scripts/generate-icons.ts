import { existsSync, mkdirSync, writeFileSync } from 'fs'

// Simple CarTrack icon as SVG
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="108" fill="#0a0a0a"/>
  <text x="256" y="200" text-anchor="middle" font-family="system-ui" font-weight="700" font-size="120" fill="white">C</text>
  <text x="256" y="340" text-anchor="middle" font-family="system-ui" font-weight="400" font-size="64" fill="#999">track</text>
  <circle cx="256" cy="410" r="12" fill="#22c55e"/>
</svg>`

const dir = 'public/icons'
if (!existsSync(dir)) mkdirSync(dir, { recursive: true })

// Save SVG versions (browsers can use these)
writeFileSync(`${dir}/icon.svg`, svg)

console.log('SVG icon created at public/icons/icon.svg')
console.log('')
console.log('To generate PNG icons, use any online SVG-to-PNG converter:')
console.log('1. Go to https://svgtopng.com/')
console.log('2. Upload public/icons/icon.svg')
console.log('3. Download as 192x192 -> save as public/icons/icon-192.png')
console.log('4. Download as 512x512 -> save as public/icons/icon-512.png')
console.log('')
console.log('Or use ImageMagick: convert icon.svg -resize 192x192 icon-192.png')
