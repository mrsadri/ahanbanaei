# BUILD-PLAN.md
## آهن‌آلات بنایی / Banaei Iron Store, ahanbanaei.ir

This document is the complete specification for the site. Execute it top to bottom.
Every technical decision is already made. Do not substitute libraries, invent copy,
or improvise structure. Where a real business value is unknown, the plan gives a
placeholder key in the form `[[KEY_NAME]]`; ship the placeholder, never a guess.

Rules that apply everywhere and are stated once:

* Language is Persian, direction is RTL, on every page.
* Nothing the browser loads may come from a third-party origin. Fonts, icons,
  images, styles and scripts are all served from this site. Outbound links
  (`tel:`, `https://wa.me/...`, map apps) are navigations, not subresources, and
  are allowed.
* No backend, no forms, no analytics, no cookies.
* Mobile first. Write the base styles for a 360px phone, then add `min-width`
  media queries.
* Any code sample in this plan is normative. Copy it, then extend it.

---

## 1. Project overview

آهن‌آلات بنایی is a family iron and steel business in Iran with more than 50 years
of trading history: a shop plus a warehouse selling construction steel (rebar,
I-beams, sheet, profile, angle, channel) wholesale to contractors and builders and
retail to walk-in customers. The audience is overwhelmingly contractors, site
foremen and engineers on Android phones over slow mobile data, usually mid-project,
usually in a hurry, usually asking one of three questions: what do you stock, what
does it cost today, and how do I reach you right now. The site has to answer those
three in that order and then hand the visitor a phone call. Its second job is
credibility: this is a 50 year old business whose only web presence today is a
throwaway sample page, and the site has to look like the real warehouse behind it.
Its third job is local search: someone typing "خرید میلگرد" plus a city name should
be able to find the shop.

**Non-goals, explicitly.** No online ordering, no cart, no checkout, no payment.
No CMS, no admin panel, no login, no user accounts. No backend and no database.
No contact form and no email capture. No newsletter, no chat widget, no blog.
Every conversion path is a phone call, a WhatsApp message, or a visit to the shop.
The uncle never touches a computer for the site to keep working; the only human
maintenance is Masih editing one JSON file when the shop's own prices change.

---

## 2. Architecture

### 2.1 What is in the repository now, and what happens to it

| Path | Status | Action |
| --- | --- | --- |
| `index.html` | Throwaway sample, one page, inline CSS, invented amber palette, fabricated prices and stats | Delete. Nothing in it is carried over. |
| `CNAME` (`ahanbanaei.ir`) | Live custom domain, correct | Keep the value, move the file to `public/CNAME` (see 2.9). |
| `IMG_20260422_111309_148.jpg` | The logo, 1280x610 JPEG, white background, untracked | Move to `brand/logo-original.jpg` and commit. It is the source of truth for brand colour and for generated assets. It is never shipped as-is. |
| `.gitignore` | Contains `.remember/` and `.DS_Store` | Keep, extend (see 2.2). |
| `.remember/` | Local tooling, already ignored | Leave alone. |

The repository is already connected to GitHub Pages at `mrsadri/ahanbanaei` and
serves `ahanbanaei.ir`. Deployment currently runs from the branch root. Section 2.9
switches it to GitHub Actions and states the one manual settings change required.

### 2.2 File and folder tree

Source is everything under version control. Build output is `dist/`, which is
generated and git-ignored. Page entry HTML files live in folders so the published
URLs are clean (`/products/`, not `/products.html`).

```
ahanbanaei/
├─ .github/
│  └─ workflows/
│     ├─ deploy.yml                  build + publish to Pages (push to main, manual, reusable)
│     └─ scrape-prices.yml           daily market price scrape, then calls deploy.yml
├─ brand/                            design sources, never served
│  ├─ logo-original.jpg              the supplied logo, untouched
│  └─ README.md                      which asset each generated file came from
├─ public/                           copied verbatim to dist/ root
│  ├─ CNAME                          single line: ahanbanaei.ir
│  ├─ robots.txt
│  ├─ favicon.ico
│  ├─ favicon.svg
│  ├─ apple-touch-icon.png           180x180
│  ├─ icon-192.png
│  ├─ icon-512.png
│  ├─ site.webmanifest
│  ├─ fonts/
│  │  └─ vazirmatn-var.woff2         subset variable font, weights 100..900
│  └─ img/
│     ├─ brand/
│     │  ├─ mark.svg                 red mark, traced, used in header and footer
│     │  ├─ mark.png                 512x512 raster fallback and favicon source
│     │  └─ og-cover.jpg             1200x630 Open Graph image
│     ├─ hero/
│     │  ├─ hero-480.webp  hero-960.webp  hero-1440.webp
│     │  └─ hero-1440.jpg            fallback for the srcset
│     ├─ gallery/
│     │  ├─ g01-480.webp  g01-960.webp  g01-1440.webp   (one triplet per photo)
│     │  └─ ...
│     ├─ products/
│     │  └─ rebar.webp  ipe.webp  sheet.webp  box.webp  angle.webp  channel.webp
│     └─ map-static.webp             static map screenshot of the shop location
├─ src/
│  ├─ data/
│  │  ├─ content.json                all site copy and contact details
│  │  ├─ products.json               the product catalogue (SKU identity scheme)
│  │  ├─ prices.shop.json            the shop's own prices, hand maintained
│  │  ├─ prices.market.json          scraper output, machine written only
│  │  ├─ price-bounds.json           validation guard rails for the scraper
│  │  └─ README.md                   one paragraph: who may edit which file
│  ├─ partials/                      Handlebars partials, the component layer
│  │  ├─ head.hbs                    <meta>, canonical, OG, JSON-LD, font preload
│  │  ├─ header.hbs
│  │  ├─ footer.hbs
│  │  ├─ sticky-bar.hbs              mobile call + WhatsApp bar
│  │  ├─ section-heading.hbs
│  │  ├─ button.hbs
│  │  ├─ icon.hbs                    inline SVG icon by name
│  │  ├─ product-card.hbs
│  │  ├─ price-table.hbs             renders either price kind, driven by params
│  │  ├─ price-row.hbs
│  │  ├─ price-disclaimer.hbs
│  │  ├─ gallery.hbs
│  │  ├─ map-block.hbs
│  │  └─ contact-actions.hbs         phone + WhatsApp button pair
│  ├─ styles/
│  │  ├─ main.css                    the only stylesheet imported by JS; @imports the rest
│  │  ├─ tokens.css                  design tokens, the single source of truth
│  │  ├─ base.css                    reset, RTL rules, typography, focus
│  │  ├─ layout.css                  container, section rhythm, grids
│  │  ├─ utilities.css
│  │  └─ components/
│  │     ├─ header.css  footer.css  sticky-bar.css  button.css  card.css
│  │     ├─ price.css   gallery.css  map.css  table.css  error404.css
│  └─ scripts/
│     ├─ main.js                     entry: imports CSS, then the three modules below
│     ├─ nav.js                      mobile menu toggle
│     ├─ price-freshness.js          runtime staleness gate (see section 4.6)
│     └─ gallery.js                  lightbox-free gallery, keyboard scroll
├─ scripts/                          Node build and automation, never shipped
│  ├─ scrape-prices.mjs              scraper entry point
│  ├─ lib/
│  │  ├─ http.mjs                    fetch wrapper: UA, timeout, retry, rate limit
│  │  ├─ robots.mjs                  robots.txt gate
│  │  ├─ validate.mjs                range + jump validation, staleness marking
│  │  └─ sku.mjs                     SKU parse and format helpers
│  ├─ sources/
│  │  ├─ index.mjs                   adapter registry
│  │  ├─ _template.mjs               adapter contract, copy this to add a source
│  │  ├─ <source-id>.mjs             one file per verified source
│  │  └─ README.md                   verification log, one section per source
│  ├─ make-brand-assets.mjs          crops logo, writes favicons, OG image
│  ├─ optimize-images.mjs            raw photos -> responsive webp set
│  ├─ gen-sitemap.mjs                postbuild, writes dist/sitemap.xml
│  └─ check-content.mjs              lists remaining [[PLACEHOLDER]] keys
├─ index.html                        home
├─ products/index.html               محصولات
├─ about/index.html                  درباره ما
├─ contact/index.html                تماس با ما
├─ 404.html
├─ vite.config.js
├─ package.json
├─ .nvmrc                            20
├─ .gitignore                        dist/, node_modules/, .DS_Store, .remember/, raw-photos/
├─ README.md                         Persian, for Masih (see task 32)
└─ BUILD-PLAN.md                     this file
```

### 2.3 Build tool: Vite as a multi-page app

Vite 5, one entry per page, no framework. Rationale: the site is five static
documents; a framework would ship runtime bytes for nothing. Vite gives a dev
server with hot reload (`npm run dev`, changes to CSS, JS, partials and data files
appear immediately), hashed asset filenames for long cache lifetimes, and a plain
`dist/` folder that GitHub Pages serves directly.

Pin `vite@^5.4.0`. Vite 5 plus `vite-plugin-handlebars@^2.0.0` is the combination
this plan is written against; do not upgrade Vite during the build.

`package.json` scripts:

| Script | Command | Purpose |
| --- | --- | --- |
| `dev` | `vite` | dev server with hot reload |
| `build` | `vite build && node scripts/gen-sitemap.mjs` | production build |
| `preview` | `vite preview` | serve `dist/` locally, final check before push |
| `scrape` | `node scripts/scrape-prices.mjs` | run the scraper locally |
| `images` | `node scripts/optimize-images.mjs` | raw photos to responsive webp |
| `brand` | `node scripts/make-brand-assets.mjs` | favicons and OG image from the logo |
| `check` | `node scripts/check-content.mjs` | report unfilled placeholders |

