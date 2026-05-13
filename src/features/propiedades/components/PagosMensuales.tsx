import { useState, useEffect, useCallback } from 'react'
import {
  CheckCircle2, Clock, AlertCircle, Banknote,
  TrendingUp, ChevronDown, ChevronUp, Info,
} from 'lucide-react'
import { Propiedad } from '@/shared/lib/types'
import { registrarPago, desmarcarPago } from '../services/propiedadesService'
import { calcularDeudaActual, mesActual, formatCurrency, formatDate } from '@/shared/lib/utils'
import { cn } from '@/shared/lib/utils'
import {
  calcularPeriodos,
  cargarIndices,
  getMontoParaMes,
  addMonthsYM,
  ymToLabel,
  PeriodoAlquiler,
  DatosIndices,
} from '@/shared/lib/calculadorAlquiler'
import toast from 'react-hot-toast'

export interface ProximoAumento {
  mesDesde: string      // YYYY-MM — primer mes del período de ajuste
  monto: number         // nuevo monto proyectado
  variacion: number     // % de variación
  estimado: boolean
}

interface Props {
  propiedad: Propiedad
  onPagoRegistrado: (p: Propiedad) => void
  onMontoActualCambiado?: (monto: number) => void
  onProximoAumento?: (info: ProximoAumento | null) => void
}

function mesesDesdeInicio(fechaInicio: string): string[] {
  const hoy = new Date()
  const [primerAnio, primerMesNum] = fechaInicio.split('-').map(Number)
  const primerMes = primerMesNum - 1
  const meses: string[] = []
  let anio = hoy.getFullYear()
  let mes = hoy.getMonth()
  for (let i = 0; i < 36; i++) {
    if (anio < primerAnio || (anio === primerAnio && mes < primerMes)) break
    meses.push(`${anio}-${String(mes + 1).padStart(2, '0')}`)
    mes--
    if (mes < 0) { mes = 11; anio-- }
  }
  return meses
}

function labelMes(mes: string): string {
  const [y, m] = mes.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
}

