import robotsParser from 'robots-parser'

const cache = new Map()

async function getRobots (origin, userAgent) {
  if (cache.has(origin)) return cache.get(origin)
  const url = `${origin}/robots.txt`
  let robots
  try {
    const res = await fetch(url, { headers: { 'User-Agent': userAgent }, signal: AbortSignal.timeout(10000) })
    const body = res.ok ? await res.text() : ''
    robots = robotsParser(url, body)
  } catch {
    // No robots.txt reachable: treat as silent (no explicit rules), but
    // adapters still gate on the checklist in BUILD-PLAN.md section 4.8
    // before being wired in, so this is not a licence to scrape blindly.
    robots = robotsParser(url, '')
  }
  cache.set(origin, robots)
  return robots
}

export async function isAllowed (targetUrl, userAgent) {
  const origin = new URL(targetUrl).origin
  const robots = await getRobots(origin, userAgent)
  return robots.isAllowed(targetUrl, userAgent) !== false
}
