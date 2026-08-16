// Copy this file to add a new source. Run the checklist in
// BUILD-PLAN.md section 4.8 first and record the result in README.md
// before wiring the adapter into index.js.
export default {
  id: 'example', // ASCII, matches the filename
  titleFa: 'نام فارسی منبع',
  homepage: 'https://example.ir/',
  pricesUrl: 'https://example.ir/prices',
  currency: 'IRR', // declared, not inferred: what the source's own price column is denominated in
  verifiedAt: '2026-08-16', // date the checklist in section 4.8 was completed

  // `get(url)` is the shared client: robots-checked, timed out, retried,
  // rate limited (scripts/lib/http.mjs). `$` is cheerio's `load`.
  // Return rows as { sku, price, unit: 'kg', currency, capturedAt, sourceUrl }.
  // `price` must already be a positive integer in whatever `currency` you
  // declared; scrape-prices.mjs converts to Toman and validates it.
  async fetchPrices ({ get, $, log }) {
    const html = await get(this.pricesUrl)
    const doc = $(html)
    const rows = []
    // ... push rows here ...
    return rows
  }
}
