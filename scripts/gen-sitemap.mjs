// Runs after `vite build` (see package.json "build" script). Writes
// dist/sitemap.xml with the four indexable pages. 404.html is excluded.
import { writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const SITE_URL = 'https://ahanbanaei.ir'
const today = new Date().toISOString().slice(0, 10)

const paths = ['/', '/products/', '/about/', '/contact/']

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((p) => `  <url>
    <loc>${SITE_URL}${p}</loc>
    <lastmod>${today}</lastmod>
  </url>`).join('\n')}
</urlset>
`

writeFileSync(resolve(root, 'dist/sitemap.xml'), xml)
console.log('Wrote dist/sitemap.xml')
