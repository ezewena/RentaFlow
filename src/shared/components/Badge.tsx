import { cn } from '@/shared/lib/utils'
import { EstadoServicio } from '@/shared/lib/types'

const estadoConfig: Record<
  EstadoServicio,
  { label: string; className: string }
> = {
  al_dia: { label: 'Al día', className: 'bg-green-100 text-green-700' },
  deuda: { label: 'Con deuda', className: 'bg-red-100 text-red-700' },
  error: { label: 'Error', className: 'bg-yellow-100 text-yellow-700' },
  sin_consultar: { label: 'Sin consultar', className: 'bg-gray-100 text-gray-500' },
}

export function EstadoBadge({ estado }: { estado: EstadoServicio }) {
  const cfg = estadoConfig[estado] ?? estadoConfig.sin_consultar
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        cfg.className,
      )}
    >
      {cfg.label}
    </span>
  )
}

export function ContratoEstadoBadge({ diasRestantes }: { diasRestantes: number }) {
  if (diasRestantes < 0) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
        Vencido
      </span>
    )
  }
  if (diasRestantes <= 60) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
        Vence en {diasRestantes}d
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
      Vigente
    </span>
  )
}
