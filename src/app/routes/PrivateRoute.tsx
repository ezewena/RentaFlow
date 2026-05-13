import { useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { Building2, Clock, XCircle, Copy, Check } from 'lucide-react'

function CopyUid({ uid }: { uid: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(uid)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200 text-left">
      <p className="text-xs text-gray-400 mb-1 font-medium">Tu UID (para el administrador):</p>
      <div className="flex items-center gap-2">
        <code className="text-xs text-gray-700 break-all flex-1">{uid}</code>
        <button
          onClick={handleCopy}
          className="flex-shrink-0 p-1.5 rounded-md hover:bg-gray-200 transition-colors"
          title="Copiar UID"
        >
          {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-500" />}
        </button>
      </div>
    </div>
  )
}

export function PrivateRoute() {
  const { user, userStatus, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600" />
      </div>
    )
  }

  if (!user) return <Navigate to="/" replace />

  if (userStatus === 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mx-auto">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Cuenta pendiente de aprobación</h1>
          <p className="text-gray-500 text-sm">
            Tu solicitud fue recibida. Un administrador va a revisar tu cuenta
            y te habilitará el acceso en breve.
          </p>
          <p className="text-xs text-gray-400">
            Una vez aprobado, ingresá nuevamente con tu email y contraseña.
          </p>
          {user && <CopyUid uid={user.uid} />}
          <button
            onClick={() => { import('@/shared/lib/firebase').then(({ auth }) => auth.signOut()) }}
            className="text-sm text-brand-600 hover:underline mt-2 block"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    )
  }

  if (userStatus === 'rejected') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mx-auto">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Acceso denegado</h1>
          <p className="text-gray-500 text-sm">
            Tu solicitud de acceso no fue aprobada. Si creés que es un error,
            contactanos por WhatsApp.
          </p>
          <button
            onClick={() => { import('@/shared/lib/firebase').then(({ auth }) => auth.signOut()) }}
            className="text-sm text-brand-600 hover:underline"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    )
  }

  return userStatus === 'active'
    ? <Outlet />
    : (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <Building2 className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="text-gray-400 text-sm">Verificando acceso…</p>
        </div>
      </div>
    )
}
