import puppeteer from 'puppeteer'
import { ScrapingResult } from './edesur'

export async function consultarAysa(nroCliente: string): Promise<ScrapingResult> {
  let browser
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    })
    const page = await browser.newPage()
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    )

    await page.goto('https://www.aysa.com.ar/atencion-al-cliente/estado-de-deuda', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    })

    const input = await page.$(
      'input[name*="cuenta"], input[name*="cliente"], input[id*="cuenta"]',
    )
    if (!input) throw new Error('Campo cuenta no encontrado')

    await input.type(nroCliente)

    const btn = await page.$('button[type="submit"]')
    if (btn) {
      await Promise.all([btn.click(), page.waitForNavigation({ timeout: 15000 }).catch(() => {})])
    }

    await new Promise((r) => setTimeout(r, 3000))
    const html = await page.content()

    const tieneDeuda = html.toLowerCase().includes('deuda') || html.toLowerCase().includes('debe')
    const alDia = html.toLowerCase().includes('sin deuda') || html.toLowerCase().includes('al día')

    if (alDia) return { estado: 'al_dia' }
    if (tieneDeuda) {
      const montoMatch = html.match(/\$\s*([\d.,]+)/)
      const monto = montoMatch
        ? parseFloat(montoMatch[1].replace(/\./g, '').replace(',', '.'))
        : undefined
      return { estado: 'deuda', monto }
    }
    return { estado: 'al_dia' }
  } catch (error) {
    console.error('Error scraping AySA:', error)
    return { estado: 'error' }
  } finally {
    if (browser) await browser.close()
  }
}
