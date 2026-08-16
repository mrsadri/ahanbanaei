// Reads raw-photos/<name>.(jpg|jpeg|png) and writes responsive webp triplets
// (480/960/1440) plus a 1440 jpg fallback into public/img/<set>/.
// raw-photos/ is not committed; run this locally after Masih sends photos.
import { readdir, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve, dirname, basename, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const RAW_DIR = resolve(root, 'raw-photos')
const WIDTHS = [480, 960, 1440]
const QUALITY = 72

// raw-photos/hero/hero.jpg     -> public/img/hero/hero-{480,960,1440}.webp + hero-1440.jpg
// raw-photos/gallery/g01.jpg   -> public/img/gallery/g01-{480,960,1440}.webp
async function processSet (setDir) {
  const setName = basename(setDir)
  const outDir = resolve(root, 'public/img', setName)
  await mkdir(outDir, { recursive: true })

  const files = (await readdir(setDir)).filter((f) => /\.(jpe?g|png)$/i.test(f))
  for (const file of files) {
    const name = basename(file, extname(file))
    const input = resolve(setDir, file)
    const image = sharp(input).rotate() // rotate() with no args auto-orients from EXIF, then strips it

    // Every component that displays these images crops to a 3:2 box via
    // CSS `object-fit: cover`; cropping here too means the browser never
    // downloads pixels it immediately throws away (matters for a portrait
    // source photo, which would otherwise ship ~2x the bytes for nothing).
    for (const width of WIDTHS) {
      const outWebp = resolve(outDir, `${name}-${width}.webp`)
      await image.clone().resize({ width, height: Math.round(width * 2 / 3), fit: 'cover' })
        .webp({ quality: QUALITY }).toFile(outWebp)
      console.log('wrote', outWebp)
    }

    const outJpg = resolve(outDir, `${name}-1440.jpg`)
    await image.clone().resize({ width: 1440, height: 960, fit: 'cover' })
      .jpeg({ quality: 75, mozjpeg: true }).toFile(outJpg)
    console.log('wrote', outJpg)
  }
}

async function main () {
  if (!existsSync(RAW_DIR)) {
    console.log('No raw-photos/ directory found. Nothing to do. See BUILD-PLAN.md section 6.5.')
    return
  }
  const entries = await readdir(RAW_DIR, { withFileTypes: true })
  const dirs = entries.filter((e) => e.isDirectory())
  if (dirs.length === 0) {
    console.log('raw-photos/ has no subfolders. Expected raw-photos/hero/, raw-photos/gallery/, raw-photos/products/.')
    return
  }
  for (const dir of dirs) {
    await processSet(resolve(RAW_DIR, dir.name))
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
