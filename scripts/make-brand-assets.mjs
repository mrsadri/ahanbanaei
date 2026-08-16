// Crops the red mark out of brand/logo-original.jpg, keys out its white
// background by luminance, and emits every favicon/OG asset the site needs.
// Colours sampled from the source file: bright face #FD0C15, shaded face
// #D10810 (see BUILD-PLAN.md section 3.1).
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const SRC = resolve(root, 'brand/logo-original.jpg')
const OUT_BRAND = resolve(root, 'public/img/brand')
const OUT_PUBLIC = resolve(root, 'public')

// Bounding box of the red mark inside logo-original.jpg (1280x610 source),
// found by scanning for red pixels. Padded slightly on every side.
const MARK_CROP = { left: 15, top: 50, width: 305, height: 555 }

const MARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 180">
<polygon points="0,25 55,0 100,25 100,65 55,90 0,65" fill="#FD0C15"/>
<polygon points="0,95 55,120 100,95 100,135 55,160 0,135" fill="#D10810"/>
</svg>`

// Minimal single-image ICO container embedding a PNG (supported since
// Windows Vista). Avoids adding an ico-encoding dependency.
function pngToIco (pngBuffer, size) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(1, 4) // image count

  const entry = Buffer.alloc(16)
  entry.writeUInt8(size >= 256 ? 0 : size, 0) // width
  entry.writeUInt8(size >= 256 ? 0 : size, 1) // height
  entry.writeUInt8(0, 2) // palette
  entry.writeUInt8(0, 3) // reserved
  entry.writeUInt16LE(1, 4) // color planes
  entry.writeUInt16LE(32, 6) // bits per pixel
  entry.writeUInt32LE(pngBuffer.length, 8) // image data size
  entry.writeUInt32LE(header.length + entry.length, 12) // offset

  return Buffer.concat([header, entry, pngBuffer])
}

async function keyOutWhite (pipeline) {
  // Flatten alpha from luminance: near-white becomes transparent.
  const { data, info } = await pipeline.ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i], g = data[i + 1], b = data[i + 2]
    const lum = 0.299 * r + 0.587 * g + 0.114 * b
    data[i + 3] = lum > 235 ? 0 : 255
  }
  return sharp(data, { raw: { width, height, channels } }).png()
}

async function main () {
  await mkdir(OUT_BRAND, { recursive: true })

  await writeFile(resolve(OUT_BRAND, 'mark.svg'), MARK_SVG)
  await writeFile(resolve(root, 'public/favicon.svg'), MARK_SVG)

  const cropped = sharp(SRC).extract(MARK_CROP)
  const keyed = await keyOutWhite(cropped)
  const keyedBuffer = await keyed.png().toBuffer()

  // mark.png: padded square, transparent background
  const markPng = await sharp(keyedBuffer)
    .resize({ width: 420, height: 420, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({ top: 46, bottom: 46, left: 46, right: 46, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()
  await writeFile(resolve(OUT_BRAND, 'mark.png'), markPng)

  const icon192 = await sharp(markPng).resize(192, 192).png().toBuffer()
  const icon512 = await sharp(markPng).resize(512, 512).png().toBuffer()
  await writeFile(resolve(OUT_PUBLIC, 'icon-192.png'), icon192)
  await writeFile(resolve(OUT_PUBLIC, 'icon-512.png'), icon512)

  // apple-touch-icon: opaque background required (iOS ignores alpha)
  const appleTouch = await sharp(markPng)
    .resize(160, 160)
    .flatten({ background: '#0B0D0F' })
    .extend({ top: 10, bottom: 10, left: 10, right: 10, background: '#0B0D0F' })
    .png()
    .toBuffer()
  await writeFile(resolve(OUT_PUBLIC, 'apple-touch-icon.png'), appleTouch)

  const favicon32 = await sharp(markPng).resize(32, 32).flatten({ background: '#0B0D0F' }).png().toBuffer()
  await writeFile(resolve(OUT_PUBLIC, 'favicon.ico'), pngToIco(favicon32, 32))

  // OG cover: 1200x630, dark background, mark + Persian wordmark
  const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
    <rect width="1200" height="630" fill="#0B0D0F"/>
    <text x="1120" y="330" text-anchor="end" font-family="Tahoma, sans-serif" font-size="72" font-weight="700" fill="#F2F4F6">آهن‌آلات بنایی</text>
    <text x="1120" y="400" text-anchor="end" font-family="Tahoma, sans-serif" font-size="34" fill="#9AA1A8">BANAEI IRON STORE</text>
  </svg>`
  const markForOg = await sharp(markPng).resize(280, 280).toBuffer()
  await sharp(Buffer.from(ogSvg))
    .composite([{ input: markForOg, left: 80, top: 175 }])
    .jpeg({ quality: 82 })
    .toFile(resolve(OUT_BRAND, 'og-cover.jpg'))

  await writeFile(
    resolve(OUT_PUBLIC, 'site.webmanifest'),
    JSON.stringify({
      name: 'آهن‌آلات بنایی',
      short_name: 'بنایی',
      start_url: '/',
      display: 'standalone',
      background_color: '#0B0D0F',
      theme_color: '#0B0D0F',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
      ]
    }, null, 2)
  )

  console.log('Brand assets written to public/.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
