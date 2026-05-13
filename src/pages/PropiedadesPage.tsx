import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Building2, Filter, AlertCircle } from 'lucide-react'
import { usePropiedades } from '@/features/propiedades/hooks/usePropiedades'
import { EstadoBadge, ContratoEstadoBadge } from '@/shared/components/Badge'
import { daysUntil, formatCurrency, calcularDeudaActual } from '@/shared/lib/utils'
import { Propiedad } from '@/shared/lib/types'

type FiltroServicio = 'todos' | 'al_dia' | 'deuda'
type FiltroContrato = 'todos' | 'vigente' | 'por_vencer' | 'vencido'

function getEstadoServicioGeneral(p: Propiedad): 'al_dia' | 'deuda' | 'sin_consultar' {
  const estados = Object.values(p.servicios).map((s) => s?.ultimoEstado)
  if (estados.some((e) => e === 'deuda')) return 'deuda'
  if (estados.some((e) => e === 'al_dia')) return 'al_dia'
  return 'sin_consultar'
}

export function PropiedadesPage() {
  const { propiedades, loading } = usePropiedades()
  const [busqueda, setBusqueda] = useState('')
  const [filtroServicio, setFiltroServicio] = useState<FiltroServicio>('todos')
  const [filtroContrato, setFiltroContrato] = useState<FiltroContrato>('todos')

  const filtradas = useMemo(() => {
    return propiedades.filter((p) => {
      const matchBusqueda =
        busqueda === '' ||
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.inquilino.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.direccion.toLowerCase().includes(busqueda.toLowerCase())

      const estadoServicio = getEstadoServicioGeneral(p)
      const matchServicio =
        filtroServicio === 'todos' ||
        (filtroServicio === 'al_dia' && estadoServicio === 'al_dia') ||
        (filtroServicio === 'deuda' && estadoServicio === 'deuda')

      const dias = daysUntil(p.contrato.fechaFin)
      const matchContrato =
        filtroContrato === 'todos' ||
        (filtroContrato === 'vigente' && dias > 60) ||
        (filtroContrato === 'por_vencer' && dias >= 0 && dias <= 60) ||
        (filtroContrato === 'vencido' && dias < 0)

      return matchBusqueda && matchServicio && matchContrato
    })
  }, [propiedades, busqueda, filtroServicio, filtroContrato])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Propiedades</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {propiedades.length} propiedad{propiedades.length !== 1 ? 'es' : ''} registradas
          </p>
        </div>
        <Link
          to="/propiedades/nueva"
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, inquilino o dirección…"
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <select
            value={filtroServicio}
            onChange={(e) => setFiltroServicio(e.target.value as FiltroServicio)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            <option value="todos">Todos los servicios</option>
            <option value="al_dia">Servicios al día</option>
            <option value="deuda">Con deuda</option>
          </select>

          <select
            value={filtroContrato}
            onChange={(e) => setFiltroContrato(e.target.value as FiltroContrato)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            <option value="todos">Todos los contratos</option>
            <option value="vigente">Vigente</option>
            <option value="por_vencer">Por vencer (60d)</option>
            <option value="vencido">Vencido</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filtradas.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              {propiedades.length === 0
                ? 'No tenés propiedades cargadas'
                : 'No hay resultados para los filtros aplicados'}
            </p>
            {propiedades.length === 0 && (
              <Link
                to="/propiedades/nueva"
                className="inline-flex items-center gap-1.5 mt-3 text-sm text-brand-600 hover:underline"
              >
                <Plus className="w-4 h-4" />
                Agregar primera propiedad
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Propiedad
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Inquilino
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Alquiler
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Contrato
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Servicios
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtradas.map((p) => {
                  const dias = daysUntil(p.contrato.fechaFin)
                  const estadoServicio = getEstadoServicioGeneral(p)
                  const deudaAlquiler = calcularDeudaActual(p)
                  return (
                    <tr
                      key={p.id}
                      className={
                        deudaAlquiler
                          ? 'bg-red-50 hover:bg-red-100 transition-colors cursor-pointer'
                          : 'hover:bg-gray-50 transition-colors cursor-pointer'
                      }
                      onClick={() => (window.location.href = `/propiedades/${p.id}`)}
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {deudaAlquiler && (
                            <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                          )}
                          <p className="font-medium text-gray-900 truncate max-w-xs">
                            {p.nombre}
                          </p>
                        </div>
                        <p className="text-xs text-gray-400 truncate max-w-xs mt-0.5">
                          {p.direccion}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-gray-700">{p.inquilino.nombre}</p>
                        <p className="text-xs text-gray-400">{p.inquilino.email}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        {deudaAlquiler ? (
                          <div>
                            <p className="font-bold text-red-600">
                              {formatCurrency(deudaAlquiler.totalDeuda, deudaAlquiler.moneda)}
                            </p>
                            <p className="text-xs text-red-400">
                              {deudaAlquiler.diasMora}d mora · Vto. día {p.contrato.diaVencimiento}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="font-semibold text-gray-900">
                              {formatCurrency(p.contrato.montoAlquiler, p.contrato.moneda)}
                            </p>
                            <p className="text-xs text-gray-400">
                              Vto. día {p.contrato.diaVencimiento}
                            </p>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <ContratoEstadoBadge diasRestantes={dias} />
                      </td>
                      <td className="px-4 py-3.5">
                        <EstadoBadge estado={estadoServicio} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
