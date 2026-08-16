// Range and day-over-day jump validation for scraped rows.
// See BUILD-PLAN.md section 4.5, step 4.

export function boundsFor (type, bounds) {
  return bounds.byType[type] || bounds.defaults
}

// row: { sku, price, unit, currency }
// previousPrice: number | undefined (same sku + sourceId, last good run)
// type: parsed from the sku (see lib/sku.mjs)
// Returns { ok: boolean, reason?: string }
export function validateRow (row, { type, previousPrice, bounds }) {
  if (!Number.isFinite(row.price) || row.price <= 0 || !Number.isInteger(row.price)) {
    return { ok: false, reason: 'not a positive integer' }
  }

  const { minIRT, maxIRT } = boundsFor(type, bounds)
  if (row.price < minIRT || row.price > maxIRT) {
    return { ok: false, reason: `out of range [${minIRT}, ${maxIRT}]` }
  }

  if (previousPrice) {
    const maxChangePct = (bounds.byType[type] || bounds.defaults).maxDailyChangePct || bounds.defaults.maxDailyChangePct
    const changePct = Math.abs(row.price - previousPrice) / previousPrice * 100
    if (changePct > maxChangePct) {
      return { ok: false, reason: `daily change ${changePct.toFixed(1)}% exceeds ${maxChangePct}%` }
    }
  }

  return { ok: true }
}

// ریال -> تومان. Per-branch/bundle prices without an explicit weight are
// dropped by the caller before this runs (see scrape-prices.mjs).
export function normalizeToToman (price, currency) {
  return currency === 'IRR' ? Math.round(price / 10) : Math.round(price)
}
