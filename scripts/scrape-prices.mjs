// Daily market price scrape. See BUILD-PLAN.md section 4.5 for the full
// behaviour spec. Run with `npm run scrape`, or `-- --dry-run` to print
// without writing src/data/prices.market.json.
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { load } from 'cheerio'
import { get as httpGet, USER_AGENT } from './lib/http.mjs'
import { parseSku } from './lib/sku.mjs'
import { validateRow, normalizeToToman } from './lib/validate.mjs'
import sources from './sources/index.mjs'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const DRY_RUN = process.argv.includes('--dry-run')

const readJson = (p) => JSON.parse(readFileSync(resolve(root, p), 'utf8'))
const marketPath = resolve(root, 'src/data/prices.market.json')

function log (...args) {
  console.log(...args)
}

async function runSource (source, catalogSkus, previous, bounds) {
  const result = {
    id: source.id,
    titleFa: source.titleFa,
    url: source.homepage,
    status: 'ok',
    fetchedAt: new Date().toISOString(),
    lastGoodAt: null,
    errorFa: null,
    rows: []
  }

  let rawRows
  try {
    rawRows = await source.fetchPrices({ get: httpGet, $: load, log })
  } catch (err) {
    log(`[${source.id}] fetch failed: ${err.message}`)
    result.status = 'stale'
    result.errorFa = 'دریافت اطلاعات از این منبع ناموفق بود.'
    return carryForwardSource(source, previous)
  }

  const prevBySku = new Map(
    (previous.items || [])
      .filter((i) => i.sourceId === source.id)
      .map((i) => [i.sku, i])
  )

  for (const raw of rawRows) {
    if (!raw.sku || !catalogSkus.has(raw.sku)) {
      log(`[${source.id}] dropping unknown sku "${raw.sku}"`)
      continue
    }
    const parsed = parseSku(raw.sku)
    if (!parsed) {
      log(`[${source.id}] dropping malformed sku "${raw.sku}"`)
      continue
    }

    const priceToman = normalizeToToman(raw.price, raw.currency)
    const prev = prevBySku.get(raw.sku)
    const check = validateRow(
      { price: priceToman },
      { type: parsed.type, previousPrice: prev?.status !== 'rejected' ? prev?.price : undefined, bounds }
    )

    if (!check.ok) {
      log(`[${source.id}] rejecting ${raw.sku}: ${check.reason}`)
      if (prev) {
        result.rows.push({ ...prev, status: 'stale' })
      } else {
        result.rows.push({
          sku: raw.sku, sourceId: source.id, sourceUrl: raw.sourceUrl,
          price: priceToman, previousPrice: prev?.price ?? null, changePct: null,
          unit: raw.unit, currency: 'IRT', capturedAt: raw.capturedAt, status: 'rejected'
        })
      }
      continue
    }

    const changePct = prev?.price ? Number((((priceToman - prev.price) / prev.price) * 100).toFixed(2)) : null
    result.rows.push({
      sku: raw.sku,
      sourceId: source.id,
      sourceUrl: raw.sourceUrl,
      price: priceToman,
      previousPrice: prev?.price ?? null,
      changePct,
      unit: raw.unit,
      currency: 'IRT',
      capturedAt: raw.capturedAt,
      status: 'ok'
    })
  }

  // any sku previously seen from this source but missing this run: carry forward as stale
  const seenSkus = new Set(result.rows.map((r) => r.sku))
  for (const [sku, prevRow] of prevBySku) {
    if (!seenSkus.has(sku)) {
      result.rows.push({ ...prevRow, status: 'stale' })
    }
  }

  result.lastGoodAt = result.rows.some((r) => r.status === 'ok') ? result.fetchedAt : (previous.sources?.[source.id]?.lastGoodAt ?? null)
  return result
}

function carryForwardSource (source, previous) {
  const prevSource = previous.sources?.[source.id]
  const prevRows = (previous.items || [])
    .filter((i) => i.sourceId === source.id)
    .map((r) => ({ ...r, status: 'stale' }))
  return {
    id: source.id,
    titleFa: source.titleFa,
    url: source.homepage,
    status: 'stale',
    fetchedAt: new Date().toISOString(),
    lastGoodAt: prevSource?.lastGoodAt ?? null,
    errorFa: 'دریافت اطلاعات از این منبع ناموفق بود.',
    rows: prevRows
  }
}

async function main () {
  const catalog = readJson('src/data/products.json')
  const bounds = readJson('src/data/price-bounds.json')
  const catalogSkus = new Set(catalog.items.map((i) => i.sku))

  let previous
  try {
    previous = readJson('src/data/prices.market.json')
  } catch {
    previous = { schemaVersion: 1, generatedAt: null, sources: {}, items: [] }
  }

  log(`Scraping ${sources.length} source(s) as "${USER_AGENT}"`)

  const results = []
  for (const source of sources) {
    const result = await runSource(source, catalogSkus, previous, bounds)
    results.push(result)
    // 2s gap between distinct hosts is enforced inside lib/http.mjs per host;
    // this extra pause keeps sequential sources from overlapping bursts.
    await new Promise((r) => setTimeout(r, 500))
  }

  const output = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    sources: Object.fromEntries(results.map((r) => [r.id, {
      titleFa: r.titleFa,
      url: r.url,
      status: r.status,
      fetchedAt: r.fetchedAt,
      lastGoodAt: r.lastGoodAt,
      errorFa: r.errorFa
    }])),
    items: results.flatMap((r) => r.rows)
  }

  const summary = results.map((r) => {
    const ok = r.rows.filter((x) => x.status === 'ok').length
    const stale = r.rows.filter((x) => x.status === 'stale').length
    const rejected = r.rows.filter((x) => x.status === 'rejected').length
    return `${r.id}: ${r.status} — ${ok} ok, ${stale} stale, ${rejected} rejected`
  }).join('\n')
  log('\n--- Summary ---\n' + summary)

  if (DRY_RUN) {
    log('\n--dry-run: not writing prices.market.json')
    return
  }

  writeFileSync(marketPath, JSON.stringify(output, null, 2) + '\n')
  log(`\nWrote ${marketPath}`)
}

main().catch((err) => {
  // A corrupt local state (bad products.json, etc.) is the only case that
  // should fail the job; a failed source degrades to "call us" instead.
  console.error(err)
  process.exit(1)
})
