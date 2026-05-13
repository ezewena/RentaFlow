import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { usePushNotifications } from '@/shared/hooks/usePushNotifications'
import { cn } from '@/shared/lib/utils'
import {
  LayoutDashboard,
  Building2,
  LogOut,
  Menu,
  X,
  Bell,
  BellOff,
  ShieldCheck,
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { to: '/dashboard',   label: 'Dashboard',   Icon: LayoutDashboard },
  { to: '/propiedades', label: 'Propiedades',  Icon: Building2       },
]

export function Layout() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { permiso, solicitarPermiso } = usePushNotifications()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-gray-900">RentaFlow</span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                )
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}

          {isAdmin && (
            <NavLink
              to="/admin"
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                )
              }
            >
              <ShieldCheck className="w-4 h-4" />
              Administración
            </NavLink>
          )}
        </nav>

        <div className="px-4 py-4 border-t border-gray-100 space-y-1">
          <div className="px-3 py-2 text-xs text-gray-500 truncate">
            {user?.email}
          </div>

          {/* Botón activar/desactivar notificaciones */}
          <button
            onClick={permiso !== 'granted' ? solicitarPermiso : undefined}
            disabled={permiso === 'denied'}
            title={
              permiso === 'granted'
                ? 'Notificaciones activas'
                : permiso === 'denied'
                  ? 'Permiso denegado en el navegador'
                  : 'Activar notificaciones de Windows'
            }
            className={cn(
              'flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium transition-colors',
              permiso === 'granted'
                ? 'text-green-600 bg-green-50 cursor-default'
                : permiso === 'denied'
                  ? 'text-gray-400 cursor-not-allowed opacity-60'
                  : 'text-gray-600 hover:bg-brand-50 hover:text-brand-700',
            )}
          >
            {permiso === 'granted' ? (
              <Bell className="w-4 h-4" />
            ) : (
              <BellOff className="w-4 h-4" />
            )}
            {permiso === 'granted'
              ? 'Notificaciones activas'
              : permiso === 'denied'
                ? 'Notificaciones bloqueadas'
                : 'Activar notificaciones'}
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="font-bold text-gray-900">RentaFlow</span>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