### 2.4 Dependencies, and why each one exists

There are zero runtime dependencies. Nothing below ships a byte to the browser.

| Package | Scope | Why it is unavoidable |
| --- | --- | --- |
| `vite` | dev | Dev server, hot reload, MPA bundling, asset hashing. |
| `vite-plugin-handlebars` | dev | The component layer. Resolves partials at build time inside `transformIndexHtml`, so shipped HTML is complete. Nothing else in the Vite ecosystem does build-time HTML partials with per-page data as simply. |
| `sharp` | dev | Photo pipeline and favicon generation. The uncle will send 4MB phone JPEGs; they cannot ship as-is and cannot be resized by hand at three breakpoints each. |
| `cheerio` | dev | HTML parsing in the scraper, which runs only in GitHub Actions. Regex parsing of price tables is how wrong numbers reach production. |
| `robots-parser` | dev | Correct robots.txt evaluation in the scraper. Hand-rolling this is how you accidentally ignore a `Disallow`. |

Nothing else. If a task seems to need another package, it does not; re-read the task.

### 2.5 The component layer

Every repeated piece of markup exists in exactly one file under `src/partials/`.
Handlebars partials are compiled into the HTML during `vite build` and during dev
server requests, so the browser receives finished markup: crawlers see the full
page, and nothing shifts after load because nothing is assembled client side.
Client JavaScript never renders content. It only toggles state (menu open, price
row hidden past its staleness threshold).

`vite.config.js`, complete and normative:

```js
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

export default defineConfig({
  base: '/',
  appType: 'mpa',
  build: {
    outDir: 'dist',
    target: 'es2020',
    cssCodeSplit: false,          // one shared stylesheet, cached across pages
    assetsInlineLimit: 2048,
    rollupOptions: {
      input: {
        home:     resolve(root, 'index.html'),
        products: resolve(root, 'products/index.html'),
        about:    resolve(root, 'about/index.html'),
        contact:  resolve(root, 'contact/index.html'),
        notFound: resolve(root, '404.html')
      }
    }
  },
  plugins: [
    handlebars({
      partialDirectory: resolve(root, 'src/partials'),
      // Data is read from disk on every request, so dev edits are live.
      context (pagePath) {
        const content  = json('src/data/content.json')
        const catalog  = json('src/data/products.json')
        const shop     = json('src/data/prices.shop.json')
        const market   = json('src/data/prices.market.json')
        const key      = pageKey(pagePath)
        return {
          ...content,
          catalog,
          shopPrices: shop,
          marketPrices: market,
          page: content.pages[key],
          pageKey: key,
          buildTime: new Date().toISOString()
        }
      },
      helpers: {
        faNum:  (n) => (n === null || n === undefined ? '' : nfFa.format(n)),
        faDate: (iso) => (iso ? dtFa.format(new Date(iso)) : ''),
        eq: (a, b) => a === b,
        or: (a, b) => a || b,
        // digits only, no grouping: for years, sizes, counts
        faDigits: (v) => String(v).replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])
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
```

**Worked example: defining a component and using it.**

`src/partials/product-card.hbs` (the component; it receives one catalogue item as
its context, plus an optional `href` hash param):

```handlebars
<article class="card card--product">
  <img class="card__media" src="{{image}}" alt="{{titleFa}}"
       width="480" height="320" loading="lazy" decoding="async">
  <div class="card__body">
    <h3 class="card__title">{{titleFa}}</h3>
    <p class="card__meta">{{summaryFa}}</p>
    {{#if sizesFa}}
      <p class="card__sizes"><span class="card__label">سایز:</span> {{sizesFa}}</p>
    {{/if}}
  </div>
  <a class="card__link" href="{{or href '/contact/'}}">
    استعلام قیمت
    {{> icon name="chevron" class="icon--dir"}}
  </a>
</article>
```

`products/index.html` (the page; note that the loop runs at build time):

```handlebars
{{> head title=page.title description=page.description canonical="/products/"}}
<body>
  {{> header active="products"}}
  <main id="main">
    {{> section-heading title=page.hero.title lead=page.hero.lead}}
    <div class="container">
      <div class="grid grid--cards">
        {{#each catalog.categories}}
          {{> product-card this href="/contact/"}}
        {{/each}}
      </div>
    </div>
  </main>
  {{> footer}}
  {{> sticky-bar}}
  <script type="module" src="/src/scripts/main.js"></script>
</body>
```

The header, footer, sticky bar, product card, price table row, section heading,
button and icon each exist only in the file named in the tree. If you find yourself
writing the same element twice, it belongs in a partial.

### 2.6 Content data

All copy, product data and contact details live in `src/data/`, as JSON so the Vite
config can re-read them per request without ESM cache problems. Markup never
contains a phone number, an address, a product name or a sentence of body copy.

`src/data/content.json`, schema with a filled example. Unknown real values carry a
`[[KEY]]` placeholder; those keys are exactly the ones listed in section 6.

```json
{
  "site": {
    "url": "https://ahanbanaei.ir",
    "name": "آهن‌آلات بنایی",
    "nameLatin": "Banaei Iron Store",
    "locale": "fa_IR",
    "themeColor": "#0B0D0F"
  },
  "business": {
    "legalName": "آهن‌آلات بنایی",
    "foundedYear": 1353,
    "yearsOfExperience": 50,
    "slogan": "آهن‌آلات بنایی؛ ستون اعتماد و کیفیت در ساخت فردا",
    "shortIntro": "تأمین آهن‌آلات ساختمانی، عمده و خرده، با بیش از ۵۰ سال سابقه.",
    "priceListUrl": "/#prices"
  },
  "contact": {
    "phones": [
      { "id": "shop",      "labelFa": "فروشگاه", "display": "[[PHONE_SHOP_DISPLAY]]", "tel": "[[PHONE_SHOP_TEL]]" },
      { "id": "warehouse", "labelFa": "انبار",   "display": "[[PHONE_WAREHOUSE_DISPLAY]]", "tel": "[[PHONE_WAREHOUSE_TEL]]" }
    ],
    "whatsapp": {
      "number": "[[WHATSAPP_E164]]",
      "displayFa": "[[WHATSAPP_DISPLAY]]",
      "prefill": "سلام، از سایت آهن‌آلات بنایی تماس می‌گیرم. لطفاً قیمت و موجودی این کالا را بفرمایید:"
    },
    "address": {
      "lineFa": "[[ADDRESS_LINE]]",
      "cityFa": "[[ADDRESS_CITY]]",
      "provinceFa": "[[ADDRESS_PROVINCE]]",
      "postalCode": "[[ADDRESS_POSTAL_CODE]]",
      "lat": "[[GEO_LAT]]",
      "lng": "[[GEO_LNG]]",
      "landmarkFa": "[[ADDRESS_LANDMARK]]",
      "mapLinks": {
        "neshan": "[[MAP_URL_NESHAN]]",
        "balad": "[[MAP_URL_BALAD]]",
        "google": "[[MAP_URL_GOOGLE]]"
      }
    },
    "hours": [
      { "daysFa": "شنبه تا چهارشنبه", "openFa": "[[HOURS_SAT_WED_OPEN]]", "closeFa": "[[HOURS_SAT_WED_CLOSE]]", "schemaDays": ["Saturday","Sunday","Monday","Tuesday","Wednesday"], "opens": "[[HOURS_SAT_WED_OPEN_24]]", "closes": "[[HOURS_SAT_WED_CLOSE_24]]" },
      { "daysFa": "پنجشنبه", "openFa": "[[HOURS_THU_OPEN]]", "closeFa": "[[HOURS_THU_CLOSE]]", "schemaDays": ["Thursday"], "opens": "[[HOURS_THU_OPEN_24]]", "closes": "[[HOURS_THU_CLOSE_24]]" },
      { "daysFa": "جمعه", "closedFa": "تعطیل", "schemaDays": ["Friday"], "closed": true }
    ],
    "emailFa": "[[EMAIL]]"
  },
  "nav": [
    { "key": "home",     "labelFa": "صفحه اصلی", "href": "/" },
    { "key": "products", "labelFa": "محصولات",   "href": "/products/" },
    { "key": "prices",   "labelFa": "قیمت روز",  "href": "/#prices" },
    { "key": "about",    "labelFa": "درباره ما", "href": "/about/" },
    { "key": "contact",  "labelFa": "تماس با ما","href": "/contact/" }
  ],
  "pages": {
    "home": {
      "title": "آهن‌آلات بنایی | فروش میلگرد، تیرآهن، ورق و پروفیل",
      "description": "تأمین آهن‌آلات ساختمانی با بیش از ۵۰ سال سابقه. قیمت روز، موجودی انبار، فروش عمده و خرده. برای قیمت امروز تماس بگیرید.",
      "hero": {
        "title": "آهن‌آلات ساختمانی، از انباری که ۵۰ سال سرِ قولش بوده",
        "lead": "میلگرد، تیرآهن، ورق، پروفیل، نبشی و ناودانی. عمده و خرده، با فاکتور رسمی.",
        "image": "/img/hero/hero",
        "imageAltFa": "[[PHOTO_HERO_ALT]]"
      },
      "stats": [
        { "value": 50, "suffixFa": "سال", "labelFa": "سابقه در بازار آهن" },
        { "value": "[[STAT_PRODUCT_COUNT]]", "labelFa": "قلم کالای موجود" },
        { "value": "[[STAT_STOCK_TONS]]", "labelFa": "تن موجودی انبار" }
      ],
      "usps": [
        { "icon": "shield",  "titleFa": "اصالت کالا", "bodyFa": "[[USP_1_BODY]]" },
        { "icon": "invoice", "titleFa": "فاکتور رسمی", "bodyFa": "[[USP_2_BODY]]" },
        { "icon": "truck",   "titleFa": "بارگیری و حمل", "bodyFa": "[[USP_3_BODY]]" }
      ]
    },
    "products":  { "title": "محصولات", "description": "...", "hero": { "title": "...", "lead": "..." } },
    "about":     { "title": "درباره ما", "description": "...", "body": ["پاراگراف اول", "پاراگراف دوم"] },
    "contact":   { "title": "تماس با ما", "description": "...", "hero": { "title": "...", "lead": "..." } },
    "notFound":  { "title": "صفحه پیدا نشد", "description": "این صفحه وجود ندارد.",
                   "headingFa": "این صفحه پیدا نشد", "bodyFa": "شاید آدرس را اشتباه وارد کرده‌اید. از این‌جا ادامه بدهید یا مستقیم تماس بگیرید." }
  },
  "gallery": [
    { "base": "/img/gallery/g01", "altFa": "[[PHOTO_1_ALT]]", "w": 1440, "h": 960 }
  ],
  "legal": {
    "priceDisclaimerFa": "قیمت‌ها جنبه اطلاع‌رسانی دارد و قیمت نهایی هنگام تماس تلفنی تأیید می‌شود.",
    "vatNoteFa": "قیمت‌ها بدون احتساب مالیات بر ارزش افزوده است.",
    "copyrightFa": "کلیه حقوق برای آهن‌آلات بنایی محفوظ است."
  }
}
```

