import { useState } from 'react'
import {
  Zap, Flame, Droplets, Landmark, AlertCircle,
  CheckCircle2, XCircle, HelpCircle, ExternalLink, ChevronDown,
} from 'lucide-react'
import { EstadoServicio } from '@/shared/lib/types'
import { ServicioConfigProvincia, getNumeroCliente, URL_SERVICIO } from '@/shared/lib/provinciaServicios'
import { cn } from '@/shared/lib/utils'

const tipoIcono: Record<string, React.ElementType> = {
  electricidad: Zap,
  gas: Flame,
  agua: Droplets,
  impuesto: Landmark,
}

const ESTADOS: { value: EstadoServicio; label: string; color: string; icon: React.ElementType }[] = [
  { value: 'sin_consultar', label: 'Sin revisar', color: 'text-gray-500 bg-gray-50 border-gray-200',   icon: HelpCircle    },
  { value: 'al_dia',        label: 'Al día',      color: 'text-green-700 bg-green-50 border-green-300', icon: CheckCircle2  },
  { value: 'deuda',         label: 'Con deuda',   color: 'text-red-700 bg-red-50 border-red-300',       icon: XCircle       },
]

interface ServicioCardProps {
  config: ServicioConfigProvincia
  estado: Record<string, unknown>
  onEstadoCambiado: (nuevoEstado: EstadoServicio, monto?: number) => Promise<void>
  actualizando: boolean
}

export function ServicioCard({ config, estado, onEstadoCambiado, actualizando }: ServicioCardProps) {
  const estadoActual = (estado.ultimoEstado as EstadoServicio) ?? 'sin_consultar'
  const ultimaConsulta = estado.ultimaConsulta as string | null
  const montoGuardado = estado.monto as number | undefined
  const numero = getNumeroCliente(estado)
  const urlServicio = URL_SERVICIO[config.key]

  const [monto, setMonto] = useState(montoGuardado?.toString() ?? '')
  const [abierto, setAbierto] = useState(false)

  const IconoServicio = tipoIcono[config.tipo] ?? AlertCircle
  const estadoCfg = ESTADOS.find((e) => e.value === estadoActual) ?? ESTADOS[0]
  const IconoEstado = estadoCfg.icon

  const handleSeleccionar = async (nuevoEstado: EstadoServicio) => {
    setAbierto(false)
    const montoNum = nuevoEstado === 'deuda' && monto ? Number(monto) : undefined
    await onEstadoCambiado(nuevoEstado, montoNum)
  }

  return (
    <div
      className={cn(
        'rounded-xl border p-4 flex flex-col gap-3 transition-colors',
        estadoActual === 'deuda'   ? 'border-red-200 bg-red-50'
        : estadoActual === 'al_dia' ? 'border-green-200 bg-green-50'
        : 'border-gray-200 bg-white',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-white shadow-sm flex-shrink-0">
            <IconoServicio className="w-4 h-4 text-gray-600" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-gray-900">{config.label}</p>
              {urlServicio && (
                <a
                  href={urlServicio}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Ir al sitio de ${config.label}`}
                  className="text-gray-400 hover:text-brand-600 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <p className="text-xs text-gray-500">
              {config.campo}: {numero || '—'}
            </p>
          </div>
        </div>
        <IconoEstado className={cn('w-5 h-5 flex-shrink-0',
          estadoActual === 'al_dia' ? 'text-green-500'
          : estadoActual === 'deuda' ? 'text-red-500'
          : 'text-gray-400',
        )} />
      </div>

      {/* Monto si hay deuda */}
      {estadoActual === 'deuda' && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Monto adeudado ($):</span>
          <input
            type="number"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            onBlur={() => {
              if (monto !== (montoGuardado?.toString() ?? '')) {
                onEstadoCambiado('deuda', monto ? Number(monto) : undefined)
              }
            }}
            placeholder="Opcional"
            className="flex-1 px-2 py-1 text-xs border border-red-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-400 bg-white"
          />
        </div>
      )}

      {/* Footer: estado + botones */}
      <div className="flex items-center justify-between gap-2">

        {/* Selector de estado — dropdown */}
        <div className="relative">
          <button
            onClick={() => setAbierto((v) => !v)}
            disabled={actualizando}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors shadow-sm disabled:opacity-50',
              estadoCfg.color,
            )}
          >
            <IconoEstado className="w-3.5 h-3.5" />
            {estadoCfg.label}
            <ChevronDown className={cn('w-3 h-3 transition-transform', abierto && 'rotate-180')} />
          </button>

          {abierto && (
            <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden min-w-[140px]">
              {ESTADOS.map((e) => {
                const Ico = e.icon
                return (
                  <button
                    key={e.value}
                    onClick={() => handleSeleccionar(e.value)}
                    className={cn(
                      'flex items-center gap-2 w-full px-3 py-2 text-xs font-medium hover:bg-gray-50 transition-colors',
                      estadoActual === e.value ? 'bg-gray-50' : '',
                    )}
                  >
                    <Ico className={cn('w-3.5 h-3.5',
                      e.value === 'al_dia' ? 'text-green-500'
                      : e.value === 'deuda' ? 'text-red-500'
                      : 'text-gray-400',
                    )} />
                    {e.label}
                    {estadoActual === e.value && (
                      <span className="ml-auto text-brand-600">✓</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {ultimaConsulta && (
            <span className="text-xs text-gray-400">
              {new Date(ultimaConsulta).toLocaleDateString('es-AR')}
            </span>
          )}
          {urlServicio && (
            <a
              href={urlServicio}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-gray-200 hover:bg-brand-50 hover:border-brand-300 hover:text-brand-700 transition-colors shadow-sm"
            >
              <ExternalLink className="w-3 h-3" />
              Ir al sitio
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
