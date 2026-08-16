// SKU scheme: <type>_<size>_<grade>. See BUILD-PLAN.md section 4.2.
const TYPES = new Set([
  'rebar', 'ipe', 'ipb', 'sheet-black', 'sheet-galv', 'sheet-oil',
  'box', 'profile', 'angle', 'channel', 'tube', 'mesh', 'wire', 'stirrup'
])

const SKU_RE = /^([a-z-]+)_([a-z0-9p]+)_([a-z0-9]+)$/

export function parseSku (sku) {
  const m = SKU_RE.exec(sku)
  if (!m) return null
  const [, type, size, grade] = m
  if (!TYPES.has(type)) return null
  return { type, size, grade }
}

export function formatSku ({ type, size, grade }) {
  return `${type}_${size}_${grade}`
}

export function assertSku (sku) {
  const parsed = parseSku(sku)
  if (!parsed) throw new Error(`Invalid SKU: "${sku}"`)
  return parsed
}
