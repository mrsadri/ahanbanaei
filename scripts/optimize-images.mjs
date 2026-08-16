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
// The hero is square, so its largest variant carries 50% more pixels than a
// 3:2 frame at the same width. Trimming quality keeps it inside the 160KB
// per-image budget; at this size the difference is not visible.
const QUALITY_BY_SET = { hero: 62 }

// Display aspect ratio (width / height) per image set, matching the box the
// component actually renders. Cropping to it here means the browser never
// downloads pixels that CSS `object-fit: cover` immediately throws away.
const ASPECT = {
  hero: 1,        // square
  gallery: 3 / 2,
  products: 3 / 2
}
const DEFAULT_ASPECT = 3 / 2

// raw-photos/hero/hero.jpg     -> public/img/hero/hero-{480,960,1440}.webp + hero-1440.jpg
// raw-photos/gallery/g01.jpg   -> public/img/gallery/g01-{480,960,1440}.webp
async function processSet (setDir) {
  const setName = basename(setDir)
  const outDir = resolve(root, 'public/img', setName)
  await mkdir(outDir, { recursive: true })

  const aspect = ASPECT[setName] ?? DEFAULT_ASPECT
  const heightFor = (width) => Math.round(width / aspect)
  const quality = QUALITY_BY_SET[setName] ?? QUALITY

  const files = (await readdir(setDir)).filter((f) => /\.(jpe?g|png)$/i.test(f))
  for (const file of files) {
    const name = basename(file, extname(file))
    const input = resolve(setDir, file)
    const image = sharp(input).rotate() // rotate() with no args auto-orients from EXIF, then strips it

    for (const width of WIDTHS) {
      const outWebp = resolve(outDir, `${name}-${width}.webp`)
      await image.clone().resize({ width, height: heightFor(width), fit: 'cover' })
        .webp({ quality }).toFile(outWebp)
      console.log('wrote', outWebp)
    }

    const outJpg = resolve(outDir, `${name}-1440.jpg`)
    await image.clone().resize({ width: 1440, height: heightFor(1440), fit: 'cover' })
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
