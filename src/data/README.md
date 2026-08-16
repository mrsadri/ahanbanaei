# Data files

- `content.json` — all site copy and contact details. Edited by hand (Masih).
- `products.json` — the product catalogue (categories + SKUs). Edited by hand (Masih).
- `prices.shop.json` — the shop's own prices. **Edited by hand only, by Masih.** Never written by any script or workflow.
- `prices.market.json` — scraped market reference prices. **Written only by `scripts/scrape-prices.mjs`**, committed only by `.github/workflows/scrape-prices.yml`. Never edit by hand; a manual edit will be overwritten by the next scheduled run.
- `price-bounds.json` — validation guard rails for the scraper. Edited by hand, reviewed occasionally as the market drifts.

SKU scheme: `<type>_<size>_<grade>`, shared by all four files above so rows join by exact string match. See BUILD-PLAN.md section 4.2.
