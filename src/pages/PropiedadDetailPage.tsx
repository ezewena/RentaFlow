import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Edit2,
  Trash2,
  User,
  FileText,
  MapPin,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  MessageCircle,
  Bell,
} from 'lucide-react'
import { getPropiedad, deletePropiedad, updateServicioEstado } from '@/features/propiedades/services/propiedadesService'
import { ServicioCard } from '@/features/servicios/components/ServicioCard'
import { PagosMensuales } from '@/features/propiedades/components/PagosMensuales'
import { NotasPropiedad } from '@/features/propiedades/components/NotasPropiedad'
import { ContratoEstadoBadge } from '@/shared/components/Badge'
import { formatCurrency, formatDate, daysUntil, calcularDeudaActual } from '@/shared/lib/utils'
import { Propiedad, EstadoServicio } from '@/shared/lib/types'
import { SERVICIOS_POR_PROVINCIA, getServicioConfig, getNumeroCliente, getMendozaImpuestoConfig } from '@/shared/lib/provinciaServicios'
import { usePropiedadesStore } from '@/app/store/propiedadesStore'
import toast from 'react-hot-toast'
import { AlertCircle } from 'lucide-react'

export function PropiedadDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [propiedad, setPropiedad] = useState<Propiedad | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [actualizando, setActualizando] = useState<string | null>(null)
  const [montoAjustado, setMontoAjustado] = useState<number | undefined>(undefined)
  const { removePropiedad } = usePropiedadesStore()

  useEffect(() => {
    if (!id) return
    getPropiedad(id)
      .then(setPropiedad)
      .finally(() => setLoading(false))
  }, [id])

  const handleEstadoCambiado = async (
    servicio: string,
    nuevoEstado: EstadoServicio,
    monto?: number,
  ) => {
    if (!id) return
    setActualizando(servicio)
    try {
      const ahora = new Date().toISOString()
      await updateServicioEstado(id, servicio, {
        ultimoEstado: nuevoEstado,
        ultimaConsulta: ahora,
        ...(monto !== undefined && { monto }),
      })
      setPropiedad((prev) =>
        prev
          ? {
              ...prev,
              servicios: {
                ...prev.servicios,
                [servicio]: {
                  ...prev.servicios[servicio],
                  ultimoEstado: nuevoEstado,
                  ultimaConsulta: ahora,
                  ...(monto !== undefined && { monto }),
                },
              },
            }
          : prev,
      )
      const cfg = getServicioConfig(servicio)
      toast.success(`Estado de ${cfg?.label ?? servicio} actualizado`)
    } catch {
      toast.error('Error al actualizar el servicio')
    } finally {
      setActualizando(null)
    }
  }

  const handleDelete = async () => {
    if (!id) return
    await deletePropiedad(id)
    removePropiedad(id)
    toast.success('Propiedad eliminada')
    navigate('/propiedades')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    )
  }

  if (!propiedad) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Propiedad no encontrada.</p>
        <Link to="/propiedades" className="text-brand-600 hover:underline text-sm mt-2 inline-block">
          Volver a propiedades
        </Link>
      </div>
    )
  }

  const diasRestantes = daysUntil(propiedad.contrato.fechaFin)
  const deuda = calcularDeudaActual(propiedad, montoAjustado)

  // Servicios guardados en el documento que tienen número de cliente
  const serviciosGuardados = Object.entries(propiedad.servicios).filter(
    ([, s]) => getNumeroCliente(s as unknown as Record<string, unknown>),
  )

  // Configs de provincia para los servicios guardados (fallback a lookup global)
  const provinciaConfigs = SERVICIOS_POR_PROVINCIA[propiedad.provincia] ?? []
  const serviciosConConfig = serviciosGuardados.map(([key, estado]) => {
    // Para Mendoza, si la clave es de impuesto municipal usamos el departamento guardado
    const cfg = key.startsWith('imp_mza_')
      ? getMendozaImpuestoConfig(key)
      : provinciaConfigs.find((c) => c.key === key) ?? getServicioConfig(key) ?? {
          key,
          label: key.toUpperCase(),
          campo: 'Nro. de Cliente',
          tipo: 'electricidad' as const,
        }
    return { key, estado: estado as unknown as Record<string, unknown>, cfg }
  })

  // Servicios marcados con deuda para la sección de notificaciones
  const serviciosConDeuda = serviciosConConfig.filter(
    ({ estado }) => (estado.ultimoEstado as string) === 'deuda',
  )

  // Teléfono en formato internacional (Argentina: +54 9 XXX)
  const telefonoRaw = propiedad.inquilino.telefono.replace(/\D/g, '')
  const telefonoWA =
    telefonoRaw.startsWith('54') ? telefonoRaw : `549${telefonoRaw.replace(/^0/, '')}`

  const serviciosDeudaLabels = serviciosConDeuda.map((s) => `• ${s.cfg.label}`).join('\n')
  const mensajeWA = encodeURIComponent(
    `Hola ${propiedad.inquilino.nombre}, te escribimos desde la administración de tu propiedad en ${propiedad.direccion}.\n\nTe recordamos que tenés los siguientes servicios con saldo pendiente:\n${serviciosDeudaLabels}\n\nPor favor, regularizá el pago a la brevedad. Ante cualquier consulta, estamos a disposición.\n¡Gracias!`,
  )
  const whatsappUrl = `https://wa.me/${telefonoWA}?text=${mensajeWA}`

  const asuntoEmail = encodeURIComponent(`Recordatorio de servicios pendientes — ${propiedad.direccion}`)
  const cuerpoEmail = encodeURIComponent(
    `Hola ${propiedad.inquilino.nombre},\n\nTe recordamos que los siguientes servicios de la propiedad ubicada en ${propiedad.direccion} tienen saldo pendiente:\n\n${serviciosDeudaLabels}\n\nPor favor, regularizá el pago a la brevedad.\n\nAnte cualquier consulta, no dudes en contactarnos.\n\n¡Gracias!`,
  )
  const mailtoUrl = `mailto:${propiedad.inquilino.email}?subject=${asuntoEmail}&body=${cuerpoEmail}`

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link
            to="/propiedades"
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 mt-0.5"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{propiedad.nombre}</h1>
            <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
              <MapPin className="w-3.5 h-3.5" />
              {propiedad.direccion}
            </div>
            {propiedad.descripcion && (
              <p className="text-sm text-gray-500 mt-1.5 max-w-lg">{propiedad.descripcion}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            to={`/propiedades/${id}/editar`}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Editar
          </Link>
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Eliminar
          </button>
        </div>
      </div>

      {/* Banner deuda activa */}
      {deuda && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-700">
              Alquiler impago — {deuda.diasMora} día{deuda.diasMora !== 1 ? 's' : ''} de mora
            </p>
            <p className="text-xs text-red-600">
              Base {formatCurrency(deuda.montoBase, deuda.moneda)}
              {deuda.moraTotal > 0 && (
                <> + mora {formatCurrency(deuda.moraTotal, deuda.moneda)}</>
              )}
            </p>
          </div>
          <p className="text-lg font-bold text-red-700 flex-shrink-0">
            {formatCurrency(deuda.totalDeuda, deuda.moneda)}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Inquilino */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-brand-600" />
              Inquilino
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Nombre</p>
                <p className="text-sm font-medium text-gray-900">{propiedad.inquilino.nombre}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">DNI</p>
                <p className="text-sm font-medium text-gray-900">{propiedad.inquilino.dni}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Email
                </p>
                <p className="text-sm font-medium text-gray-900">{propiedad.inquilino.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Teléfono
                </p>
                <p className="text-sm font-medium text-gray-900">{propiedad.inquilino.telefono}</p>
              </div>
            </div>
          </div>

          {/* Pagos mensuales */}
          <PagosMensuales
            propiedad={propiedad}
            onPagoRegistrado={setPropiedad}
            onMontoActualCambiado={setMontoAjustado}
          />

          {/* Contrato */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-600" />
                Contrato
              </h2>
              <ContratoEstadoBadge diasRestantes={diasRestantes} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Inicio
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(propiedad.contrato.fechaInicio)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Vencimiento
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(propiedad.contrato.fechaFin)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1">
                  <DollarSign className="w-3 h-3" /> Monto mensual
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatCurrency(propiedad.contrato.montoAlquiler, propiedad.contrato.moneda)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Día de vencimiento</p>
                <p className="text-sm font-medium text-gray-900">
                  Día {propiedad.contrato.diaVencimiento} de cada mes
                </p>
              </div>
            </div>
          </div>
          {/* Notas e historial */}
          <NotasPropiedad propiedadId={propiedad.id} />
        </div>

        {/* Right column — Servicios */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Servicios</h2>
          </div>

          {serviciosConConfig.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-200 p-6 text-center">
              <p className="text-sm text-gray-400">No hay servicios configurados.</p>
              <Link
                to={`/propiedades/${id}/editar`}
                className="text-xs text-brand-600 hover:underline mt-1 inline-block"
              >
                Configurar servicios
              </Link>
            </div>
          ) : (
            serviciosConConfig.map(({ key, estado, cfg }) => (
              <ServicioCard
                key={key}
                config={cfg}
                estado={estado}
                onEstadoCambiado={(nuevoEstado, monto) =>
                  handleEstadoCambiado(key, nuevoEstado, monto)
                }
                actualizando={actualizando === key}
              />
            ))
          )}

          {/* Notificar al inquilino — aparece cuando hay al menos un servicio con deuda */}
          {serviciosConDeuda.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <p className="text-sm font-semibold text-amber-800">Notificar al inquilino</p>
              </div>
              <p className="text-xs text-amber-700">
                {serviciosConDeuda.map((s) => s.cfg.label).join(', ')} — recordatorio de pago pendiente
              </p>
              <div className="flex flex-col gap-2">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-medium transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Enviar por WhatsApp
                </a>
                <a
                  href={mailtoUrl}
                  className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white border border-amber-300 hover:bg-amber-100 text-amber-800 text-xs font-medium transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Enviar por Email
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirm dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-gray-900 mb-2">Eliminar propiedad</h3>
            <p className="text-sm text-gray-500 mb-5">
              ¿Estás seguro? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2 px-4 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