### 2.7 CSS architecture

One stylesheet graph, no framework. `src/styles/main.css` is imported by
`src/scripts/main.js` and `@import`s, in this order: `tokens.css`, `base.css`,
`layout.css`, every file in `components/`, `utilities.css`. Vite inlines the
`@import`s at build time into a single hashed CSS file (`cssCodeSplit: false`), so
all five pages share one cached stylesheet.

All colours, spacing, type sizes, radii, shadows and durations are CSS custom
properties declared once in `tokens.css` on `:root` (section 3.1). No component
file may contain a raw hex colour or a raw pixel spacing value. Components are
single-class BEM-ish blocks (`.card`, `.card__title`, `.card--product`); no
utility-first classes beyond the handful in `utilities.css` (`.container`,
`.visually-hidden`, `.stack`, `.flow`).

### 2.8 Fonts

Vazirmatn (SIL Open Font License), self-hosted, one subset variable file, committed
to the repository at `public/fonts/vazirmatn-var.woff2`. Google Fonts and most CDNs
are unreliable or blocked from Iran, and a font that fails to load on a contractor's
phone is a broken site.

Procedure, run once at task 5 and committed:

1. Download the Vazirmatn release zip from
   `https://github.com/rastikerdar/vazirmatn/releases` (use the latest tag, v33.003
   or newer). Keep the license file at `brand/Vazirmatn-OFL.txt`.
2. Prefer `fonts/variable/Vazirmatn[wght].ttf` from the zip. Subset it:

```bash
pip install fonttools brotli
pyftsubset "Vazirmatn[wght].ttf" \
  --output-file="public/fonts/vazirmatn-var.woff2" \
  --flavor=woff2 --layout-features='*' --no-hinting --desubroutinize \
  --unicodes="U+0020-007E,U+00A0,U+00AB,U+00BB,U+00D7,U+060C,U+061B,U+061F,U+0621-063A,U+0640-0652,U+0654,U+0660-0669,U+066A-066C,U+0670,U+0671,U+067E,U+0686,U+0698,U+06A9,U+06AF,U+06BE,U+06C0,U+06CC,U+06F0-06F9,U+200C-200F,U+2010-2015,U+2018-201D,U+2026,U+2039,U+203A,U+2212,U+25B2,U+25BC,U+FEFF"
```

3. Verify the output is 90KB or smaller. If `pyftsubset` is unavailable, fall back
   to committing the static webfonts `Vazirmatn-Regular.woff2`,
   `Vazirmatn-Bold.woff2` and `Vazirmatn-Black.woff2` from the zip's
   `fonts/webfonts/` folder and declaring three `@font-face` blocks instead of one.

`@font-face` (in `base.css`) and the preload (in `head.hbs`):

```css
@font-face {
  font-family: 'Vazirmatn';
  src: url('/fonts/vazirmatn-var.woff2') format('woff2-variations');
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}
```

```html
<link rel="preload" href="/fonts/vazirmatn-var.woff2" as="font" type="font/woff2" crossorigin>
```

Fallback stack: `'Vazirmatn', 'IRANSans', Tahoma, system-ui, sans-serif`. Tahoma is
present on virtually every Windows and Android device in Iran and has real Persian
glyphs, so the swap period is legible rather than broken.

Icons follow the same rule: a small set of hand-written inline SVGs rendered by
`icon.hbs` (a Handlebars `{{#if}}` chain keyed by `name`). No icon font, no sprite
request, no third-party icon package. Required names: `phone`, `whatsapp`, `pin`,
`clock`, `chevron`, `menu`, `close`, `shield`, `invoice`, `truck`, `up`, `down`,
`warning`, `external`.

### 2.9 404 page

The file must be `404.html` at the root of the build output, that is `dist/404.html`
in the published artifact and therefore `https://ahanbanaei.ir/404.html`. GitHub
Pages serves it for any unmatched path, including on a custom domain, including for
paths that look like directories. It is produced by including `404.html` as a
rollup input (already in the config in 2.5); Vite writes it to `dist/404.html`
because the entry sits at the project root.

The page carries: the brand mark, an `<h1>` from `pages.notFound.headingFa`, the
full main navigation (the same `header` partial, so nothing is duplicated), the
phone and WhatsApp actions via `contact-actions.hbs`, and the sticky bar on mobile.
It includes `<meta name="robots" content="noindex">` and it must not include the
price section.

### 2.10 Deployment

`base: '/'` in `vite.config.js`, because the site is served from the root of a
custom domain, not from a project subpath. Any other base value produces broken
absolute asset URLs.

`CNAME` lives at `public/CNAME` containing exactly `ahanbanaei.ir`. Vite copies
everything in `public/` to `dist/` verbatim on every build, so the CNAME is present
in every published artifact and the custom domain survives every deploy. Do not
delete the repository-root `CNAME` until `public/CNAME` exists and one build has
been verified to contain `dist/CNAME`.

`.github/workflows/deploy.yml`:

```yaml
name: Build and deploy
on:
  push:
    branches: [main]
  workflow_dispatch:
  workflow_call:            # so the scrape workflow can publish after committing
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run build
      - name: Fail if CNAME is missing from the build
        run: test "$(cat dist/CNAME)" = "ahanbanaei.ir"
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

One manual step, done once, by Masih: repository Settings, Pages, set Source to
"GitHub Actions". The custom domain field keeps `ahanbanaei.ir` and the Enforce
HTTPS checkbox stays on. Until that switch is made the workflow will run and fail
at the deploy step; that is expected and is not a bug in the build.

---

## 3. Design direction

Heavy industrial. Dark steel surfaces, the logo red as the only accent, real
warehouse photography with strong shadows, big confident Persian type, hard edges,
almost no rounding, no gradients except where the logo mark itself has one, no
decorative illustration. The visual reference is a stack of rebar under a work lamp,
not a SaaS landing page. Red is scarce on purpose: it marks exactly one thing per
screen, the action worth taking.

### 3.1 Tokens

Colours sampled directly from `brand/logo-original.jpg`. The mark's bright face is
`#FD0C15`, its shaded face is `#D10810`, the wordmark grey is `#404042`, the divider
rule is `#BEBEC0`. The greys below are extended from the sampled `#404042` hue,
which is neutral with a faint blue cast.

