const MARKET_WARN_H = 24
const MARKET_HIDE_H = 72
const SHOP_WARN_H = 72
const SHOP_HIDE_H = 168

const hoursSince = (iso) => {
  if (!iso) return Infinity
  return (Date.now() - new Date(iso).getTime()) / 36e5
}

function applyFreshness (table, warnH, hideH) {
  const rows = Array.from(table.querySelectorAll('tbody tr[data-captured]'))
  let newestAge = Infinity

  rows.forEach((row) => {
    const age = hoursSince(row.dataset.captured)
    newestAge = Math.min(newestAge, age)
    if (age > hideH) {
      row.dataset.agedOut = 'true'
      row.hidden = true
    } else if (age > warnH && !row.querySelector('.badge--stale')) {
      const badge = document.createElement('span')
      badge.className = 'badge badge--stale'
      badge.textContent = 'به‌روزرسانی نشده'
      row.querySelector('td')?.appendChild(badge)
    }
  })

  return { newestAge, rowCount: rows.length }
}

function initPriceBlock (block) {
  const isShop = block.classList.contains('price-block--shop')
  const table = block.querySelector('table.price-table')
  const cta = block.querySelector('.price-cta')
  if (!table || !cta) return

  const warnH = isShop ? SHOP_WARN_H : MARKET_WARN_H
  const hideH = isShop ? SHOP_HIDE_H : MARKET_HIDE_H
  const { newestAge, rowCount } = applyFreshness(table, warnH, hideH)

  if (rowCount === 0 || newestAge > hideH) {
    table.closest('.price-table-wrap').hidden = true
    const meta = block.querySelector('.price-block__meta')
    if (meta) meta.hidden = true
    cta.hidden = false
  }
}

document.querySelectorAll('.price-block').forEach(initPriceBlock)

// Progressive filter chips: every row is visible without JS. A row aged out
// by the staleness gate above must stay hidden regardless of the filter.
const chipRow = document.querySelector('.price-chips')
if (chipRow) {
  chipRow.addEventListener('click', (e) => {
    const chip = e.target.closest('.price-chip')
    if (!chip) return
    chipRow.querySelectorAll('.price-chip').forEach((c) => c.setAttribute('aria-pressed', 'false'))
    chip.setAttribute('aria-pressed', 'true')

    const type = chip.dataset.type
    document.querySelectorAll('table.price-table tbody tr[data-sku]').forEach((row) => {
      if (row.dataset.agedOut === 'true') return
      row.hidden = type !== 'all' && !row.dataset.sku.startsWith(type + '_')
    })
  })
}
