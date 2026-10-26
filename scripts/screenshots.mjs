// Playwright WebKit screenshots at iPhone 16 Pro Max size (440x956 @3x) -> screens/
import { webkit } from 'playwright'
import { mkdir } from 'node:fs/promises'
import { serve } from './serve.mjs'

const { server, url } = await serve('dist')
await mkdir('screens', { recursive: true })
const browser = await webkit.launch()
const ctx = await browser.newContext({
  viewport: { width: 440, height: 956 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
})
const page = await ctx.newPage()
const errs = []
page.on('pageerror', (e) => errs.push(String(e)))
const shot = async (n) => {
  await page.waitForTimeout(450)
  await page.screenshot({ path: `screens/${n}.png` })
  console.log(`screens/${n}.png`)
}

await page.goto(url)
await page.waitForSelector('[data-testid="metrics"]')
await page.waitForSelector('[data-testid="chart"] svg')
await shot('01-flow-top')

await page.locator('[data-testid="chart"]').scrollIntoViewIfNeeded()
await page.waitForTimeout(300)
await shot('02-sankey')

// tap NOI node via table
await page.locator('.items tr', { hasText: 'NOI' }).first().click()
await page.waitForSelector('[data-testid="detail"]')
await shot('03-node-detail')
await page.click('.close')

await page.locator('[data-testid="inputs"]').scrollIntoViewIfNeeded()
await shot('04-inputs')

// monthly toggle
await page.click('.seg >> text=Monthly')
await page.waitForTimeout(300)
await page.locator('[data-testid="chart"]').scrollIntoViewIfNeeded()
await shot('05-monthly')
await page.click('.seg >> text=Annual')

// save + saved list
await page.click('text=Save deal')
await page.waitForTimeout(400)
await page.click('text=/Saved/')
await page.waitForSelector('[data-testid="saved"]')
await page.waitForSelector('.saved li')
await shot('06-saved-list')

// glossary / terms tab (wait out save toast first)
await page.waitForTimeout(1600)
await page.click('[data-testid="tabs"] >> text=Terms')
await page.waitForSelector('[data-testid="glossary"]')
await page.waitForSelector('.g-item')
await page.waitForSelector('.toast', { state: 'detached' }).catch(() => {})
await shot('07-glossary')

// about tab
await page.click('[data-testid="tabs"] >> text=About')
await page.waitForSelector('[data-testid="about"]')
await shot('08-about')

const sw = await page.evaluate(() => navigator.serviceWorker?.getRegistration().then((r) => !!r))
console.log('sw registered:', sw, 'errors:', errs.length ? errs : 'none')
await browser.close()
server.close()