```css
:root {
  /* brand, sampled */
  --red-500: #FD0C15;   /* logo mark, bright face. Accent, borders, focus ring */
  --red-600: #D10810;   /* logo mark, shaded face. Button surfaces with white text */
  --red-700: #A5060C;   /* pressed state, derived */
  --steel-600: #404042; /* logo wordmark grey */
  --steel-300: #BEBEC0; /* logo divider rule */

  /* neutral ramp */
  --ink-900: #0B0D0F;   /* page background */
  --ink-800: #121417;   /* surface 1, cards */
  --ink-700: #191C20;   /* surface 2, table header, sticky bar */
  --ink-600: #23272C;   /* surface 3, hover */
  --ink-500: #2E3338;   /* hairline borders */
  --ink-400: #6B7076;   /* disabled text, dividers on light blocks */
  --ink-300: #9AA1A8;   /* secondary text, 7.4:1 on --ink-900 */
  --ink-200: #C9CED3;   /* body text, 12.3:1 on --ink-900 */
  --ink-100: #F2F4F6;   /* headings */
  --white: #FFFFFF;

  /* status, used only in price deltas and badges */
  --up: #3FB950;
  --down: #FF6B6B;
  --warn: #E3A008;

  /* semantic aliases: components reference only these */
  --bg: var(--ink-900);
  --bg-raised: var(--ink-800);
  --bg-sunken: var(--ink-700);
  --border: var(--ink-500);
  --text: var(--ink-200);
  --text-strong: var(--ink-100);
  --text-muted: var(--ink-300);
  --accent: var(--red-500);
  --accent-surface: var(--red-600);
  --on-accent: var(--white);

  /* type */
  --font: 'Vazirmatn', 'IRANSans', Tahoma, system-ui, sans-serif;
  --fs-100: 0.8125rem;  /* 13px, captions, timestamps, source chips */
  --fs-200: 0.9375rem;  /* 15px, table cells, meta */
  --fs-300: 1.0625rem;  /* 17px, body base */
  --fs-400: 1.1875rem;  /* 19px, lead */
  --fs-500: clamp(1.375rem, 1.1rem + 1.2vw, 1.75rem);   /* h3 */
  --fs-600: clamp(1.625rem, 1.2rem + 2.0vw, 2.25rem);   /* h2 */
  --fs-700: clamp(2.0rem,  1.4rem + 3.2vw, 3.25rem);    /* h1 */
  --lh-body: 1.85;      /* Persian needs more leading than Latin */
  --lh-heading: 1.45;
  --fw-regular: 400; --fw-medium: 500; --fw-bold: 700; --fw-black: 900;

  /* spacing, 4px base */
  --sp-1: 0.25rem; --sp-2: 0.5rem;  --sp-3: 0.75rem; --sp-4: 1rem;
  --sp-5: 1.5rem;  --sp-6: 2rem;    --sp-7: 3rem;    --sp-8: 4rem;
  --sp-9: 6rem;    --sp-10: 8rem;
  --section-y: clamp(3rem, 2rem + 5vw, 6rem);
  --container: 75rem;   /* 1200px */
  --gutter: clamp(1rem, 0.5rem + 2vw, 2rem);

  /* radii: industrial, almost square */
  --r-1: 2px;  --r-2: 6px;  --r-3: 12px;  --r-full: 999px;

  /* shadows and rings: on dark surfaces, borders do the work */
  --sh-1: 0 1px 2px rgb(0 0 0 / 0.6);
  --sh-2: 0 8px 24px rgb(0 0 0 / 0.45);
  --ring: 0 0 0 3px rgb(253 12 21 / 0.35);

  --dur-1: 120ms; --dur-2: 220ms; --ease: cubic-bezier(0.2, 0, 0, 1);
}
```

Contrast, verified: `--ink-200` on `--bg` is 12.3:1, `--ink-300` on `--bg` is 7.4:1,
`--red-500` on `--bg` is 4.75:1 (passes AA for body text and for UI borders),
white on `--red-600` is 5.6:1. Never put white text on `--red-500`; that pairing is
4.0:1 and fails. Never put `--ink-400` on `--bg` as text.

### 3.2 Breakpoints and layout

Mobile first, `min-width` only. `--bp-sm: 30rem` (480px), `--bp-md: 48rem` (768px),
`--bp-lg: 64rem` (1024px), `--bp-xl: 80rem` (1280px). Media queries are written
literally (custom properties do not work in media queries); keep the values in a
comment block at the top of `layout.css`.

`.container { max-inline-size: var(--container); margin-inline: auto; padding-inline: var(--gutter); }`
Section rhythm: `section { padding-block: var(--section-y); }` and nothing else sets
vertical margins on sections.

Grid columns by breakpoint: cards 1 up to 480px, 2 at `--bp-sm`, 3 at `--bp-lg`.
Gallery 2 columns from the start (thumbnails), 3 at `--bp-md`, 4 at `--bp-lg`.

### 3.3 RTL and Persian typography rules

* `<html lang="fa" dir="rtl">` on all five pages.
* Use logical properties everywhere: `margin-inline-start`, `padding-inline`,
  `inset-inline-start`, `border-inline-end`, `text-align: start`. No `left`,
  `right`, `margin-left` or `padding-right` anywhere in the CSS. This is a hard
  rule; a single physical property is a bug.
* **Never apply `letter-spacing` to Persian text.** Persian is a connected script
  and tracking breaks the joins. `letter-spacing: 0` is the only permitted value on
  any element that can contain Persian. Latin-only elements (the `BANAEI IRON STORE`
  lockup, source domain chips) may carry positive tracking.
* No `text-transform`, no faux bold, no synthetic italic. Weight comes from the
  variable font axis only.
* Body copy is left ragged (`text-align: start`), never justified: justification in
  Persian without a proper H&J engine produces rivers.
* Numerals: all user-facing numbers render as Persian digits (۰۱۲۳۴۵۶۷۸۹), produced
  at build time by the `faNum` and `faDigits` helpers. Thousands are grouped with
  the Arabic thousands separator `٬` (U+066C), which `Intl.NumberFormat('fa-IR')`
  emits automatically. Never hand-write a formatted number in a partial.
* Machine-readable values stay Latin: `tel:` hrefs, `wa.me` numbers,
  `datetime` attributes, JSON-LD, and every value in `src/data/prices.*.json`.
* Wrap displayed phone numbers in `<bdi>` so punctuation does not reorder.
* Persian half-space (ZWNJ, U+200C) is required in compound words: `آهن‌آلات`,
  `به‌روزرسانی`, `می‌شود`. Content copy must contain real ZWNJ characters, not
  spaces and not hyphens.
* Icon mirroring: directional icons (`chevron`, `up`/`down` when used as "next" or
  "back") get `[dir="rtl"] .icon--dir { transform: scaleX(-1); }`. Non-directional
  icons (`phone`, `whatsapp`, `pin`, `clock`, `truck`) are never mirrored. Price
  delta triangles point up and down, so they are never mirrored either.
* Tables: `th { text-align: start; }` and the numeric column uses
  `font-variant-numeric: tabular-nums; font-feature-settings: 'tnum' 1;` so digits
  align in a column.

### 3.4 Component notes

**Header.** Sticky, `block-size: 60px` on mobile and 72px from `--bp-md`, background
`color-mix(in srgb, var(--ink-900) 88%, transparent)` with `backdrop-filter: blur(10px)`
and a `1px` bottom border in `--border`. Contents in inline order (RTL, so this reads
right to left): brand lockup, then nav, then the phone CTA. The brand lockup is
`mark.svg` at 32px plus the wordmark **as live text**, `آهن‌آلات بنایی` set in
Vazirmatn 900, `--text-strong`; the supplied logo image is not used here because its
grey wordmark disappears on dark surfaces and raster type is soft on retina. Below
`--bp-md` the nav collapses into a button (`menu` icon, `aria-expanded`,
`aria-controls`) that opens a full-height panel; the panel traps nothing, closes on
Escape and on outside click, and is the only thing `nav.js` does. The phone CTA is
visible in the header only from `--bp-md` up, because below that the sticky bar
already carries it.

**Sticky mobile call and WhatsApp bar.** `position: fixed; inset-inline: 0; inset-block-end: 0;`
displayed only below `--bp-md`. Two equal buttons filling the width: call (surface
`--accent-surface`, white label, `phone` icon) and WhatsApp (surface `--ink-700`,
`--text-strong` label, 1px `--border`). Height 56px plus
`padding-block-end: env(safe-area-inset-bottom)`. `body` gets
`padding-block-end: calc(56px + env(safe-area-inset-bottom))` below `--bp-md` so the
bar never covers the footer. `z-index: 60`, above the header's 50. Hidden in print.
Each button is a real `<a>` with a visible label, minimum 44px touch target.

**Product card.** Dark `--bg-raised` surface, `--r-2` radius, 1px `--border`, 4:3
image at the top with `loading="lazy"` and explicit `width`/`height` to reserve
space, title at `--fs-500` weight 700, one line of `--text-muted` summary, a sizes
line, and a text link to the contact page. Hover and focus-within raise the border
to `--accent` and lift by 2px; the transform is disabled under
`prefers-reduced-motion: reduce`. The whole card is not a link; only the inner `<a>`
is, so text stays selectable and screen readers get one clear target.

**Price table.** See section 4 for behaviour. Visually: `--bg-raised`, header row
`--bg-sunken` with `--text-muted` labels at `--fs-100`, cells at `--fs-200`, row
separators 1px `--border`, zebra striping off (it fights the dark theme), price cell
weight 700 in `--text-strong` for shop prices and `--text` for market prices. The
whole table sits in a wrapper with `overflow-x: auto`, `tabindex="0"` and an
`aria-label` so it is keyboard scrollable. Below `--bp-sm` the market table drops the
grade column into the product cell as a second line rather than shrinking type.

**Gallery.** A grid of `<figure>` elements, each a `<picture>` with three webp widths
(480/960/1440) plus `sizes`, `loading="lazy"`, `decoding="async"` and explicit
dimensions. The first gallery image on the home page is the only one loaded eagerly.
Captions come from `gallery[].altFa`. No lightbox, no carousel, no JS dependency:
`gallery.js` only adds keyboard arrow scrolling to the horizontal strip variant used
on the home page. Full grid on the products page.

**Map block.** No embedded third-party map. A committed static map screenshot
(`/img/map-static.webp`, 16:9, 960px wide) with the shop marked, wrapped in a
`<figure>`, with the caption carrying the required attribution
`© OpenStreetMap contributors` if the screenshot is taken from an OSM-derived map.
Beside it: the address, the landmark line, opening hours, and three outbound buttons
(نشان، بلد، گوگل مپ) that open the coordinates in the visitor's map app, each with
`rel="noopener"` and the `external` icon. The image has a meaningful `alt` describing
the location in Persian, not "map".