export function PagosMensuales({ propiedad, onPagoRegistrado, onMontoActualCambiado, onProximoAumento }: Props) {
  const [guardando,    setGuardando]    = useState<string | null>(null)
  const [datosIndices, setDatosIndices] = useState<DatosIndices>({})
  const [indiceError,  setIndiceError]  = useState(false)
  const [cargandoIdx,  setCargandoIdx]  = useState(false)
  const [periodos,     setPeriodos]     = useState<PeriodoAlquiler[]>([])
  const [mostrarTabla, setMostrarTabla] = useState(false)

  const meses  = mesesDesdeInicio(propiedad.contrato.fechaInicio)
  const mesHoy = mesActual()
  const indice = propiedad.contrato.actualizacion?.indice

  // Monto ajustado para el mes actual (disponible una vez que se cargaron los períodos)
  const montoHoy = periodos.length > 0
    ? getMontoParaMes(mesHoy, periodos)
    : propiedad.contrato.montoAlquiler

  const deuda = calcularDeudaActual(propiedad, montoHoy)

  // ── Carga datos del índice desde API ──────────────────────────────────────
  useEffect(() => {
    if (!indice || indice === 'ninguno' || indice === 'manual') return
    setCargandoIdx(true)
    cargarIndices(indice, propiedad.contrato.fechaInicio)
      .then((d) => { setDatosIndices(d); setIndiceError(false) })
      .catch(() => setIndiceError(true))
      .finally(() => setCargandoIdx(false))
  }, [indice, propiedad.contrato.fechaInicio])

  // ── Recalcular períodos ────────────────────────────────────────────────────
  const recalcularPeriodos = useCallback(() => {
    const hasta = addMonthsYM(mesHoy, propiedad.contrato.actualizacion?.periodoMeses ?? 0)
    setPeriodos(calcularPeriodos(propiedad.contrato, hasta, datosIndices))
  }, [propiedad.contrato, datosIndices, mesHoy])

  useEffect(() => { recalcularPeriodos() }, [recalcularPeriodos])

  // ── Notificar al padre cuando cambia el monto del mes actual ──────────────
  useEffect(() => {
    if (periodos.length > 0) {
      onMontoActualCambiado?.(montoHoy)
    }
  }, [montoHoy, periodos.length, onMontoActualCambiado])

  // ── Notificar al padre sobre el próximo período de ajuste ─────────────────
  useEffect(() => {
    if (periodos.length === 0) return
    const proximo = periodos.find((p) => p.numero > 1 && p.mesDesde > mesHoy) ?? null
    onProximoAumento?.(
      proximo
        ? { mesDesde: proximo.mesDesde, monto: proximo.monto, variacion: proximo.variacion, estimado: proximo.estimado }
        : null,
    )
  }, [periodos, mesHoy, onProximoAumento])

  // ── Monto ajustado para un mes ─────────────────────────────────────────────
  const montoParaMes = (mes: string): number => {
    if (periodos.length > 0) return getMontoParaMes(mes, periodos)
    return propiedad.contrato.montoAlquiler
  }

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handlePagar = async (mes: string) => {
    setGuardando(mes)
    try {
      const monto = mes === mesHoy && deuda
        ? deuda.totalDeuda
        : montoParaMes(mes)

      await registrarPago(propiedad.id, mes, monto)
      const updated: Propiedad = {
        ...propiedad,
        pagos: {
          ...propiedad.pagos,
          [mes]: { mes, estado: 'pagado', fechaPago: new Date().toISOString(), montoPagado: monto },
        },
      }
      onPagoRegistrado(updated)
      toast.success(`Pago de ${labelMes(mes)} registrado`)
    } catch {
      toast.error('Error al registrar el pago')
    } finally {
      setGuardando(null)
    }
  }

  const handleDesmarcar = async (mes: string) => {
    setGuardando(mes)
    try {
      await desmarcarPago(propiedad.id, mes)
      const updated: Propiedad = {
        ...propiedad,
        pagos: {
          ...propiedad.pagos,
          [mes]: { mes, estado: 'pendiente' },
        },
      }
      onPagoRegistrado(updated)
      toast.success('Pago desmarcado')
    } catch {
      toast.error('Error al desmarcar el pago')
    } finally {
      setGuardando(null)
    }
  }

  const hayActualizaciones = !!indice && indice !== 'ninguno' && periodos.length > 1

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Banknote className="w-4 h-4 text-brand-600" />
        <h2 className="font-semibold text-gray-900">Pagos mensuales</h2>
      </div>

      {/* Banner de mora activa */}
      {deuda && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-700">
                Alquiler impago — {deuda.diasMora} día{deuda.diasMora !== 1 ? 's' : ''} de mora
              </p>
              <div className="mt-1 text-xs text-red-600 space-y-0.5">
                <p>Alquiler base: {formatCurrency(deuda.montoBase, deuda.moneda)}</p>
                {deuda.moraDiaria > 0 && (
                  <p>
                    Mora: {formatCurrency(deuda.moraDiaria, deuda.moneda)}/día
                    × {deuda.diasMora} días = {formatCurrency(deuda.moraTotal, deuda.moneda)}
                  </p>
                )}
                <p className="font-bold text-red-700 text-sm pt-1">
                  Total a cobrar: {formatCurrency(deuda.totalDeuda, deuda.moneda)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Aviso índice no disponible */}
      {indiceError && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
          <Info className="w-3.5 h-3.5 flex-shrink-0" />
          No se pudo obtener datos del índice {indice}. Los montos son estimados.
        </div>
      )}

      {/* ── Tabla de actualizaciones (colapsable) ── */}
      {hayActualizaciones && (
        <div className="rounded-lg border border-brand-100 bg-brand-50 overflow-hidden">
          <button
            onClick={() => setMostrarTabla((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-brand-700 hover:bg-brand-100 transition-colors"
          >
            <span className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Historial de actualizaciones ({indice})
              {cargandoIdx && (
                <span className="inline-block w-3 h-3 rounded-full border-2 border-brand-400 border-t-transparent animate-spin" />
              )}
            </span>
            {mostrarTabla
              ? <ChevronUp className="w-4 h-4" />
              : <ChevronDown className="w-4 h-4" />
            }
          </button>

          {mostrarTabla && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-t border-brand-100 bg-white">
                    <th className="text-left px-4 py-2 text-gray-500 font-semibold">#</th>
                    <th className="text-left px-4 py-2 text-gray-500 font-semibold">Período</th>
                    <th className="text-right px-4 py-2 text-gray-500 font-semibold">Variación</th>
                    <th className="text-right px-4 py-2 text-gray-500 font-semibold">Alquiler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {periodos.map((p) => (
                    <tr key={p.numero} className={cn(
                      'bg-white',
                      p.mesDesde <= mesHoy && mesHoy <= p.mesHasta && 'bg-brand-50',
                    )}>
                      <td className="px-4 py-2 text-gray-400">{p.numero}</td>
                      <td className="px-4 py-2 text-gray-700">
                        {ymToLabel(p.mesDesde)}
                        {p.mesHasta !== p.mesDesde && <> → {ymToLabel(p.mesHasta)}</>}
                        {p.mesDesde <= mesHoy && mesHoy <= p.mesHasta && (
                          <span className="ml-1.5 text-brand-600 font-semibold">← actual</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {p.numero === 1 ? (
                          <span className="text-gray-400">Base</span>
                        ) : (
                          <span className={cn(
                            'font-semibold',
                            p.estimado ? 'text-amber-600' : 'text-green-700',
                          )}>
                            +{p.variacion.toFixed(1)}%
                            {p.estimado && <span className="text-amber-500 ml-1">~</span>}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right font-semibold text-gray-900">
                        {formatCurrency(p.monto, propiedad.contrato.moneda)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {periodos.some((p) => p.estimado) && (
                <p className="px-4 py-2 text-xs text-amber-600 border-t border-brand-100">
                  ~ Valores estimados por falta de datos oficiales del período.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Lista de meses ── */}
      <div className="space-y-2">
        {meses.map((mes) => {
          const pago       = propiedad.pagos?.[mes]
          const pagado     = pago?.estado === 'pagado'
          const montoMes   = montoParaMes(mes)
          const esMesHoy   = mes === mesHoy
          const [y, m]     = mes.split('-').map(Number)
          const diaHoy     = new Date().getDate()
          const mesAnioHoy = new Date().getFullYear() * 12 + new Date().getMonth()
          const mesAnioItem = y * 12 + (m - 1)
          const vencido    = esMesHoy
            ? diaHoy > propiedad.contrato.diaVencimiento
            : mesAnioItem < mesAnioHoy

          // ¿Es un período de ajuste? (primer mes de cada período después del 1)
          const esAjuste = periodos.some(
            (p) => p.numero > 1 && p.mesDesde === mes,
          )
          const periodoAjuste = esAjuste
            ? periodos.find((p) => p.mesDesde === mes)
            : undefined

          return (
            <div
              key={mes}
              className={cn(
                'flex items-center justify-between px-3 py-2.5 rounded-lg border transition-colors',
                pagado
                  ? 'border-green-200 bg-green-50'
                  : vencido
                    ? 'border-red-200 bg-red-50'
                    : 'border-gray-100 bg-gray-50',
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {pagado ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                ) : vencido ? (
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                ) : (
                  <Clock className="w-4 h-4 text-gray-300 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className={cn(
                      'text-sm font-medium capitalize',
                      pagado ? 'text-green-700' : vencido ? 'text-red-700' : 'text-gray-600',
                    )}>
                      {labelMes(mes)}
                    </p>
                    {esMesHoy && (
                      <span className="text-xs text-gray-400">(mes actual)</span>
                    )}
                    {esAjuste && periodoAjuste && (
                      <span className="flex items-center gap-0.5 text-xs font-semibold text-brand-600 bg-brand-50 border border-brand-200 px-1.5 py-0.5 rounded">
                        <TrendingUp className="w-3 h-3" />
                        +{periodoAjuste.variacion.toFixed(1)}%
                        {periodoAjuste.estimado && '~'}
                      </span>
                    )}
                  </div>

                  {/* Monto del período */}
                  <p className={cn(
                    'text-xs mt-0.5',
                    pagado ? 'text-green-600' : vencido ? 'text-red-500' : 'text-gray-400',
                  )}>
                    {pagado && pago?.fechaPago ? (
                      <>
                        Pagado el {formatDate(pago.fechaPago.split('T')[0])}
                        {pago.montoPagado !== undefined && (
                          <> — {formatCurrency(pago.montoPagado, propiedad.contrato.moneda)}</>
                        )}
                      </>
                    ) : esMesHoy && deuda ? (
                      <>Debe: {formatCurrency(deuda.totalDeuda, deuda.moneda)}</>
                    ) : !pagado && vencido ? (
                      <>Vencido — {formatCurrency(montoMes, propiedad.contrato.moneda)}</>
                    ) : (
                      formatCurrency(montoMes, propiedad.contrato.moneda)
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {pagado ? (
                  <button
                    onClick={() => handleDesmarcar(mes)}
                    disabled={guardando === mes}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                  >
                    Desmarcar
                  </button>
                ) : (
                  <button
                    onClick={() => handlePagar(mes)}
                    disabled={guardando === mes}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-gray-200 hover:bg-green-50 hover:border-green-300 hover:text-green-700 disabled:opacity-50 transition-colors shadow-sm"
                  >
                    {guardando === mes ? 'Guardando…' : 'Marcar pagado'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
