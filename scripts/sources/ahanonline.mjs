// Verified 2026-08-16. See README.md in this folder for the full checklist.
//
// Category listing pages render a server-side price table (class
// `table_price`), no JavaScript required. Two categories are wired in:
// rebar (میلگرد) and IPE beam (تیرآهن). Each category page lists the same
// size from several sellers/factories; this adapter averages all listed
// prices for a given size+grade into one market figure, which is more
// representative than picking an arbitrary single seller's row.
//
// Column layouts differ by category:
//   rebar: سایز | گرید | محل تحویل | قیمت(تومان)          — 4 columns, already per kg
//   ipe:   سایز | محل تحویل | واحد | وزن | قیمت(تومان)     — 5 columns, per-branch when واحد="شاخه"
// The price column text is already in Toman (column header says so); the
// `data-price` attribute on the same element is the same figure in Rial
// (×10) and is not used here.
const toNumber = (text) => Number(String(text).replace(/[^\d]/g, ''))

function averageBySize (rows) {
  const bySize = new Map()
  for (const { size, grade, pricePerKg } of rows) {
    const key = `${size}_${grade}`
    if (!bySize.has(key)) bySize.set(key, { size, grade, sum: 0, count: 0 })
    const entry = bySize.get(key)
    entry.sum += pricePerKg
    entry.count += 1
  }
  return Array.from(bySize.values()).map((e) => ({
    size: e.size,
    grade: e.grade,
    pricePerKg: Math.round(e.sum / e.count)
  }))
}

function parseRebarTable ($, table, log) {
  const rows = []
  $(table).find('tr').each((_, tr) => {
    const tds = $(tr).find('td')
    if (tds.length !== 4) return // skip accordion detail rows
    const size = $(tds[0]).text().replace(/\D/g, '').trim()
    const grade = $(tds[1]).text().trim().toLowerCase()
    const price = toNumber($(tds[3]).text())
    if (!size || !grade || !price) return
    rows.push({ size, grade, pricePerKg: price })
  })
  log(`ahanonline rebar: parsed ${rows.length} raw rows`)
  return averageBySize(rows)
}

function parseIpeTable ($, table, log) {
  const rows = []
  $(table).find('tr').each((_, tr) => {
    const tds = $(tr).find('td')
    if (tds.length !== 5) return // skip accordion detail rows
    const size = $(tds[0]).text().replace(/\D/g, '').trim()
    const unit = $(tds[2]).text().trim()
    const weight = toNumber($(tds[3]).text())
    const price = toNumber($(tds[4]).text())
    if (!size || !price) return

    let pricePerKg
    if (unit.includes('کیلوگرم')) {
      pricePerKg = price
    } else if (weight > 0) {
      pricePerKg = Math.round(price / weight)
    } else {
      return // no way to convert to per-kg: drop, per BUILD-PLAN.md 4.5 step 3
    }
    rows.push({ size, grade: 'st37', pricePerKg })
  })
  log(`ahanonline ipe: parsed ${rows.length} raw rows`)
  return averageBySize(rows)
}

export default {
  id: 'ahanonline',
  titleFa: 'آهن آنلاین',
  homepage: 'https://www.ahanonline.com/',
  currency: 'IRT', // the site's price column is already Toman
  verifiedAt: '2026-08-16',

  categories: [
    {
      url: 'https://www.ahanonline.com/product-category/%D9%85%DB%8C%D9%84%DA%AF%D8%B1%D8%AF/%D9%82%DB%8C%D9%85%D8%AA-%D9%85%DB%8C%D9%84%DA%AF%D8%B1%D8%AF/',
      type: 'rebar',
      parse: parseRebarTable
    },
    {
      url: 'https://www.ahanonline.com/product-category/%D8%AA%DB%8C%D8%B1%D8%A2%D9%87%D9%86-%D9%88-%D9%87%D8%A7%D8%B4/%D8%AA%DB%8C%D8%B1%D8%A2%D9%87%D9%86/',
      type: 'ipe',
      parse: parseIpeTable
    }
  ],

  async fetchPrices ({ get, $, log }) {
    const capturedAt = new Date().toISOString()
    const out = []

    for (const cat of this.categories) {
      let html
      try {
        html = await get(cat.url)
      } catch (err) {
        log(`ahanonline ${cat.type}: fetch failed, ${err.message}`)
        continue
      }
      const doc = $(html)
      const table = doc('.table_price').first()
      if (table.length === 0) {
        log(`ahanonline ${cat.type}: no .table_price found on page, markup may have changed`)
        continue
      }
      const bySize = cat.parse(doc, table, log)
      for (const { size, grade, pricePerKg } of bySize) {
        out.push({
          sku: `${cat.type}_${size}_${grade}`,
          price: pricePerKg,
          unit: 'kg',
          currency: this.currency,
          capturedAt,
          sourceUrl: cat.url
        })
      }
    }

    return out
  }
}