**404 page.** Same header and footer as everywhere else. Centred block: the mark at
64px desaturated to `--steel-600`, a large `۴۰۴` in weight 900 at `--fs-700` in
`--red-500`, the Persian heading and body from `pages.notFound`, then the four main
nav links as large tap targets, then `contact-actions.hbs`. No search box (there is
nothing to search).

**Footer.** `--bg-sunken`, three columns from `--bp-md` and stacked below: brand plus
slogan plus the one-line intro, navigation, contact block (phones, WhatsApp, address,
hours). Bottom strip with the copyright line and the Persian year rendered with
`faDigits`. The price disclaimer from `legal.priceDisclaimerFa` appears once in the
footer as well as inside every price view.

---

## 4. Daily price section

This section is where the site can cost the uncle money, so it is specified tightly.
Read all of it before writing any of it.

### 4.1 The two kinds of number

The section renders **two separate tables**, each with its own heading, its own
timestamp line, and its own disclaimer. They are never merged into one table and a
market figure never appears in the same column as a shop figure.

| | A. Market reference (`مرجع بازار`) | B. Our price (`قیمت فروشگاه ما`) |
| --- | --- | --- |
| Source | Scraped daily from Iranian steel price publishers | Written by hand by Masih |
| File | `src/data/prices.market.json` (machine written only) | `src/data/prices.shop.json` (human written only) |
| Visual weight | Secondary: `--text` prices, muted framing | Primary: appears first, `--text-strong` prices, `--accent` left border on the table |
| Extra columns | Source name, source link, capture time per row | Availability, unit, note |
| Purpose | Shows the shop is in touch with the market | The number the visitor actually wants |

Layout order on the page: heading, our-price table, market table, disclaimer.
Stacked on all widths up to `--bp-lg`; at `--bp-lg` and above the two tables may sit
side by side in a `1fr 1fr` grid, each scrolling independently.

Above the tables sits a filter chip row (all product types, plus one chip per type).
It is progressive: without JavaScript every row is visible and the chips are hidden
via a `.js-only` class that `main.js` removes. Filtering is a `hidden` attribute
toggle on `<tr>` elements, about 30 lines in `price-freshness.js`.

### 4.2 Product identity: one SKU scheme for all three files

The catalogue, the manual price file and the scraper output all key on the same
string, so rows join by exact match with no fuzzy logic anywhere.

```
sku = <type>_<size>_<grade>
```

* `type`: lowercase ASCII from this closed list, and no other value is legal:
  `rebar`, `ipe`, `ipb`, `sheet-black`, `sheet-galv`, `sheet-oil`, `box`,
  `profile`, `angle`, `channel`, `tube`, `mesh`, `wire`, `stirrup`.
* `size`: the nominal size, ASCII digits, `.` written as `p`, `x` as the dimension
  separator. `14`, `1p5`, `20x20x2`, `5x5x5`.
* `grade`: lowercase standard or grade, `a3`, `a2`, `st37`, `st52`, or `na` when the
  product has no meaningful grade.

Examples: `rebar_14_a3`, `ipe_18_st37`, `sheet-black_2_st37`, `box_20x20x2_st37`,
`angle_5x5x5_st37`, `channel_10_st37`.

`scripts/lib/sku.mjs` exports `parseSku`, `formatSku` and `assertSku`, and every
writer of a price file calls `assertSku` before writing. A row whose SKU is not
present in `products.json` is dropped by the scraper and logged, never rendered.

`src/data/products.json`:

```json
{
  "categories": [
    {
      "id": "rebar",
      "titleFa": "میلگرد آجدار",
      "summaryFa": "میلگرد آجدار ساختمانی، شاخه ۱۲ متری، بندیل‌شده.",
      "sizesFa": "۸ تا ۳۲",
      "image": "/img/products/rebar.webp",
      "order": 1
    }
  ],
  "items": [
    {
      "sku": "rebar_14_a3",
      "categoryId": "rebar",
      "type": "rebar",
      "typeFa": "میلگرد آجدار",
      "size": "14",
      "sizeFa": "۱۴",
      "grade": "a3",
      "gradeFa": "A3",
      "standardFa": "INSO 3132",
      "unit": "kg",
      "unitFa": "کیلوگرم",
      "lengthM": 12,
      "factoryFa": "[[FACTORY_REBAR]]",
      "featured": true
    }
  ]
}
```

### 4.3 The shop's own price file

`src/data/prices.shop.json`. Masih edits this file, commits, pushes, and the deploy
workflow rebuilds and publishes. No automated job ever writes to it (see 4.7).

```json
{
  "schemaVersion": 1,
  "updatedAt": "2026-08-16T09:00:00+03:30",
  "updatedBy": "masih",
  "currency": "IRT",
  "vatIncluded": false,
  "noteFa": "",
  "items": [
    {
      "sku": "rebar_14_a3",
      "price": 33200,
      "unit": "kg",
      "inStock": true,
      "minOrderFa": "یک بندیل",
      "noteFa": "ذوب‌آهن اصفهان"
    }
  ]
}
```

Field rules: `price` is an integer in **تومان** (`IRT`), never ریال, never a string,
never formatted. `updatedAt` is ISO 8601 with the Tehran offset and must be updated
in the same commit as any price change; the README tells Masih this in Persian.
`inStock: false` renders the row with the price struck through and a `ناموجود` badge
rather than removing it. An item whose `sku` is missing from `products.json` fails
the build: `check-content.mjs` exits non-zero for that specific case, because a
mistyped SKU here would silently drop a price the shop meant to publish.

### 4.4 The scraper output file

`src/data/prices.market.json`, written only by `scripts/scrape-prices.mjs`.

```json
{
  "schemaVersion": 1,
  "generatedAt": "2026-08-16T04:30:11Z",
  "sources": {
    "<source-id>": {
      "titleFa": "نام فارسی منبع",
      "url": "https://example.ir/prices",
      "status": "ok",
      "fetchedAt": "2026-08-16T04:30:07Z",
      "lastGoodAt": "2026-08-16T04:30:07Z",
      "errorFa": null
    }
  },
  "items": [
    {
      "sku": "rebar_14_a3",
      "sourceId": "<source-id>",
      "sourceUrl": "https://example.ir/prices#rebar-14",
      "price": 32500,
      "previousPrice": 32300,
      "changePct": 0.62,
      "unit": "kg",
      "currency": "IRT",
      "capturedAt": "2026-08-16T04:30:07Z",
      "status": "ok"
    }
  ]
}
```

`sources[].status` and `items[].status` both take one of `ok`, `stale`, `rejected`.
`stale` means the value is carried over from a previous run because this run could
not confirm it. `rejected` means a value arrived and failed validation; the carried
over previous value is kept and shown with the stale treatment. Nothing is ever
deleted by the scraper.

`src/data/price-bounds.json`, the validation guard rails, hand maintained:

```json
{
  "defaults": { "minIRT": 5000, "maxIRT": 500000, "maxDailyChangePct": 12 },
  "byType": {
    "rebar":       { "minIRT": 15000, "maxIRT": 200000 },
    "ipe":         { "minIRT": 15000, "maxIRT": 250000 },
    "sheet-black": { "minIRT": 15000, "maxIRT": 300000 }
  },
  "reviewedAt": "2026-08-16"
}
```

Bounds are absolute تومان per kilogram. Iranian steel prices drift upward with
inflation, so `reviewedAt` exists to make an out-of-date bound obvious: if the
scraper rejects the same SKU on three consecutive runs it writes a line to the job
summary saying the bounds probably need review, and still publishes nothing new.

### 4.5 Scraper behaviour

`npm run scrape` locally, and `.github/workflows/scrape-prices.yml` on a schedule.
Order of operations, per run:

1. Load `prices.market.json` as `previous` (create an empty skeleton if absent).
2. For each registered source, in series with a 2 second gap between hosts:
   a. Fetch and evaluate `robots.txt` with `robots-parser` for the exact URL and the
      declared user agent. If disallowed, skip the source, set its status to
      `stale`, write a note, and continue. Never override.
   b. `GET` with `User-Agent: AhanBanaeiPriceBot/1.0 (+https://ahanbanaei.ir/about/; contact: [[EMAIL]])`,
      `Accept-Language: fa-IR`, 15 second timeout via `AbortSignal.timeout`, three
      attempts with exponential backoff of 1s, 3s, 9s plus up to 500ms jitter.
      Retry only on network errors, 429 and 5xx. Honour `Retry-After` when present.
   c. Parse with `cheerio` through the adapter, which returns rows of
      `{ sku, price, unit, currency, capturedAt, sourceUrl }`.
3. Normalise: convert ریال to تومان by dividing by 10 whenever the adapter declares
   `currency: 'IRR'`; convert per-branch or per-bundle pricing to per-kilogram only
   when the adapter supplies an explicit weight, otherwise drop the row.
4. Validate each row against `price-bounds.json` and against `previous`:
   * outside `[minIRT, maxIRT]` for its type: `rejected`
   * `|price - previous| / previous * 100 > maxDailyChangePct`: `rejected`
   * not a finite integer, or zero, or negative: `rejected`
   * SKU not present in `products.json`: dropped and logged
5. Merge: for every SKU and source pair, take the validated new value, else carry the
   previous value forward with `status: 'stale'` and its original `capturedAt`
   untouched. A carried value keeps the timestamp of when it was actually captured,
   never the time of the run that carried it. That timestamp is what the staleness
   gate in 4.6 reads, so a permanently failing source disappears from the page on its
   own within the threshold.
6. Write the file only if the content changed. Print a job summary table of
   ok / stale / rejected counts per source.
