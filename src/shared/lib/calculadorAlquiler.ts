/**
 * Calculador de actualizaciones de alquiler — Argentina
 *
 * Fuentes de datos:
 *   ICL  → BCRA  https://api.bcra.gob.ar/estadisticas/v2.0/DatosVariable/40
 *   IPC  → argentinadatos.com  https://api.argentinadatos.com/v1/finanzas/indices/inflacion
 *   CVS  → argentinadatos.com  https://api.argentinadatos.com/v1/finanzas/indices/cvs
 *
 * Las mismas fuentes que usa alquiler.com
 */

import { Contrato } from './types'

// ── Tipos ──────────────────────────────────────────────────────────────────────
export interface PuntoIndice {
  fecha: string   // YYYY-MM-DD
  valor: number   // ICL: valor absoluto del índice | IPC/CVS: % mensual
}

export interface PeriodoAlquiler {
  numero:    number
  mesDesde:  string   // YYYY-MM
  mesHasta:  string   // YYYY-MM (inclusive)
  monto:     number
  variacion: number   // % respecto al período anterior (0 en el primero)
  estimado:  boolean  // true si no había dato disponible para ese período
}

// ── Cache en memoria ───────────────────────────────────────────────────────────
const _cache: Map<string, Promise<PuntoIndice[]>> = new Map()

async function fetchJSON<T>(url: string): Promise<T> {
  const resp = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!resp.ok) throw new Error(`HTTP ${resp.status} — ${url}`)
  return resp.json() as Promise<T>
}

// ── ICL — BCRA ────────────────────────────────────────────────────────────────
export async function fetchICL(desde: string, hasta: string): Promise<PuntoIndice[]> {
  const key = `icl-${desde}-${hasta}`
  if (!_cache.has(key)) {
    _cache.set(key, (async () => {
      const url = `https://api.bcra.gob.ar/estadisticas/v2.0/DatosVariable/40/${desde}/${hasta}`
      const json = await fetchJSON<{ results: { fecha: string; valor: number }[] }>(url)
      if (!json.results?.length) throw new Error('Sin datos ICL del BCRA')
      return json.results.map((r) => ({ fecha: r.fecha, valor: r.valor }))
    })())
  }
  return _cache.get(key)!
}

// Obtiene el valor del ICL en una fecha determinada (el más reciente ≤ fecha)
function iclEnFecha(data: PuntoIndice[], fecha: string): number | null {
  let resultado: number | null = null
  for (const p of data) {
    if (p.fecha <= fecha) resultado = p.valor
    else break
  }
  return resultado
}

// ── IPC — argentinadatos.com ──────────────────────────────────────────────────
// Devuelve variaciones mensuales (%) indexadas por YYYY-MM
export async function fetchIPC(): Promise<Record<string, number>> {
  const key = 'ipc-arg'
  if (!_cache.has(key)) {
    _cache.set(key, (async () => {
      const data = await fetchJSON<{ fecha: string; valor: number }[]>(
        'https://api.argentinadatos.com/v1/finanzas/indices/inflacion',
      )
      return data.map((d) => ({ fecha: d.fecha, valor: d.valor }))
    })())
  }
  const puntos = await _cache.get(key)!
  return Object.fromEntries(puntos.map((p) => [p.fecha.substring(0, 7), p.valor]))
}

// ── CVS — argentinadatos.com ──────────────────────────────────────────────────
export async function fetchCVS(): Promise<Record<string, number>> {
  const key = 'cvs-arg'
  if (!_cache.has(key)) {
    _cache.set(key, (async () => {
      const data = await fetchJSON<{ fecha: string; valor: number }[]>(
        'https://api.argentinadatos.com/v1/finanzas/indices/cvs',
      )
      return data.map((d) => ({ fecha: d.fecha, valor: d.valor }))
    })())
  }
  const puntos = await _cache.get(key)!
  return Object.fromEntries(puntos.map((p) => [p.fecha.substring(0, 7), p.valor]))
}

// ── Helpers de fechas ──────────────────────────────────────────────────────────
export function addMonthsYM(ym: string, n: number): string {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1 + n, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function prevMonthYM(ym: string): string {
  return addMonthsYM(ym, -1)
}

export function ymToLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' })
}

// Variación compuesta IPC/CVS entre dos meses (desdeYM incluido, hastaYM excluido)
function variacionCompuesta(
  tabla: Record<string, number>,
  desdeYM: string,
  hastaYM: string,
): { ratio: number; estimado: boolean } {
  let ratio = 1
  let estimado = false
  let cur = desdeYM
  while (cur < hastaYM) {
    if (tabla[cur] !== undefined) {
      ratio *= 1 + tabla[cur] / 100
    } else {
      // Fallback: usamos el último valor conocido o 1% si no hay nada
      const meses = Object.keys(tabla).sort()
      const ultimo = meses.filter((k) => k < cur).pop()
      const pct = ultimo ? tabla[ultimo] : 1.0
      ratio *= 1 + pct / 100
      estimado = true
    }
    cur = addMonthsYM(cur, 1)
  }
  return { ratio, estimado }
}

