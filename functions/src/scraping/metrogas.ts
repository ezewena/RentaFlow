import puppeteer from 'puppeteer'
import { ScrapingResult } from './edesur'

export async function consultarMetrogas(nroCliente: string): Promise<ScrapingResult> {
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

    await page.goto('https://www.metrogas.com.ar/hogares/estado-de-cuenta/', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    })

    const clienteInput = await page.$(
      'input[name*="cliente"], input[id*="cliente"], input[placeholder*="cliente"]',
    )
    if (!clienteInput) throw new Error('Campo cliente no encontrado')

    await clienteInput.type(nroCliente)

    const submitBtn = await page.$('button[type="submit"], input[type="submit"]')
    if (submitBtn) {
      await Promise.all([submitBtn.click(), page.waitForNavigation({ timeout: 15000 }).catch(() => {})])
    }

    await new Promise((r) => setTimeout(r, 3000))
    const html = await page.content()

    const tieneDeuda =
      html.toLowerCase().includes('deuda') ||
      html.toLowerCase().includes('vencida') ||
      html.toLowerCase().includes('debe')
    const alDia =
      html.toLowerCase().includes('sin deuda') ||
      html.toLowerCase().includes('al día') ||
      html.toLowerCase().includes('no adeuda')

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
    console.error('Error scraping Metrogas:', error)
    return { estado: 'error' }
  } finally {
    if (browser) await browser.close()
  }
}