7. Exit code 0 even when every source failed. A failing scrape must not fail the
   deploy; the site degrades to "call us" by design, and a red workflow badge that is
   red every day is a badge nobody reads. Non-zero exit is reserved for a corrupt
   local state (unparseable `previous`, invalid `products.json`).

Additional hard rules: never send more than one request per two seconds to the same
host; never scrape anything behind a login, a paywall or a captcha; never
circumvent a block; if a source starts returning 403, remove the adapter rather than
disguising the client.

### 4.6 Staleness, and what the visitor sees

The site is static, built at deploy time, but staleness is a property of *now*, not
of build time. So the values are rendered into the HTML with machine-readable
timestamps and a 1KB runtime module decides what may stay on screen.

```html
<tr data-sku="rebar_14_a3" data-captured="2026-08-16T04:30:07Z" data-kind="market">
  <td>میلگرد آجدار</td> <td>۱۴</td> <td>A3</td>
  <td class="price"><bdi>۳۲٬۵۰۰</bdi> <span class="unit">تومان/کیلوگرم</span></td>
  <td class="src"><a href="..." rel="noopener nofollow">نام منبع</a>
      <time datetime="2026-08-16T04:30:07Z">۱۴۰۵/۰۵/۲۵ ۰۸:۰۰</time></td>
</tr>
```

`price-freshness.js` runs on `DOMContentLoaded`, reads `data-captured` on every row
and on the two table wrappers, and applies:

| Age of the newest value in a table | Market table | Shop table |
| --- | --- | --- |
| under 24h (shop: under 3 days) | shown normally | shown normally |
| 24h to 72h (shop: 3 to 7 days) | shown, plus a `--warn` badge `به‌روزرسانی نشده` on the row and the age in the table's timestamp line | same |
| over 72h (shop: over 7 days) | numbers replaced by the call-to-action block | same |

The over-threshold state replaces the entire table with this block, which is present
in the HTML from the start with the `hidden` attribute so there is no layout shift
and no flash of wrong numbers:

> **قیمت امروز را تلفنی بگیرید**
> قیمت‌های این بخش به‌روز نیست. برای قیمت امروز و موجودی انبار تماس بگیرید.
> [تماس تلفنی] [واتس‌اپ]

Rows individually older than their table's hide threshold are hidden even when the
table as a whole is fresh, so one dead source cannot leave a month-old number
sitting next to today's.

If JavaScript is disabled the tables render as built, every row still shows its own
capture time and the disclaimer, and nothing is hidden. That is the correct
degradation: visible timestamps plus a disclaimer are honest, an empty page is not.

Thresholds live in one place, as constants at the top of `price-freshness.js`:
`MARKET_WARN_H = 24`, `MARKET_HIDE_H = 72`, `SHOP_WARN_H = 72`, `SHOP_HIDE_H = 168`.

### 4.7 The scheduled workflow, and why it cannot touch the manual file

`.github/workflows/scrape-prices.yml`:

```yaml
name: Scrape market prices
on:
  schedule:
    - cron: '30 4 * * *'      # 08:00 Asia/Tehran (UTC+3:30, no DST)
  workflow_dispatch:
permissions:
  contents: write
  pages: write
  id-token: write
concurrency:
  group: scrape
  cancel-in-progress: false
jobs:
  scrape:
    runs-on: ubuntu-latest
    outputs:
      changed: ${{ steps.commit.outputs.changed }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run scrape
      - name: Refuse to touch anything but the market file
        run: |
          dirty=$(git diff --name-only)
          if [ -n "$(echo "$dirty" | grep -v '^src/data/prices.market.json$' || true)" ]; then
            echo "Unexpected modified files: $dirty"; exit 1
          fi
      - id: commit
        run: |
          if git diff --quiet -- src/data/prices.market.json; then
            echo "changed=false" >> "$GITHUB_OUTPUT"; exit 0
          fi
          git config user.name  "ahanbanaei-price-bot"
          git config user.email "bot@users.noreply.github.com"
          git add src/data/prices.market.json      # never `git add -A`
          git commit -m "chore(prices): daily market snapshot"
          git push
          echo "changed=true" >> "$GITHUB_OUTPUT"
  publish:
    needs: scrape
    if: needs.scrape.outputs.changed == 'true'
    uses: ./.github/workflows/deploy.yml
    permissions:
      contents: read
      pages: write
      id-token: write
```

The separation is structural, not conventional: the scraper writes exactly one path,
the workflow refuses to commit if any other path is dirty, and the `git add` names
that one file. A pushed commit made with `GITHUB_TOKEN` does not trigger `on: push`,
which is why the publish job calls `deploy.yml` as a reusable workflow instead of
relying on the push event.

### 4.8 Candidate sources, and how to verify one before wiring it in

Shortlist at least four and ship with at least three working adapters, so one
blocked site cannot empty the section. Recommended candidates, in order of
preference:

| Candidate | Why it is on the list | Caution |
| --- | --- | --- |
| بورس کالای ایران, `ime.co.ir` | The official Iranian commodity exchange. Publishes settlement prices for rebar and billet. The most defensible reference a shop can cite. | Publishes trade settlement prices, not retail counter prices, and only for traded lots. Label it as such in `titleFa`. |
| آهن‌آنلاین, `ahanonline.com` | Long-running commercial steel marketplace with daily per-size price tables that match the SKU scheme closely. | Commercial competitor. Check its terms; if scraping is disallowed, drop it without argument. |
| چیلان, `chilanonline.com` | Steel industry news outlet with published daily price tables and a named editorial team. | Table structure changes with redesigns. Pin the adapter to a stable container, not to nth-child chains. |
| فولاد ۲۴, `foolad24.com` | Broad coverage across rebar, beam, sheet and profile. | Verify unit and currency per table; ریال and تومان are mixed across Iranian sites. |
| tgju, `tgju.org` | Wide market data coverage, stable markup, includes some steel series. | Coverage of specific rebar sizes is thin. Use only for a headline index, not for per-SKU rows. |

Verification checklist, run per source before writing its adapter, with the outcome
recorded as a dated section in `scripts/sources/README.md`. A source that fails any
of items 1 to 4 is not used.

1. `robots.txt` at the origin allows the exact target path for a generic user agent.
   Paste the relevant lines into the log.
2. The site's terms or "شرایط استفاده" page does not prohibit automated access. If
   there is no terms page, note that fact.
3. The publisher is identifiable: a real company with an about page and a registered
   presence (نماد اعتماد الکترونیکی, ثبت شرکت, or a masthead with named editors), or
   an official body such as IME. An anonymous aggregator is not used.
4. The page states the date and time of its prices on the page itself, and that
   timestamp is within the last 24 hours on two different days of checking.
5. Unit and currency are unambiguous on the page (کیلوگرم vs شاخه vs بندیل, ریال vs
   تومان). Record both in the adapter as explicit fields; do not infer from
   magnitude.
6. Cross-check: for one common SKU, the source's number is within 5 percent of a
   second verified source on the same day. If it is not, investigate before wiring.
7. The values sit in a stable DOM container with a class or id, or in a JSON
   endpoint. If the only way to extract them is a positional selector, note the
   fragility in the adapter header comment.
8. No login, no paywall, no captcha, no anti-bot interstitial.

Adapter contract, `scripts/sources/_template.mjs`:

```js
export default {
  id: 'example',                       // ASCII, matches the filename
  titleFa: 'نام فارسی منبع',
  homepage: 'https://example.ir/',
  pricesUrl: 'https://example.ir/prices',
  currency: 'IRR',                     // declared, not inferred
  verifiedAt: '2026-08-16',            // date the checklist above was completed
  // `get` is the shared client: robots-checked, timed out, retried, rate limited.
  async fetchPrices ({ get, $ , log }) {
    const html = await get(this.pricesUrl)
    const doc = $(html)
    const rows = []
    // push { sku, price, unit: 'kg', currency: this.currency, capturedAt, sourceUrl }
    return rows
  }
}
```

### 4.9 Never a binding quote

`price-disclaimer.hbs` renders `legal.priceDisclaimerFa` and `legal.vatNoteFa` and is
included beneath every price view, in the footer, and inside the over-threshold
call-to-action block. No page, ever, presents a number as an offer, a quote, or a
reserved price. The word `استعلام` (inquiry) is used for the action, never `سفارش`
(order) or `خرید` (purchase), because the site does not sell anything.

---

## 5. Build task list

Execute in this order. Each task states its files and an acceptance criterion you
can check by looking at the result.

