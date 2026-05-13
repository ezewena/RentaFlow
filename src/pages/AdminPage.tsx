import { useEffect, useState } from 'react'
import {
  collection, getDocs, doc, updateDoc, Timestamp,
} from 'firebase/firestore'
import { db } from '@/shared/lib/firebase'
import { UserDoc, UserStatus } from '@/shared/lib/types'
import { useAuth } from '@/features/auth/AuthContext'
import { CheckCircle2, XCircle, Clock, Users, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import toast from 'react-hot-toast'

const STATUS_CFG: Record<UserStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending:  { label: 'Pendiente', color: 'bg-amber-50 text-amber-700 border-amber-200',  icon: Clock         },
  active:   { label: 'Activo',    color: 'bg-green-50 text-green-700 border-green-200',  icon: CheckCircle2  },
  rejected: { label: 'Rechazado', color: 'bg-red-50   text-red-700   border-red-200',    icon: XCircle       },
}

export function AdminPage() {
  const { user } = useAuth()
  const [usuarios, setUsuarios] = useState<UserDoc[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  const fetchUsuarios = async () => {
    setLoading(true)
    setError(null)
    try {
      // Sin orderBy para evitar exclusiones por campo faltante — ordenamos client-side
      const snap = await getDocs(collection(db, 'usuarios'))
      const lista: UserDoc[] = snap.docs
        .map((d) => {
          const data = d.data()
          return {
            uid:      d.id,
            email:    data.email   ?? '',
            nombre:   data.nombre  ?? '',
            status:   (['pending','active','rejected'].includes(data.status)
              ? data.status
              : 'pending') as UserStatus,
            creadoEn: data.creadoEn instanceof Timestamp
              ? data.creadoEn.toDate().toISOString()
              : String(data.creadoEn ?? ''),
          }
        })
        .filter((u) => u.uid !== user?.uid)
        // Pendientes primero, luego más recientes arriba
        .sort((a, b) => {
          if (a.status === 'pending' && b.status !== 'pending') return -1
          if (a.status !== 'pending' && b.status === 'pending') return 1
          return b.creadoEn.localeCompare(a.creadoEn)
        })
      setUsuarios(lista)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
      toast.error('Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsuarios() }, [user?.uid])

  const cambiarEstado = async (uid: string, nuevoStatus: UserStatus) => {
    setUpdating(uid)
    try {
      await updateDoc(doc(db, 'usuarios', uid), { status: nuevoStatus })
      setUsuarios((prev) =>
        prev.map((u) => u.uid === uid ? { ...u, status: nuevoStatus } : u),
      )
      toast.success(
        nuevoStatus === 'active' ? 'Usuario aprobado' : 'Usuario rechazado',
      )
    } catch {
      toast.error('Error al actualizar el usuario')
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-50 rounded-xl">
            <ShieldCheck className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Panel de administración</h1>
            <p className="text-sm text-gray-500">Gestioná los accesos al portal</p>
          </div>
        </div>
        <button
          onClick={fetchUsuarios}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          Actualizar
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">Error al cargar usuarios</p>
            <p className="text-xs mt-0.5 text-red-500">{error}</p>
          </div>
          <button onClick={fetchUsuarios} className="flex items-center gap-1 text-xs font-medium hover:underline">
            <RefreshCw className="w-3.5 h-3.5" /> Reintentar
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pendientes', count: usuarios.filter((u) => u.status === 'pending').length,  color: 'text-amber-600 bg-amber-50' },
          { label: 'Activos',    count: usuarios.filter((u) => u.status === 'active').length,   color: 'text-green-600 bg-green-50' },
          { label: 'Rechazados', count: usuarios.filter((u) => u.status === 'rejected').length, color: 'text-red-600   bg-red-50'   },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className={cn('text-2xl font-bold', s.color.split(' ')[0])}>{s.count}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
        </div>
      ) : usuarios.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Todavía no hay solicitudes de acceso.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {usuarios.map((u) => (
            <UsuarioRow
              key={u.uid}
              usuario={u}
              updating={updating === u.uid}
              onCambiar={cambiarEstado}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function UsuarioRow({
  usuario,
  updating,
  onCambiar,
}: {
  usuario: UserDoc
  updating: boolean
  onCambiar: (uid: string, status: UserStatus) => void
}) {
  const cfg    = STATUS_CFG[usuario.status] ?? STATUS_CFG['pending']
  const Icon   = cfg.icon
  const fecha  = usuario.creadoEn
    ? new Date(usuario.creadoEn).toLocaleDateString('es-AR')
    : '—'

  return (
    <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {usuario.nombre || '(sin nombre)'}
        </p>
        <p className="text-xs text-gray-400 truncate">{usuario.email}</p>
        <p className="text-xs text-gray-300 mt-0.5">Solicitó el {fecha}</p>
      </div>

      <span className={cn('flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-medium flex-shrink-0', cfg.color)}>
        <Icon className="w-3 h-3" />
        {cfg.label}
      </span>

      <div className="flex items-center gap-2 flex-shrink-0">
        {usuario.status !== 'active' && (
          <button
            onClick={() => onCambiar(usuario.uid, 'active')}
            disabled={updating}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Aprobar
          </button>
        )}
        {usuario.status !== 'rejected' && (
          <button
            onClick={() => onCambiar(usuario.uid, 'rejected')}
            disabled={updating}
            className="flex items-center gap-1 px-3 py-1.5 border border-red-200 hover:bg-red-50 disabled:opacity-50 text-red-600 text-xs font-medium rounded-lg transition-colors"
          >
            <XCircle className="w-3.5 h-3.5" />
            Rechazar
          </button>
        )}
      </div>
    </div>
  )
}