// ── Datos para cargar antes de calcular ───────────────────────────────────────
export interface DatosIndices {
  ipc?: Record<string, number>
  cvs?: Record<string, number>
  icl?: PuntoIndice[]
  iclError?: boolean
  ipcError?: boolean
  cvsError?: boolean
}

export async function cargarIndices(
  indice: string,
  fechaInicio: string,
): Promise<DatosIndices> {
  const resultado: DatosIndices = {}
  const hoy = new Date()
  const mesHoyYM = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`
  const hastaYM  = addMonthsYM(mesHoyYM, 3)
  const hastaAPI = hastaYM + '-01'

  const [fy, fm] = fechaInicio.split('-').map(Number)
  const desdeAPI = `${fy}-${String(fm).padStart(2, '0')}-01`

  if (indice === 'ICL') {
    try { resultado.icl = await fetchICL(desdeAPI, hastaAPI) }
    catch { resultado.iclError = true }
  }
  if (indice === 'IPC') {
    try { resultado.ipc = await fetchIPC() }
    catch { resultado.ipcError = true }
  }
  if (indice === 'CVS') {
    try { resultado.cvs = await fetchCVS() }
    catch { resultado.cvsError = true }
  }
  return resultado
}

// ── Función principal de cálculo ───────────────────────────────────────────────
export function calcularPeriodos(
  contrato: Contrato,
  hastaYM: string,
  datos: DatosIndices = {},
): PeriodoAlquiler[] {
  const { fechaInicio, montoAlquiler, actualizacion } = contrato
  const [fy, fm] = fechaInicio.split('-').map(Number)
  const mesInicio = `${fy}-${String(fm).padStart(2, '0')}`

  if (!actualizacion || actualizacion.indice === 'ninguno') {
    return [{
      numero: 1, mesDesde: mesInicio, mesHasta: hastaYM,
      monto: montoAlquiler, variacion: 0, estimado: false,
    }]
  }

  const periodoMeses = actualizacion.periodoMeses
  const periodos: PeriodoAlquiler[] = []
  let mesActual   = mesInicio
  let montoActual = montoAlquiler
  let varActual   = 0
  let estActual   = false
  let numero      = 1

  while (mesActual <= hastaYM) {
    const mesSiguiente  = addMonthsYM(mesActual, periodoMeses)
    const mesHasta      = mesSiguiente <= hastaYM ? prevMonthYM(mesSiguiente) : hastaYM

    periodos.push({
      numero,
      mesDesde:  mesActual,
      mesHasta,
      monto:     montoActual,
      variacion: varActual,
      estimado:  estActual,
    })

    if (mesSiguiente > hastaYM) break

    // Ratio para el próximo período
    let ratio    = 1
    let estimado = false

    switch (actualizacion.indice) {
      case 'manual':
        ratio = 1 + (actualizacion.porcentajeManual ?? 0) / 100
        break

      case 'IPC': {
        if (datos.ipc) {
          const r = variacionCompuesta(datos.ipc, mesActual, mesSiguiente)
          ratio = r.ratio; estimado = r.estimado
        } else { estimado = true; ratio = 1.02 }
        break
      }

      case 'CVS': {
        if (datos.cvs) {
          const r = variacionCompuesta(datos.cvs, mesActual, mesSiguiente)
          ratio = r.ratio; estimado = r.estimado
        } else { estimado = true; ratio = 1.02 }
        break
      }

      case 'ICL': {
        if (datos.icl?.length) {
          const v1 = iclEnFecha(datos.icl, mesActual + '-01')
          const v2 = iclEnFecha(datos.icl, mesSiguiente + '-01')
          if (v1 && v2) { ratio = v2 / v1 }
          else          { estimado = true; ratio = 1.02 }
        } else { estimado = true; ratio = 1.02 }
        break
      }
    }

    montoActual = montoActual * ratio
    varActual   = (ratio - 1) * 100
    estActual   = estimado
    mesActual   = mesSiguiente
    numero++
  }

  return periodos
}

// ── Helper: monto para un mes específico ──────────────────────────────────────
export function getMontoParaMes(mes: string, periodos: PeriodoAlquiler[]): number {
  for (const p of periodos) {
    if (mes >= p.mesDesde && mes <= p.mesHasta) return p.monto
  }
  return periodos[periodos.length - 1]?.monto ?? 0
}
