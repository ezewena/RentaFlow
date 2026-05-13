import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import {
  Building2,
  FileText,
  Bell,
  DollarSign,
  Zap,
  CheckCircle2,
  ArrowRight,
  Shield,
  BarChart3,
  StickyNote,
} from 'lucide-react'

const FEATURES = [
  {
    icon: Building2,
    color: 'bg-brand-50 text-brand-600',
    title: 'Gestión de propiedades',
    desc: 'Registrá todas tus propiedades con datos del inquilino, contrato, servicios e historial en un solo lugar.',
  },
  {
    icon: DollarSign,
    color: 'bg-green-50 text-green-600',
    title: 'Control de pagos y mora',
    desc: 'Marcá los alquileres como cobrados y calculá la mora automáticamente según el porcentaje o monto fijo que acordaste.',
  },
  {
    icon: Bell,
    color: 'bg-amber-50 text-amber-600',
    title: 'Alertas automáticas',
    desc: 'Recibí notificaciones por email y push antes de que venzan contratos, llegue la fecha de cobro o haya servicios impagos.',
  },
  {
    icon: FileText,
    color: 'bg-purple-50 text-purple-600',
    title: 'Actualización de alquiler',
    desc: 'Configurá el índice de actualización (ICL, IPC, CVS o porcentaje manual) y el sistema te avisa cuándo corresponde ajustar.',
  },
  {
    icon: Zap,
    color: 'bg-yellow-50 text-yellow-600',
    title: 'Seguimiento de servicios',
    desc: 'Registrá el estado de luz, gas, agua e impuestos de cada propiedad y notificá al inquilino por WhatsApp o email con un clic.',
  },
  {
    icon: StickyNote,
    color: 'bg-rose-50 text-rose-600',
    title: 'Notas e historial',
    desc: 'Guardá notas de inventario, daños y servicios técnicos por propiedad para tener todo el historial documentado.',
  },
  {
    icon: BarChart3,
    color: 'bg-sky-50 text-sky-600',
    title: 'Dashboard de un vistazo',
    desc: 'Visualizá de inmediato qué propiedades tienen deuda, contratos por vencer o servicios pendientes.',
  },
  {
    icon: Shield,
    color: 'bg-emerald-50 text-emerald-600',
    title: 'Datos seguros en la nube',
    desc: 'Tu información está protegida con Firebase y solo vos podés acceder a tus propiedades desde cualquier dispositivo.',
  },
]

const INCLUDED = [
  'Propiedades ilimitadas',
  'Inquilinos y contratos',
  'Seguimiento de pagos y mora',
  'Actualización por índice (ICL, IPC, CVS)',
  'Alertas por email y notificaciones push',
  'Seguimiento de servicios (luz, gas, agua, impuestos)',
  'Notificación al inquilino por WhatsApp y email',
  'Notas e historial por propiedad',
  'Soporte para todas las provincias de Argentina',
  'Acceso desde cualquier dispositivo',
]

export function LandingPage() {
  const { user, loading } = useAuth()

  if (!loading && user) return <Navigate to="/dashboard" replace />

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">AlquilaYa</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Iniciar sesión
            </Link>
            <a
              href="#precios"
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Comenzar
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="bg-gradient-to-b from-brand-50 to-white py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <span className="inline-block px-3 py-1 bg-brand-100 text-brand-700 text-xs font-semibold rounded-full uppercase tracking-wide">
            Para agentes inmobiliarios de Argentina
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight">
            Gestioná tus propiedades<br />
            <span className="text-brand-600">sin perder ningún detalle</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            AlquilaYa es el portal diseñado para que los agentes inmobiliarios argentinos
            tengan el control total de sus propiedades en alquiler — contratos, pagos,
            servicios e inquilinos en un solo lugar.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <a
              href="#precios"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
            >
              Quiero suscribirme
              <ArrowRight className="w-4 h-4" />
            </a>
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-colors"
            >
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Todo lo que necesitás en un portal</h2>
            <p className="text-gray-500 mt-2 text-lg">
              Dejá de usar planillas y WhatsApp sueltos — AlquilaYa centraliza todo.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f) => {
              const Icon = f.icon
              return (
                <div
                  key={f.title}
                  className="bg-gray-50 rounded-2xl p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${f.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">{f.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Pain points ── */}
      <section className="py-16 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">¿Te suena familiar?</h2>
          <div className="grid sm:grid-cols-3 gap-4 mt-8 text-left">
            {[
              { emoji: '📋', text: 'Tenés los datos de los inquilinos en papel, planillas y mensajes de WhatsApp mezclados.' },
              { emoji: '📅', text: 'Se te venció un contrato sin darte cuenta y tuviste que correr para renovarlo.' },
              { emoji: '💸', text: 'No sabés rápido si un inquilino pagó este mes o tiene días de mora acumulados.' },
            ].map((item) => (
              <div key={item.text} className="bg-white rounded-xl p-4 border border-gray-200 flex gap-3">
                <span className="text-2xl flex-shrink-0">{item.emoji}</span>
                <p className="text-sm text-gray-600">{item.text}</p>
              </div>
            ))}
          </div>
          <p className="text-brand-700 font-semibold text-lg pt-4">
            AlquilaYa resuelve todo eso.
          </p>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="precios" className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900">Precio simple, sin sorpresas</h2>
            <p className="text-gray-500 mt-2">Un solo plan con todo incluido.</p>
          </div>

          <div className="bg-white border-2 border-brand-500 rounded-3xl shadow-xl overflow-hidden">
            <div className="bg-brand-600 px-8 py-6 text-center">
              <p className="text-brand-100 text-sm font-medium uppercase tracking-wide mb-1">Suscripción mensual</p>
              <div className="flex items-end justify-center gap-1">
                <span className="text-white text-2xl font-bold mt-1">$</span>
                <span className="text-white text-5xl font-extrabold leading-none">30.000</span>
                <span className="text-brand-200 text-lg mb-1">ARS/mes</span>
              </div>
            </div>

            <div className="px-8 py-6 space-y-3">
              {INCLUDED.map((item) => (
                <div key={item} className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{item}</span>
                </div>
              ))}
            </div>

            <div className="px-8 pb-8 flex flex-col gap-3">
              <Link
                to="/register"
                className="flex items-center justify-center gap-2 w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
                Solicitar acceso
              </Link>
              <p className="text-center text-xs text-gray-400">
                Tu cuenta será revisada y activada por un administrador.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="mt-auto border-t border-gray-100 py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-brand-600 rounded-md flex items-center justify-center">
              <Building2 className="w-3 h-3 text-white" />
            </div>
            <span className="font-bold text-gray-700 text-sm">AlquilaYa</span>
          </div>
          <p className="text-xs text-gray-400 text-center">
            © {new Date().getFullYear()} AlquilaYa — Gestión inmobiliaria para Argentina
          </p>
          <Link to="/login" className="text-xs text-brand-600 hover:underline">
            Acceder al portal
          </Link>
        </div>
      </footer>

    </div>
  )
}
