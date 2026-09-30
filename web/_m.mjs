import { chromium, devices } from 'playwright'
const OUT = process.env.TEMP + '/claude/C--Users-umais/6ccc308d-48ca-4cc0-9574-bdf34437ee1e/images'
const b = await chromium.launch({ channel: 'msedge', headless: true })
const ctx = await b.newContext({ ...devices['iPhone 13'], isMobile: true, hasTouch: true })
const p = await ctx.newPage()
const shot = (n) => p.screenshot({ path: `${OUT}/mob-${n}.png`, fullPage: false })

await p.goto('https://distroledger.vercel.app/login', { waitUntil: 'networkidle' })
await p.fill('input[autocomplete="username"]', 'salah-traders')
await p.fill('input[type="password"]', 'Pakistan2026')
await p.click('button[type="submit"]')
await p.waitForTimeout(4000)
await shot('01-dashboard')

await p.goto('https://distroledger.vercel.app/sales', { waitUntil: 'networkidle' }); await p.waitForTimeout(2500)
await shot('02-sales')

await p.goto('https://distroledger.vercel.app/customers', { waitUntil: 'networkidle' }); await p.waitForTimeout(3000)
await shot('03-customers')
// full page scroll of customers to see detail below list
await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(800)
await shot('03b-customers-bottom')

await p.goto('https://distroledger.vercel.app/receivables', { waitUntil: 'networkidle' }); await p.waitForTimeout(2500)
await shot('04-receivables')

await p.goto('https://distroledger.vercel.app/settings', { waitUntil: 'networkidle' }); await p.waitForTimeout(2000)
await shot('05-settings')

// sale drawer on mobile
await p.goto('https://distroledger.vercel.app/sales', { waitUntil: 'networkidle' }); await p.waitForTimeout(2500)
await p.getByRole('button', { name: /New sale/i }).first().click().catch(()=>{}); await p.waitForTimeout(1200)
await shot('06-sale-drawer')

await ctx.close(); await b.close(); console.log('done')