| # | Task | Files | Done when |
| --- | --- | --- | --- |
| 1 | Clear the old site. Delete `index.html`. Move the logo to `brand/logo-original.jpg` and commit it. Move `CNAME` content to a note for task 3; leave the root `CNAME` in place for now so the live site keeps working. | delete `index.html`, add `brand/logo-original.jpg`, `brand/README.md` | Repo root has no sample HTML, logo is tracked under `brand/` |
| 2 | Scaffold Node and Vite. `package.json` with the scripts from 2.3 and the five dev dependencies from 2.4, `.nvmrc` with `20`, extend `.gitignore` with `dist/`, `node_modules/`, `raw-photos/`. | `package.json`, `.nvmrc`, `.gitignore` | `npm install` completes, `npx vite --version` prints 5.x |
| 3 | Write `vite.config.js` exactly as in 2.5. Create the five entry HTML files as stubs with `<html lang="fa" dir="rtl">` and a heading. Create `public/CNAME` containing `ahanbanaei.ir` and delete the root `CNAME`. | `vite.config.js`, `index.html`, `products/index.html`, `about/index.html`, `contact/index.html`, `404.html`, `public/CNAME` | `npm run dev` serves all five URLs including `/products/`; `npm run build` writes `dist/CNAME` and `dist/404.html` |
| 4 | Brand assets. Write `scripts/make-brand-assets.mjs`: crop the mark from `brand/logo-original.jpg` at box `left:20, top:55, width:300, height:545`, key out the white background by luminance threshold 240 into an alpha channel, and emit `public/img/brand/mark.png` (512x512, transparent, padded square), `favicon.ico`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`, and `og-cover.jpg` (1200x630, `--ink-900` background, mark plus Persian wordmark composited from an SVG string). Hand-draw `mark.svg` from the cropped shape. | `scripts/make-brand-assets.mjs`, `public/img/brand/*`, `public/favicon.*`, `public/icon-*.png`, `public/apple-touch-icon.png` | `npm run brand` regenerates every file; the mark renders red on a dark background with no white halo |
| 5 | Font. Follow 2.8, commit `public/fonts/vazirmatn-var.woff2` and `brand/Vazirmatn-OFL.txt`. | `public/fonts/vazirmatn-var.woff2` | File is 90KB or smaller and renders Persian and Latin correctly at weights 400, 700 and 900 |
| 6 | `tokens.css`, copied verbatim from 3.1. | `src/styles/tokens.css` | Every token in 3.1 exists; the file contains no selectors other than `:root` |
| 7 | `base.css`: reset, `@font-face`, `html`/`body` typography, the RTL rules from 3.3, `:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }`, `prefers-reduced-motion` block, print rules. | `src/styles/base.css` | Persian body text renders at 17px with 1.85 leading; tabbing shows a red focus ring on every interactive element |
| 8 | `layout.css` and `utilities.css`: container, section rhythm, card and gallery grids, `.visually-hidden`, `.js-only`. `main.css` importing everything in the order from 2.7, imported by `src/scripts/main.js`. | `src/styles/{layout,utilities,main}.css`, `src/scripts/main.js` | One hashed CSS file appears in `dist/assets/` and is linked from all five pages |
| 9 | Data files with placeholders. `content.json` fully populated per 2.6, including the verbatim Persian about copy and slogan supplied by Masih. `products.json` with six categories and at least twelve items using the SKU scheme. Empty but valid `prices.shop.json`, `prices.market.json`, `price-bounds.json`. `src/data/README.md` stating who may edit what. | `src/data/*` | Every file parses as JSON; every unknown value is a `[[KEY]]` string |
| 10 | Component layer part one: `head.hbs`, `header.hbs`, `footer.hbs`, `icon.hbs`, `button.hbs`, `section-heading.hbs`, `contact-actions.hbs`, plus `header.css`, `footer.css`, `button.css`. `nav.js` for the mobile menu. | `src/partials/*.hbs`, `src/styles/components/*`, `src/scripts/nav.js` | Header and footer appear on all five pages from a single source file; the mobile menu opens, closes on Escape, and reports `aria-expanded` correctly |
| 11 | `sticky-bar.hbs` and `sticky-bar.css` per 3.4, wired into all five pages, with the `body` bottom padding rule. | `src/partials/sticky-bar.hbs`, `src/styles/components/sticky-bar.css` | On a 360px viewport the bar is fixed at the bottom, both buttons are at least 44px tall, and the footer is never covered |
| 12 | Home page: hero with responsive image, stats strip, USP cards, featured products, a gallery strip, the map block, and an empty `#prices` section placeholder. | `index.html` | Page renders end to end with placeholder copy and no console errors |
| 13 | `product-card.hbs`, `card.css`, and the products page rendering all catalogue categories plus a full size table per category. | `src/partials/product-card.hbs`, `src/styles/components/card.css`, `products/index.html` | Adding a category to `products.json` adds a card with no markup change |
| 14 | About page: the verbatim Persian copy from `pages.about.body`, the slogan as a pull quote, a warehouse photo, and a link to contact. | `about/index.html` | Persian copy renders with correct ZWNJ and no machine-translated text |
| 15 | Contact page: all phone numbers, WhatsApp, hours table, address, and `map-block.hbs` per 3.4. | `contact/index.html`, `src/partials/map-block.hbs`, `src/styles/components/map.css` | Every phone number is a working `tel:` link; the three map buttons open external map apps |
| 16 | 404 page per 2.9. | `404.html`, `src/styles/components/error404.css` | `npm run preview` then visiting `/no-such-page` shows the branded page with nav and both contact actions |
| 17 | Image pipeline. `scripts/optimize-images.mjs`: read `raw-photos/`, write 480/960/1440 webp plus one 1440 jpg fallback into `public/img/<set>/`, strip EXIF, quality 72. Add placeholder photography so the layout is testable. | `scripts/optimize-images.mjs`, `public/img/**` | `npm run images` turns a 4MB JPEG into three webp files each under 160KB |
| 18 | `gallery.hbs`, `gallery.css`, `gallery.js`; gallery strip on home, full grid on products. | `src/partials/gallery.hbs`, `src/styles/components/gallery.css`, `src/scripts/gallery.js` | All images below the fold are `loading="lazy"` with explicit dimensions; CLS stays at 0 while scrolling |
| 19 | Shop price file and its table. Populate `prices.shop.json` with placeholder rows for the twelve catalogue SKUs, build `price-table.hbs`, `price-row.hbs`, `price-disclaimer.hbs` and `price.css` per 4.1 and 3.4. | `src/data/prices.shop.json`, `src/partials/price-*.hbs`, `src/styles/components/price.css` | The our-price table renders Persian digits with `٬` grouping, tabular alignment, and the disclaimer beneath |
| 20 | Market table and the full `#prices` section: two tables, filter chips, both timestamp lines, both hidden call-to-action blocks. | `index.html`, `src/partials/price-table.hbs` | Both tables render side by side at 1280px and stacked at 375px, visually distinct, never merged |
| 21 | `price-freshness.js` per 4.6, with the four threshold constants and the filter chip logic. | `src/scripts/price-freshness.js` | Editing a row's `data-captured` to four days ago hides that row; ageing every row hides the table and reveals the call block, with no layout shift |
| 22 | Scraper core: `scripts/lib/{http,robots,validate,sku}.mjs` and `scrape-prices.mjs` implementing the pipeline in 4.5, with a `--dry-run` flag that prints without writing. | `scripts/scrape-prices.mjs`, `scripts/lib/*` | `npm run scrape -- --dry-run` with zero adapters registered exits 0 and prints an empty summary |
| 23 | Source adapters: run the checklist in 4.8 for at least four candidates, record the results in `scripts/sources/README.md`, and ship at least three passing adapters. | `scripts/sources/*.mjs`, `scripts/sources/README.md` | `npm run scrape` writes `prices.market.json` with rows from three sources; killing one source's network still yields a valid file with that source marked `stale` |
| 24 | `deploy.yml` exactly as in 2.10. Ask Masih to switch Pages Source to GitHub Actions. | `.github/workflows/deploy.yml` | A push to main publishes, and `https://ahanbanaei.ir` serves the new site over HTTPS with the custom domain intact |
| 25 | `scrape-prices.yml` exactly as in 4.7. | `.github/workflows/scrape-prices.yml` | Manual `workflow_dispatch` run commits only `prices.market.json` and triggers a publish |
| 26 | SEO. `head.hbs` completes: Persian `<title>` and description per page, canonical with trailing slash, `og:` and `twitter:` tags, `og:image` pointing at `/img/brand/og-cover.jpg`, `<html lang="fa" dir="rtl">`, theme colour. `public/robots.txt` allowing everything and naming the sitemap. `scripts/gen-sitemap.mjs` writing the four indexable URLs with today's `lastmod` (404 excluded). | `src/partials/head.hbs`, `public/robots.txt`, `scripts/gen-sitemap.mjs` | `dist/sitemap.xml` lists exactly four URLs; every page has a unique Persian title and description |
| 27 | JSON-LD `HardwareStore` built from `content.json`: name, image, telephone, address as `PostalAddress`, `geo`, `openingHoursSpecification` from `contact.hours`, `url`, `areaServed`, `priceRange`. Rendered once in `head.hbs`. | `src/partials/head.hbs` | The block validates in Google's Rich Results test with no errors, and contains no placeholder `[[KEY]]` once real content lands |
| 28 | `scripts/check-content.mjs`: list every remaining `[[KEY]]` with its file and JSON path, exit 0 as a warning, but exit 1 if any `prices.shop.json` SKU is missing from `products.json`. | `scripts/check-content.mjs` | `npm run check` prints a grouped list matching section 6 |
| 29 | Accessibility pass. Skip link to `#main`, one `<h1>` per page and no skipped heading levels, landmarks (`header`/`nav`/`main`/`footer`), `scope` on every `<th>`, `aria-label` on both scrollable table wrappers, 44px minimum targets, visible focus everywhere, `alt` on every image, `prefers-reduced-motion` honoured, keyboard-only walkthrough of all five pages. | all pages and partials | Keyboard-only traversal reaches every link and control in a sensible RTL order; axe reports zero violations |
| 30 | Performance pass against the budget below. Preload the font, preload the hero image, defer non-critical JS, confirm the single CSS file, check bundle sizes. | build output | Lighthouse mobile: performance 95 or above, accessibility 100, best practices 100, SEO 100 |
| 31 | Cross-check pass: 360px and 1280px screenshots of all five pages, Persian digits everywhere user-facing, Latin digits in `tel:`/`datetime`/JSON, no physical CSS properties (`grep -rn "margin-left\|margin-right\|padding-left\|padding-right\|\bleft:\|\bright:" src/styles` returns nothing outside comments). | all | The grep is empty and both screenshot sets are correct |
| 32 | `README.md` in plain Persian for Masih: how to run the site locally, how to change a phone number (which file, which key), how to add a product (both files, the SKU rule), how to update the shop's own prices (the file, the `updatedAt` rule, commit and push, wait for the green check), how to add photos, and what to do when prices look wrong on the live site. No jargon, numbered steps, real file paths. | `README.md` | Someone who has never seen the repo can change a phone number by following it |

**Performance budget**, enforced at task 30. Measured on the home page, mobile
emulation, Slow 4G, 4x CPU throttle.

| Metric | Budget |
| --- | --- |
| HTML per page, gzipped | 20KB |
| CSS total, gzipped | 18KB |
| JS total, gzipped | 8KB |
| Font file | 90KB |
| Hero image, largest variant | 160KB |
| Any gallery image | 120KB |
| Total first load, home page | 350KB |
| Requests, home page | 15 |
| LCP | 2.5s |
| CLS | 0.05 |
| TBT | 150ms |

---

## 6. Content requirements

This is the single list Masih hands to his uncle. Every item names the key it fills
in `src/data/content.json` or `src/data/products.json`, so real content drops in
without touching any markup. **Blocking** items must arrive before the site can go
live; the rest can arrive later and the site works without them.

### 6.1 Contact details (every page)

| What | Key | Format | Good answer | Blocking |
| --- | --- | --- | --- | --- |
| Shop phone | `contact.phones[0].display` and `.tel` | Display in Persian digits with a dash; `tel` in international format, Latin digits, no spaces | `۰۲۱-۵۵۱۲۳۴۵۶` and `+982155123456` | Yes |
| Warehouse phone or mobile | `contact.phones[1].display` and `.tel` | Same | `۰۹۱۲۱۲۳۴۵۶۷` and `+989121234567` | Yes |
| WhatsApp number | `contact.whatsapp.number`, `.displayFa` | E.164 without `+`, Latin digits | `989121234567` | Yes |
| Full address | `contact.address.lineFa`, `.cityFa`, `.provinceFa` | One line as you would say it to a driver | `تهران، جاده ساوه، بعد از میدان بهاران، مجتمع آهن‌فروشان، پلاک ۱۲` | Yes |
| Landmark | `contact.address.landmarkFa` | One short line | `روبه‌روی بانک ملت` | No |
| Coordinates | `contact.address.lat`, `.lng` | Decimal degrees; open نشان, long-press the shop, copy the numbers | `35.6421`, `51.3054` | Yes |
| Map links | `contact.address.mapLinks.*` | Share links from نشان، بلد و گوگل مپ | a `neshan.org/maps/...` URL | No |
| Postal code | `contact.address.postalCode` | 10 digits | `1371834561` | No |
| Working hours | `contact.hours[*]` | Days plus open and close, and which day is closed | `شنبه تا چهارشنبه ۸ تا ۱۷`، `پنجشنبه ۸ تا ۱۳`، `جمعه تعطیل` | Yes |
| Email | `contact.emailFa` | One address, or say there is none | `info@ahanbanaei.ir` | No |

### 6.2 Home page

| What | Key | Format | Good answer | Blocking |
| --- | --- | --- | --- | --- |
| Hero headline | `pages.home.hero.title` | One sentence, at most 12 words, what the shop does | `آهن‌آلات ساختمانی، از انباری که ۵۰ سال سرِ قولش بوده` | No (a default is written) |
| Hero sub-line | `pages.home.hero.lead` | One sentence naming the main product families | see the filled example in 2.6 | No |
| Number of stocked items | `pages.home.stats[1].value` | A number, approximate is fine | `۳۰۰` | No |
| Warehouse stock in tons | `pages.home.stats[2].value` | A number, approximate | `۱۵۰۰` | No |
| Three reasons to buy here | `pages.home.usps[*].bodyFa` | One sentence each, concrete, no marketing air | `فاکتور رسمی برای مناقصات و پروژه‌های دولتی صادر می‌شود.` | No |

### 6.3 Products page

The product list is the single most important thing the uncle provides. **No prices
here**; prices live in `prices.shop.json` and are Masih's job.

| What | Key | Format | Good answer | Blocking |
| --- | --- | --- | --- | --- |
| Product families stocked | `catalog.categories[*].titleFa` | A list, in the order he would say them | `میلگرد آجدار، تیرآهن، ورق سیاه، پروفیل و قوطی، نبشی، ناودانی` | Yes |
| Sizes per family | `catalog.items[*].size` and `.sizeFa` | Every size actually stocked, in his own words | `میلگرد: ۸، ۱۰، ۱۲، ۱۴، ۱۶، ۱۸، ۲۰، ۲۲، ۲۵، ۲۸، ۳۲` | Yes |
| Grade or standard per family | `catalog.items[*].gradeFa`, `.standardFa` | `A2`, `A3`, `ST37`, `ST52`, or "ندارد" | `میلگرد آجدار A3` | Yes |
| Selling unit per family | `catalog.items[*].unitFa` | کیلوگرم، شاخه، بندیل، برگ | `کیلوگرم` | Yes |
| Standard length | `catalog.items[*].lengthM` | Metres | `۱۲` | No |
| Usual factories | `catalog.items[*].factoryFa` | Factory names per family | `ذوب‌آهن اصفهان، کویر کاشان` | No |
| One line describing each family | `catalog.categories[*].summaryFa` | One sentence, what it is used for | `میلگرد آجدار ساختمانی برای آرماتوربندی فونداسیون و سقف.` | No |

### 6.4 About page

| What | Key | Format | Good answer | Blocking |
| --- | --- | --- | --- | --- |
| The story text | `pages.about.body` | Already supplied by Masih, used verbatim, split into paragraphs | the existing Persian text | Yes, already have it |
| Slogan | `business.slogan` | Supplied | `آهن‌آلات بنایی؛ ستون اعتماد و کیفیت در ساخت فردا` | Yes, already have it |
| Founding year | `business.foundedYear` | Gregorian or Jalali, say which | `۱۳۵۳` | No |
| Anything the shop is known for | `pages.home.usps[*].bodyFa` | One or two sentences | `تأمین آهن پروژه‌های مسکن مهر منطقه از سال ۱۳۸۸` | No |

### 6.5 Photography

This is the second blocking item. The site is dark and image-led; stock photos would
kill the credibility the copy is claiming.

* **How many:** 12 to 16 usable shots. Expect to take 40 and keep 14.
* **Orientation:** landscape (hold the phone sideways). Portrait shots cannot be used
  in the hero or the gallery grid.
* **Resolution:** at least 2000px on the long edge. Do not send screenshots, do not
  send photos forwarded through WhatsApp (WhatsApp recompresses them); send the
  original files by email, Telegram "send as file", or a USB copy.
* **Light:** daylight, morning or late afternoon. No flash. No night shots under
  sodium lamps.
* **Framing:** fill the frame with the material. Clean the immediate foreground.
  No people's faces without their permission, no visible personal phone numbers or
  invoices, no other business's signage.
* **Shot list:**
  1. `[[PHOTO_HERO]]` The warehouse from the entrance, rows of stacked steel with
     depth. This is the hero image; it is the one shot that matters most. Key:
     `pages.home.hero.image` plus `imageAltFa`.
  2. `[[PHOTO_1]]` to `[[PHOTO_12]]` Gallery, keys `gallery[n].base` and `altFa`:
     stacked rebar bundles end-on; I-beams stacked lengthwise; sheet stacks;
     profile and box sections in racks; angle and channel bundles; a crane or
     forklift loading a truck; a truck being loaded at the gate; the cutting or
     bending area if there is one; the shop counter or office from inside; the
     shop front with the sign, taken from across the street; a wide shot of the
     yard; a close detail of rebar ribs or a mill mark on a beam.
  3. `[[PHOTO_MAP]]` A screenshot of the shop's pin in نشان, zoomed so the nearest
     main street is readable. Key: `public/img/map-static.webp`.
* **Blocking:** the hero shot and four gallery shots. The rest can arrive later; the
  gallery grid renders whatever exists.

### 6.6 Prices (Masih, not the uncle)

| What | Key | Format | Blocking |
| --- | --- | --- | --- |
| The shop's own price per SKU | `prices.shop.json → items[*].price` | Integer, تومان, per the unit declared in `products.json` | Yes, at least for the twelve featured SKUs |
| Whether each item is in stock | `items[*].inStock` | `true` or `false` | No, defaults to `true` |
| Minimum order | `items[*].minOrderFa` | Free text | No |
| Last updated stamp | `updatedAt` | ISO 8601 with `+03:30`, changed in the same commit as any price | Yes |

### 6.7 Legal and closing details

| What | Key | Format | Blocking |
| --- | --- | --- | --- |
| Registered business name for the footer and JSON-LD | `business.legalName` | As registered | No |
| Whether prices include VAT | `legal.vatNoteFa` | One sentence; the default says they do not | No |
| Anything that must not appear on the site | note it to Masih | free text | No |

---

**Executor note.** When every task in section 5 is checked and `npm run check`
lists only non-blocking placeholders, the site is ready to publish. Do not go live
while `[[PHONE_SHOP_TEL]]`, `[[WHATSAPP_E164]]`, `[[ADDRESS_LINE]]`, `[[GEO_LAT]]`
or `[[GEO_LNG]]` are still unfilled: a steel shop whose phone number does not dial
is worse than no site at all.
