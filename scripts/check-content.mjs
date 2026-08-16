// Lists every remaining [[KEY]] placeholder with its file and JSON path.
// Exits 0 (a warning) unless a prices.shop.json SKU is missing from
// products.json, which exits 1 because that would silently drop a price
// Masih meant to publish.
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const readJson = (p) => JSON.parse(readFileSync(resolve(root, p), 'utf8'))

const PLACEHOLDER_RE = /^\[\[[A-Z0-9_]+\]\]$/

function findPlaceholders (value, path, out) {
  if (typeof value === 'string') {
    if (PLACEHOLDER_RE.test(value)) out.push({ path, value })
    return
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => findPlaceholders(v, `${path}[${i}]`, out))
    return
  }
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      findPlaceholders(v, path ? `${path}.${k}` : k, out)
    }
  }
}

function main () {
  const files = ['src/data/content.json', 'src/data/products.json']
  let total = 0

  for (const file of files) {
    const data = readJson(file)
    const found = []
    findPlaceholders(data, '', found)
    if (found.length) {
      console.log(`\n${file} (${found.length} placeholder${found.length === 1 ? '' : 's'}):`)
      for (const f of found) console.log(`  ${f.path} = ${f.value}`)
      total += found.length
    }
  }

  console.log(`\nTotal placeholders remaining: ${total}`)

  const catalog = readJson('src/data/products.json')
  const shop = readJson('src/data/prices.shop.json')
  const catalogSkus = new Set(catalog.items.map((i) => i.sku))
  const missing = shop.items.filter((i) => !catalogSkus.has(i.sku))

  if (missing.length) {
    console.error(`\nERROR: prices.shop.json has ${missing.length} SKU(s) not in products.json:`)
    for (const m of missing) console.error(`  ${m.sku}`)
    process.exit(1)
  }

  console.log('\nAll prices.shop.json SKUs match products.json. OK.')
}

main()
