import { load } from 'cheerio'
import { isAllowed } from './robots.mjs'

const USER_AGENT = 'AhanBanaeiPriceBot/1.0 (+https://ahanbanaei.ir/about/; contact: [[EMAIL]])'
const MIN_GAP_MS = 2000

const lastRequestByHost = new Map()

async function throttle (host) {
  const last = lastRequestByHost.get(host) || 0
  const wait = MIN_GAP_MS - (Date.now() - last)
  if (wait > 0) await new Promise((r) => setTimeout(r, wait))
  lastRequestByHost.set(host, Date.now())
}

function sleep (ms) {
  return new Promise((r) => setTimeout(r, ms))
}

// Fetches a URL with a robots.txt gate, a descriptive UA, a timeout, and
// retry with exponential backoff. Throws on final failure or a robots
// disallow; callers (adapters via scrape-prices.mjs) catch and mark the
// source `stale` rather than letting one bad source kill the whole run.
export async function get (url, { retries = 3, timeoutMs = 15000, log = console.log } = {}) {
  if (!(await isAllowed(url, USER_AGENT))) {
    throw new Error(`robots.txt disallows ${url}`)
  }

  const host = new URL(url).host
  let lastErr

  for (let attempt = 0; attempt <= retries; attempt++) {
    await throttle(host)
    let res
    try {
      res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'fa-IR' },
        signal: AbortSignal.timeout(timeoutMs)
      })
    } catch (err) {
      // network error: retryable
      lastErr = err
      if (attempt === retries) break
      const backoff = [1000, 3000, 9000][attempt] + Math.random() * 500
      log(`retry ${attempt + 1}/${retries} for ${url} after network error: ${err.message}`)
      await sleep(backoff)
      continue
    }

    if (res.ok) return await res.text()

    if (res.status === 429 || res.status >= 500) {
      lastErr = new Error(`HTTP ${res.status}`)
      if (attempt === retries) break
      const retryAfter = Number(res.headers.get('retry-after'))
      const backoff = Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1000
        : [1000, 3000, 9000][attempt] + Math.random() * 500
      log(`retry ${attempt + 1}/${retries} for ${url} after HTTP ${res.status}`)
      await sleep(backoff)
      continue
    }

    // 4xx other than 429: not retryable
    throw new Error(`HTTP ${res.status} (not retried)`)
  }
  throw lastErr
}

export function $ (html) {
  return load(html)
}

export { USER_AGENT }
