import { defineConfig } from 'vite'
import handlebars from 'vite-plugin-handlebars'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const json = (p) => JSON.parse(readFileSync(resolve(root, p), 'utf8'))

const nfFa = new Intl.NumberFormat('fa-IR')
const dtFa = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Tehran'
})

// index.html -> 'home', products/index.html -> 'products', 404.html -> 'notFound'
const pageKey = (pagePath) => {
  const p = pagePath.replace(/^\/+/, '')
  if (p === 'index.html' || p === '') return 'home'
  if (p === '404.html') return 'notFound'
  return p.split('/')[0]
}

// Joins are resolved here, at build time, so partials only ever iterate a
// flat array. No price row is ever assembled in the browser.
const bySku = (items) => Object.fromEntries(items.map((i) => [i.sku, i]))

function buildShopRows (catalog, shop) {
  const catalogIndex = bySku(catalog.items)
  return shop.items
    .map((row) => {
      const item = catalogIndex[row.sku]
      if (!item) return null
      return { ...item, ...row, capturedAt: shop.updatedAt }
    })
    .filter(Boolean)
}

function buildMarketRows (catalog, market) {
  const catalogIndex = bySku(catalog.items)
  return market.items
    .map((row) => {
      const item = catalogIndex[row.sku]
      const source = market.sources[row.sourceId]
      if (!item || !source) return null
      return { ...item, ...row, sourceTitleFa: source.titleFa }
    })
    .filter(Boolean)
}

export default defineConfig({
  base: '/',
  appType: 'mpa',
  build: {
    outDir: 'dist',
    target: 'es2020',
    cssCodeSplit: false, // one shared stylesheet, cached across pages
    assetsInlineLimit: 2048,
    rollupOptions: {
      input: {
        home: resolve(root, 'index.html'),
        products: resolve(root, 'products/index.html'),
        about: resolve(root, 'about/index.html'),
        contact: resolve(root, 'contact/index.html'),
        notFound: resolve(root, '404.html')
      }
    }
  },
  plugins: [
    handlebars({
      partialDirectory: resolve(root, 'src/partials'),
      // Data is read from disk on every request, so dev edits are live.
      context (pagePath) {
        const content = json('src/data/content.json')
        const catalog = json('src/data/products.json')
        const shop = json('src/data/prices.shop.json')
        const market = json('src/data/prices.market.json')
        const key = pageKey(pagePath)
        return {
          ...content,
          catalog,
          shopPrices: shop,
          marketPrices: market,
          shopRows: buildShopRows(catalog, shop),
          marketRows: buildMarketRows(catalog, market),
          page: content.pages[key],
          pageKey: key,
          buildTime: new Date().toISOString()
        }
      },
      helpers: {
        faNum: (n) => (n === null || n === undefined ? '' : nfFa.format(n)),
        faDate: (iso) => (iso ? dtFa.format(new Date(iso)) : ''),
        // Work both as a block helper ({{#eq a b}}...{{else}}...{{/eq}})
        // and as a subexpression ({{#if (eq a b)}}), by checking whether
        // Handlebars gave us a block (options.fn) to render.
        eq: function (a, b, options) {
          const result = a === b
          if (options && typeof options.fn === 'function') {
            return result ? options.fn(this) : options.inverse(this)
          }
          return result
        },
        or: function (a, b, options) {
          const result = a || b
          if (options && typeof options.fn === 'function') {
            return result ? options.fn(this) : options.inverse(this)
          }
          return result
        },
        // digits only, no grouping: for years, sizes, counts
        faDigits: (v) => String(v).replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d]),
        json: (v) => JSON.stringify(v),
        concat: (...args) => args.slice(0, -1).join('')
      }
    }),
    {
      name: 'reload-on-data-change',
      handleHotUpdate ({ file, server }) {
        if (file.includes('/src/data/') || file.includes('/src/partials/')) {
          server.ws.send({ type: 'full-reload' })
          return []
        }
      }
    }
  ]
})
