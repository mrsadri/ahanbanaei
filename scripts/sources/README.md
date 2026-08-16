# Source verification log

Checklist reference: BUILD-PLAN.md section 4.8. Every candidate below was
checked live on 2026-08-16 (robots.txt fetched and evaluated with the actual
`robots-parser` package that runs in production, price pages fetched and
inspected by hand). Only sources that pass are wired into
`scripts/sources/index.mjs`; the rest are recorded here so the next session
does not repeat the same investigation from zero.

## Wired in

### ahanonline.com — accepted, 2026-08-16
- `robots.txt` disallows `*price-list*` and `/PriceList/*`, but the actual
  category pages used (`/product-category/میلگرد/قیمت-میلگرد/` and
  `/product-category/تیرآهن-و-هاش/تیرآهن/`) use the Persian word "قیمت", not
  the ASCII string "price-list", so they do not match any Disallow rule.
  Verified with `robots-parser` directly, not by inspection alone.
- Long-running commercial marketplace aggregating multiple factories and
  dealers ("بنگاه"), publishly listing an about/contact page.
- Prices are server-rendered in a plain HTML table (class `table_price`), no
  JavaScript required to read them. Confirmed by fetching the page with
  `curl` and a plain user agent (no browser, no JS execution) and finding
  the price rows present in the raw response.
- Each page states a "آخرین بروز رسانی" (last updated) date next to every
  row. On the day checked it read `1405/5/25` (today, Jalali) for every row
  sampled.
- Unit and currency are explicit: the price column header is literally
  "قیمت (تومان)" (price, in Toman). The rebar table is already priced per
  kilogram; the IPE beam table mixes per-branch and per-kilogram rows and
  states an explicit weight per branch, so the adapter converts per-branch
  rows to per-kilogram using that weight, per BUILD-PLAN.md section 4.5
  step 3. Cross-checked: IPE size 14 has both a per-branch row
  (13,818,180 Toman / 155 kg = 89,150 Toman/kg) and a direct per-kilogram
  row (89,130 Toman/kg) on the same page — the two agree to within 0.02%,
  which validates the conversion.
- The same size is listed by several sellers at different prices. The
  adapter averages all listed prices for a given size+grade rather than
  picking one seller, which is both more representative and harder for a
  single bad listing to distort.
- No login, no paywall, no captcha.

Covers: `rebar_*_a2`, `rebar_*_a3`, `ipe_*_st37`.

## Investigated, not wired in

### foolad24.com — deferred, 2026-08-16
`robots.txt` allows the product pages used (`Allow: /`, no rebar-specific
disallow). The rebar listing page (`/products/rebars/قیمت-میلگرد`) is
server-rendered and has a clear `.product-card` structure with a title,
a price range, and an update timestamp. Not wired in yet because the price
is published as a **range** across sellers (e.g. "24,600 تا 76,000 تومان"
for one nominal product) with a spread too wide to trust as a single
reference figure without a follow-up call to the site to understand why
(likely mixes retail and wholesale, or different actual sizes under one
listing). Revisit once that spread is understood; the adapter contract and
`robots.txt` clearance are already confirmed, so wiring it in later is
mostly parsing work.

### chilanonline.com — deferred, 2026-08-16
`robots.txt` (Cloudflare-managed Content-Signal format) allows generic
crawlers on `/`. On inspection the site is a steel-industry association
news and publishing outlet, not a price-table publisher: no page with a
structured per-size, per-grade price table was found from the homepage
navigation. Not a fit for this scraper's row format; drop from the
shortlist unless a dedicated price page is found later.

### tgju.org — deferred by design
`robots.txt` allows crawling. The site is a general currency/gold/commodity
index; its base-metals coverage is a headline index, not per-size rebar or
beam prices, so it cannot be joined against the SKU scheme this site uses
(BUILD-PLAN.md section 4.2 flagged this risk in advance). Not wired in.

### ime.co.ir (Iran Mercantile Exchange) — unreachable during verification
The single most defensible source on the original shortlist (official
exchange settlement prices), but `https://www.ime.co.ir/robots.txt` timed
out repeatedly from this environment's network (connection established,
TLS handshake did not complete, 10s timeout). This may be a transient
network issue, a firewall on IME's side, or a routing problem specific to
this environment rather than a real block. **Retry this one first** if a
session with different network access is available — it is the highest
priority addition once reachable, since settlement prices from the official
exchange are the strongest possible reference figure.

## Adding a new source

Copy `_template.mjs`, run the checklist above and in BUILD-PLAN.md section
4.8, append a dated entry to this file either under "Wired in" or
"Investigated, not wired in", and only add the adapter to `index.mjs` if it
passed every item on the checklist.
