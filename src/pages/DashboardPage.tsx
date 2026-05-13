import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Building2, AlertTriangle, Clock, Plus, ArrowRight } from 'lucide-react'
import { usePropiedades } from '@/features/propiedades/hooks/usePropiedades'
import { StatsCard } from '@/shared/components/StatsCard'
import { EstadoBadge, ContratoEstadoBadge } from '@/shared/components/Badge'
import { daysUntil, formatCurrency } from '@/shared/lib/utils'
import { Propiedad } from '@/shared/lib/types'

function tieneDeuda(p: Propiedad): boolean {
  return Object.values(p.servicios).some((s) => s?.ultimoEstado === 'deuda')
}

export function DashboardPage() {
  const { propiedades, loading } = usePropiedades()

  const stats = useMemo(() => {
    const total = propiedades.length
    const conDeuda = propiedades.filter(tieneDeuda).length
    const proximosVencer = propiedades.filter((p) => {
      const dias = daysUntil(p.contrato.fechaFin)
      return dias >= 0 && dias <= 60
    }).length
    return { total, conDeuda, proximosVencer }
  }, [propiedades])

  const recientes = useMemo(
    () =>
      [...propiedades]
        .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn))
        .slice(0, 5),
    [propiedades],
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Resumen de tus propiedades</p>
        </div>
        <Link
          to="/propiedades/nueva"
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva propiedad
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          title="Total propiedades"
          value={stats.total}
          icon={Building2}
          iconClassName="bg-brand-50 text-brand-600"
        />
        <StatsCard
          title="Con deuda en servicios"
          value={stats.conDeuda}
          icon={AlertTriangle}
          iconClassName="bg-red-50 text-red-500"
        />
        <StatsCard
          title="Contratos por vencer"
          value={stats.proximosVencer}
          subtitle="Próximos 60 días"
          icon={Clock}
          iconClassName="bg-yellow-50 text-yellow-500"
        />
      </div>

      {/* Recent properties */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Propiedades recientes</h2>
          <Link
            to="/propiedades"
            className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700"
          >
            Ver todas
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recientes.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No tenés propiedades cargadas</p>
            <Link
              to="/propiedades/nueva"
              className="inline-flex items-center gap-1.5 mt-3 text-sm text-brand-600 hover:underline"
            >
              <Plus className="w-4 h-4" />
              Agregar primera propiedad
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recientes.map((p) => {
              const diasRestantes = daysUntil(p.contrato.fechaFin)
              const deuda = tieneDeuda(p)
              return (
                <Link
                  key={p.id}
                  to={`/propiedades/${p.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {p.nombre}
                    </p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {p.inquilino.nombre} · Vto. día {p.contrato.diaVencimiento}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    {deuda && <EstadoBadge estado="deuda" />}
                    <ContratoEstadoBadge diasRestantes={diasRestantes} />
                    <span className="text-sm font-semibold text-gray-700">
                      {formatCurrency(p.contrato.montoAlquiler)}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Deuda alert */}
      {stats.conDeuda > 0 && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">
              {stats.conDeuda} propiedad{stats.conDeuda > 1 ? 'es' : ''} con deuda en servicios
            </p>
            <p className="text-xs text-red-500 mt-0.5">
              Revisá el detalle de cada propiedad para ver qué servicio está con deuda.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
