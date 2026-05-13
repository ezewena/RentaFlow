import { useEffect, useState } from 'react'
import {
  ClipboardList, Wrench, AlertTriangle, MessageSquare,
  Plus, Trash2, ChevronUp, Loader2,
} from 'lucide-react'
import { NotaPropiedad, TipoNota } from '@/shared/lib/types'
import { getNotas, agregarNota, eliminarNota } from '../services/propiedadesService'
import { useAuth } from '@/features/auth/AuthContext'
import { cn, formatDate } from '@/shared/lib/utils'
import toast from 'react-hot-toast'

interface Props {
  propiedadId: string
}

const TIPOS: { value: TipoNota; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'general',          label: 'General',          icon: MessageSquare, color: 'bg-gray-100 text-gray-600' },
  { value: 'inventario',       label: 'Inventario',       icon: ClipboardList, color: 'bg-blue-50 text-blue-600' },
  { value: 'dano',             label: 'Daño',             icon: AlertTriangle, color: 'bg-red-50 text-red-600' },
  { value: 'servicio_tecnico', label: 'Servicio técnico', icon: Wrench,        color: 'bg-orange-50 text-orange-600' },
]

function tipoConfig(tipo: TipoNota) {
  return TIPOS.find((t) => t.value === tipo) ?? TIPOS[0]
}

export function NotasPropiedad({ propiedadId }: Props) {
  const { user } = useAuth()
  const [notas, setNotas] = useState<NotaPropiedad[]>([])
  const [cargando, setCargando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState<string | null>(null)

  // Form state
  const [tipo, setTipo] = useState<TipoNota>('general')
  const [texto, setTexto] = useState('')
  const [profesional, setProfesional] = useState('')

  useEffect(() => {
    getNotas(propiedadId)
      .then(setNotas)
      .finally(() => setCargando(false))
  }, [propiedadId])

  const handleAgregar = async () => {
    if (!texto.trim()) { toast.error('Escribí una descripción'); return }
    if (!user) return
    setGuardando(true)
    try {
      const nueva = await agregarNota(propiedadId, user.uid, {
        tipo,
        texto: texto.trim(),
        profesional: profesional.trim() || undefined,
      })
      setNotas((prev) => [nueva, ...prev])
      setTexto('')
      setProfesional('')
      setTipo('general')
      setMostrarForm(false)
      toast.success('Nota agregada')
    } catch {
      toast.error('Error al guardar la nota')
    } finally {
      setGuardando(false)
    }
  }

  const handleEliminar = async (id: string) => {
    setEliminando(id)
    try {
      await eliminarNota(propiedadId, id)
      setNotas((prev) => prev.filter((n) => n.id !== id))
      toast.success('Nota eliminada')
    } catch {
      toast.error('Error al eliminar la nota')
    } finally {
      setEliminando(null)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-brand-600" />
          Notas e historial
        </h2>
        <button
          onClick={() => setMostrarForm((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-brand-600 hover:bg-brand-700 text-white transition-colors"
        >
          {mostrarForm ? <ChevronUp className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {mostrarForm ? 'Cancelar' : 'Agregar nota'}
        </button>
      </div>

      {/* Formulario nueva nota */}
      {mostrarForm && (
        <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
          {/* Selector de tipo */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TIPOS.map((t) => {
              const Icon = t.icon
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTipo(t.value)}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-xs font-medium transition-colors',
                    tipo === t.value
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-gray-200 text-gray-500 hover:bg-white',
                  )}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  {t.label}
                </button>
              )
            })}
          </div>

          {/* Campo profesional (solo servicio técnico) */}
          {tipo === 'servicio_tecnico' && (
            <input
              type="text"
              value={profesional}
              onChange={(e) => setProfesional(e.target.value)}
              placeholder="Nombre del profesional (ej: Juan García — Plomero)"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            />
          )}

          {/* Descripción */}
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={3}
            placeholder={
              tipo === 'inventario'
                ? 'Ej: 1 heladera Whirlpool, 1 lavarropas LG, 2 sillones…'
                : tipo === 'dano'
                  ? 'Ej: Gotera en el baño principal, pared del dormitorio con humedad…'
                  : tipo === 'servicio_tecnico'
                    ? 'Ej: Destape de cañería cocina, cambio de llave de paso…'
                    : 'Escribí la nota aquí…'
            }
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white resize-none"
          />

          <button
            onClick={handleAgregar}
            disabled={guardando || !texto.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {guardando ? 'Guardando…' : 'Guardar nota'}
          </button>
        </div>
      )}

      {/* Lista de notas */}
      {cargando ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      ) : notas.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Sin notas todavía.</p>
          <p className="text-xs mt-0.5">Podés registrar inventario, daños o visitas de técnicos.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notas.map((nota) => {
            const cfg = tipoConfig(nota.tipo)
            const Icon = cfg.icon
            return (
              <div
                key={nota.id}
                className="flex gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors group"
              >
                <div className={cn('p-1.5 rounded-lg h-fit flex-shrink-0', cfg.color)}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', cfg.color)}>
                      {cfg.label}
                    </span>
                    <span className="text-xs text-gray-400">
                      {nota.creadoEn ? formatDate(nota.creadoEn.split('T')[0]) : ''}
                    </span>
                    {nota.profesional && (
                      <span className="text-xs text-orange-600 font-medium">
                        {nota.profesional}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{nota.texto}</p>
                </div>
                <button
                  onClick={() => handleEliminar(nota.id)}
                  disabled={eliminando === nota.id}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0"
                >
                  {eliminando === nota.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Trash2 className="w-3.5 h-3.5" />
                  }
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
