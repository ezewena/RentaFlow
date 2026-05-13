import puppeteer from 'puppeteer'

export interface ScrapingResult {
  estado: 'al_dia' | 'deuda' | 'error'
  monto?: number
  vencimiento?: string
}

export async function consultarEdesur(nic: string): Promise<ScrapingResult> {
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

    await page.goto('https://www.edesur.com.ar/deuda-online/', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    })

    // Buscar campo NIC
    await page.waitForSelector('input[name="nic"], input[id*="nic"], input[placeholder*="NIC"]', {
      timeout: 10000,
    })

    const nicInput = await page.$(
      'input[name="nic"], input[id*="nic"], input[placeholder*="NIC"]',
    )
    if (!nicInput) throw new Error('Campo NIC no encontrado')

    await nicInput.type(nic)

    const submitBtn = await page.$('button[type="submit"], input[type="submit"]')
    if (submitBtn) {
      await Promise.all([submitBtn.click(), page.waitForNavigation({ timeout: 15000 }).catch(() => {})])
    }

    await new Promise((r) => setTimeout(r, 3000))

    const html = await page.content()

    // Detectar estado de deuda en el HTML resultante
    const tieneDeuda =
      html.toLowerCase().includes('deuda') ||
      html.toLowerCase().includes('saldo') ||
      html.toLowerCase().includes('debe')

    const alDia =
      html.toLowerCase().includes('al día') ||
      html.toLowerCase().includes('sin deuda') ||
      html.toLowerCase().includes('no registra')

    if (alDia) return { estado: 'al_dia' }

    if (tieneDeuda) {
      // Intentar extraer monto
      const montoMatch = html.match(/\$\s*([\d.,]+)/)
      const monto = montoMatch ? parseFloat(montoMatch[1].replace(/\./g, '').replace(',', '.')) : undefined
      return { estado: 'deuda', monto }
    }

    return { estado: 'al_dia' }
  } catch (error) {
    console.error('Error scraping EDESUR:', error)
    return { estado: 'error' }
  } finally {
    if (browser) await browser.close()
  }
}
