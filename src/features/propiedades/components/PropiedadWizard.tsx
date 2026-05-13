import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { createPropiedad, updatePropiedad } from '../services/propiedadesService'
import { usePropiedadesStore } from '@/app/store/propiedadesStore'
import { Propiedad, PropiedadInput, ServicioEstadoEntry, IndiceActualizacion, Moneda } from '@/shared/lib/types'
import {
  PROVINCIAS_ARGENTINA,
  SERVICIOS_POR_PROVINCIA,
  DEPARTAMENTOS_MENDOZA,
  detectarProvincia,
  getNumeroCliente,
  getMendozaImpuestoConfig,
  TipoServicio,
} from '@/shared/lib/provinciaServicios'
import { cn, mesActual } from '@/shared/lib/utils'
import { Check, ChevronRight, ChevronLeft, Wand2, Zap, Flame, Droplets, Landmark, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

interface WizardProps {
  propiedad?: Propiedad
}

type FormValues = {
  nombre: string
  descripcion: string
  direccion: string
  provincia: string
  departamento: string
  inquilinoNombre: string
  inquilinoDni: string
  inquilinoEmail: string
  inquilinoTelefono: string
  fechaInicio: string
  fechaFin: string
  montoAlquiler: number
  moneda: Moneda
  diaVencimiento: number
  // Actualización
  actualizacionPeriodo: '3' | '4' | '6' | '12'
  actualizacionIndice: IndiceActualizacion
  actualizacionPorcentaje: number
  // Mora
  moraTipo: 'porcentaje' | 'monto_fijo' | 'ninguna'
  moraValor: number
  serviciosNums: Record<string, string>
}

const steps = [
  { label: 'Propiedad', description: 'Datos y ubicación' },
  { label: 'Inquilino', description: 'Inquilino y contrato' },
  { label: 'Servicios', description: 'Números de cliente' },
]

const tipoIcon: Record<TipoServicio, React.ElementType> = {
  electricidad: Zap,
  gas: Flame,
  agua: Droplets,
  impuesto: Landmark,
}

const tipoColor: Record<TipoServicio, string> = {
  electricidad: 'bg-yellow-50 text-yellow-600',
  gas: 'bg-orange-50 text-orange-600',
  agua: 'bg-blue-50 text-blue-600',
  impuesto: 'bg-purple-50 text-purple-600',
}

export function PropiedadWizard({ propiedad }: WizardProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const { upsertPropiedad } = usePropiedadesStore()

  // Build serviciosNums defaults from existing propiedad
  const defaultServiciosNums = propiedad
    ? Object.fromEntries(
        Object.entries(propiedad.servicios).map(([key, s]) => [
          key,
          getNumeroCliente(s as unknown as Record<string, unknown>),
        ]),
      )
    : {}

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: propiedad
      ? {
          nombre: propiedad.nombre,
          direccion: propiedad.direccion,
          provincia: propiedad.provincia ?? '',
          inquilinoNombre: propiedad.inquilino.nombre,
          inquilinoDni: propiedad.inquilino.dni,
          inquilinoEmail: propiedad.inquilino.email,
          inquilinoTelefono: propiedad.inquilino.telefono,
          fechaInicio: propiedad.contrato.fechaInicio,
          fechaFin: propiedad.contrato.fechaFin,
          montoAlquiler: propiedad.contrato.montoAlquiler,
          diaVencimiento: propiedad.contrato.diaVencimiento,
          serviciosNums: defaultServiciosNums,
        }
      : {
          descripcion: '',
          diaVencimiento: 10,
          montoAlquiler: 0,
          moneda: 'ARS' as Moneda,
          actualizacionPeriodo: '3' as const,
          actualizacionIndice: 'ICL' as IndiceActualizacion,
          actualizacionPorcentaje: 0,
          moraTipo: 'ninguna' as const,
          moraValor: 0,
          serviciosNums: {},
        },
  })

  const watchedProvincia = watch('provincia')
  const watchedDireccion = watch('direccion')
  const watchedDepartamento = watch('departamento')
  const esMendoza = watchedProvincia === 'Mendoza'
  const watchedIndice = watch('actualizacionIndice')
  const watchedMoneda = watch('moneda')
  const watchedMoraTipo = watch('moraTipo')
  const watchedFechaInicio = watch('fechaInicio')

  // Advertencia: fecha de inicio en el pasado + índice automático
  const fechaInicioEsPasada = !!watchedFechaInicio
    && watchedFechaInicio.substring(0, 7) < mesActual()
  const indiceEsAutomatico = !!watchedIndice
    && watchedIndice !== 'ninguno'
    && watchedIndice !== 'manual'
  const mostrarAdvertenciaFecha = fechaInicioEsPasada && indiceEsAutomatico
  const serviciosDeProvincia = (() => {
    const base = SERVICIOS_POR_PROVINCIA[watchedProvincia] ?? []
    if (watchedProvincia !== 'Mendoza') return base
    // Reemplazar el impuesto placeholder por el del departamento elegido
    const deptoKey = watchedDepartamento || 'imp_mza_capital'
    return base.map((s) =>
      s.tipo === 'impuesto' ? getMendozaImpuestoConfig(deptoKey) : s,
    )
  })()

  const handleAutoDetect = () => {
    const detected = detectarProvincia(watchedDireccion)
    if (detected) {
      setValue('provincia', detected)
      toast.success(`Provincia detectada: ${detected}`)
    } else {
      toast.error('No se pudo detectar la provincia. Seleccionala manualmente.')
    }
  }

  const stepFields: Record<number, (keyof FormValues)[]> = {
    0: ['nombre', 'direccion', 'provincia'],
    1: [
      'inquilinoNombre', 'inquilinoDni', 'inquilinoEmail', 'inquilinoTelefono',
      'fechaInicio', 'fechaFin', 'montoAlquiler', 'diaVencimiento',
    ],
    2: [],
  }

  const nextStep = async () => {
    const valid = await trigger(stepFields[step])
    if (valid) setStep((s) => s + 1)
  }

  const onSubmit = async (data: FormValues) => {
    if (!user) return
    setSaving(true)
    try {
      const servicios: Record<string, ServicioEstadoEntry> = {}

      for (const svc of serviciosDeProvincia) {
        const num = (data.serviciosNums?.[svc.key] ?? '').trim()
        if (!num) continue

        const entry: ServicioEstadoEntry = {
          ultimoEstado: 'sin_consultar',
          ultimaConsulta: null,
        }

        if (svc.campo === 'NIC') entry.nic = num
        else if (svc.campo === 'NIS') entry.nis = num
        else if (svc.campo === 'Nro. de Cuenta') entry.nroCuenta = num
        else entry.nroCliente = num

        servicios[svc.key] = entry
      }

      // Calcular próxima fecha de actualización
      const proximaFechaActualizacion = (() => {
        if (data.actualizacionIndice === 'ninguno') return undefined
        const inicio = new Date(data.fechaInicio)
        const meses = Number(data.actualizacionPeriodo)
        inicio.setMonth(inicio.getMonth() + meses)
        return inicio.toISOString().split('T')[0]
      })()

      const input: PropiedadInput = {
        nombre: data.nombre,
        ...(data.descripcion?.trim() && { descripcion: data.descripcion.trim() }),
        direccion: data.direccion,
        provincia: data.provincia,
        ...(data.departamento && { departamento: data.departamento }),
        inquilino: {
          nombre: data.inquilinoNombre,
          dni: data.inquilinoDni,
          email: data.inquilinoEmail,
          telefono: data.inquilinoTelefono,
        },
        contrato: {
          fechaInicio: data.fechaInicio,
          fechaFin: data.fechaFin,
          montoAlquiler: Number(data.montoAlquiler),
          moneda: data.moneda,
          diaVencimiento: Number(data.diaVencimiento),
          ...(data.moraTipo !== 'ninguna' && {
            mora: {
              tipo: data.moraTipo,
              valor: Number(data.moraValor),
              ...(data.moraTipo === 'monto_fijo' && { moneda: data.moneda }),
            },
          }),
          ...(data.actualizacionIndice !== 'ninguno' && {
            actualizacion: {
              periodoMeses: Number(data.actualizacionPeriodo) as 3 | 4 | 6 | 12,
              indice: data.actualizacionIndice,
              ...(data.actualizacionIndice === 'manual' && {
                porcentajeManual: Number(data.actualizacionPorcentaje),
              }),
              ...(proximaFechaActualizacion && {
                proximaFecha: proximaFechaActualizacion,
              }),
            },
          }),
        },
        servicios,
      }

      // Timeout de seguridad: si Firestore no responde en 15s mostramos error
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('timeout: Firestore no respondió. Verificá la configuración.')),
          30000,
        ),
      )

      if (propiedad) {
        await Promise.race([updatePropiedad(propiedad.id, input), timeout])
        upsertPropiedad({ ...propiedad, ...input })
        toast.success('Propiedad actualizada')
        navigate(`/propiedades/${propiedad.id}`)
      } else {
        const newId = await Promise.race([createPropiedad(input, user.uid), timeout])
        upsertPropiedad({ ...input, id: newId, agentId: user.uid, creadoEn: new Date().toISOString() })
        toast.success('Propiedad creada')
        navigate(`/propiedades/${newId}`)
      }
    } catch (e: unknown) {
      const code = (e as { code?: string }).code ?? ''
      const msg = e instanceof Error ? e.message : String(e)
      console.error('Error guardando propiedad:', code, msg)

      if (code === 'permission-denied') {
        toast.error('Sin permisos en Firestore. Revisá las reglas en Firebase Console.', { duration: 6000 })
      } else if (msg.includes('timeout') || code === 'unavailable') {
        toast.error('Firestore no responde. ¿Creaste la base de datos en Firebase Console → Firestore Database?', { duration: 8000 })
      } else if (code === 'failed-precondition') {
        toast.error('Firestore no está configurado. Creá la base de datos en Firebase Console.', { duration: 8000 })
      } else {
        toast.error(`Error: ${code || msg}`, { duration: 6000 })
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl">
      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-8">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center flex-1">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors',
                  i < step
                    ? 'bg-brand-600 border-brand-600 text-white'
                    : i === step
                      ? 'border-brand-600 text-brand-600 bg-white'
                      : 'border-gray-200 text-gray-400 bg-white',
                )}
              >
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <div className="hidden sm:block">
                <p className={cn('text-sm font-medium', i <= step ? 'text-gray-900' : 'text-gray-400')}>
                  {s.label}
                </p>
                <p className="text-xs text-gray-400">{s.description}</p>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div className={cn('flex-1 h-0.5 mx-3', i < step ? 'bg-brand-600' : 'bg-gray-200')} />
            )}
          </div>
        ))}
      </div>

      <div>
        {/* ── Step 0 — Propiedad + Provincia ── */}
        {step === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 text-lg">Datos de la propiedad</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nombre / descripción *
              </label>
              <input
                {...register('nombre', { required: 'Nombre requerido' })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Ej: Departamento Av. San Martín 450, Piso 3B"
              />
              {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Descripción <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <textarea
                {...register('descripcion')}
                rows={2}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                placeholder="Ej: Departamento 3B, 2 dormitorios, balcón al frente, cochera incluida…"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Dirección completa *
              </label>
              <input
                {...register('direccion', { required: 'Dirección requerida' })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Ej: Av. San Martín 450, Godoy Cruz, Mendoza"
              />
              {errors.direccion && <p className="text-red-500 text-xs mt-1">{errors.direccion.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Provincia *
                </label>
                <button
                  type="button"
                  onClick={handleAutoDetect}
                  disabled={!watchedDireccion}
                  className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  Detectar desde dirección
                </button>
              </div>
              <select
                {...register('provincia', { required: 'Provincia requerida' })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="">— Seleccioná una provincia —</option>
                {PROVINCIAS_ARGENTINA.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              {errors.provincia && <p className="text-red-500 text-xs mt-1">{errors.provincia.message}</p>}
              {watchedProvincia && SERVICIOS_POR_PROVINCIA[watchedProvincia] && (
                <p className="text-xs text-gray-400 mt-1.5">
                  Servicios disponibles:{' '}
                  {serviciosDeProvincia.map((s) => s.label).join(', ')}
                </p>
              )}
            </div>

            {/* Departamento — solo Mendoza */}
            {esMendoza && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Departamento *
                  <span className="ml-1 text-xs text-gray-400 font-normal">
                    (determina el impuesto municipal)
                  </span>
                </label>
                <select
                  {...register('departamento', { required: esMendoza ? 'Seleccioná el departamento' : false })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option value="">— Seleccioná el departamento —</option>
                  {DEPARTAMENTOS_MENDOZA.map((d) => (
                    <option key={d.key} value={d.key}>{d.label}</option>
                  ))}
                </select>
                {errors.departamento && (
                  <p className="text-red-500 text-xs mt-1">{errors.departamento.message}</p>
                )}
              </div>
            )}

          </div>
        )}

        {/* ── Step 1 — Inquilino + Contrato ── */}
        {step === 1 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Datos del inquilino</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre completo *</label>
                  <input
                    {...register('inquilinoNombre', { required: 'Requerido' })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Juan Pérez"
                  />
                  {errors.inquilinoNombre && <p className="text-red-500 text-xs mt-1">{errors.inquilinoNombre.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">DNI *</label>
                  <input
                    {...register('inquilinoDni', { required: 'Requerido' })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="30123456"
                  />
                  {errors.inquilinoDni && <p className="text-red-500 text-xs mt-1">{errors.inquilinoDni.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                  <input
                    type="email"
                    {...register('inquilinoEmail', { required: 'Requerido' })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="juan@ejemplo.com"
                  />
                  {errors.inquilinoEmail && <p className="text-red-500 text-xs mt-1">{errors.inquilinoEmail.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Teléfono *</label>
                  <input
                    {...register('inquilinoTelefono', {
                      required: 'Requerido',
                      validate: (v) => {
                        const digits = v.replace(/\D/g, '')
                        if (digits.length < 8 || digits.length > 13) return 'Ingresá un número válido (ej: 2614001234)'
                        return true
                      },
                    })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="2614001234"
                  />
                  {errors.inquilinoTelefono
                    ? <p className="text-red-500 text-xs mt-1">{errors.inquilinoTelefono.message}</p>
                    : <p className="text-xs text-gray-400 mt-1">Sin 0 ni 15 — ej: 2614001234 (Mendoza) · 1145678901 (CABA)</p>
                  }
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">Contrato</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha inicio *</label>
                  <input
                    type="date"
                    {...register('fechaInicio', { required: 'Requerido' })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha fin *</label>
                  <input
                    type="date"
                    {...register('fechaFin', { required: 'Requerido' })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Monto mensual *</label>
                  <div className="flex gap-2">
                    <select
                      {...register('moneda')}
                      className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white font-semibold"
                    >
                      <option value="ARS">$ ARS</option>
                      <option value="USD">U$D USD</option>
                    </select>
                    <input
                      type="number"
                      {...register('montoAlquiler', { required: 'Requerido', min: { value: 1, message: 'Debe ser > 0' } })}
                      className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder={watchedMoneda === 'USD' ? '500' : '150000'}
                    />
                  </div>
                  {errors.montoAlquiler && <p className="text-red-500 text-xs mt-1">{errors.montoAlquiler.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Día de vencimiento *</label>
                  <input
                    type="number"
                    min={1}
                    max={28}
                    {...register('diaVencimiento', { required: 'Requerido', min: 1, max: 28 })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="10"
                  />
                  {errors.diaVencimiento && <p className="text-red-500 text-xs mt-1">{errors.diaVencimiento.message}</p>}
                </div>
              </div>

              {/* Advertencia: fecha pasada con índice automático */}
              {mostrarAdvertenciaFecha && (
                <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-lg mt-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">
                      Fecha de inicio en el pasado
                    </p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      El monto inicial será actualizado automáticamente con el índice <strong>{watchedIndice}</strong> para reflejar el valor actual al día de hoy. Podés ver el historial de aumentos en el detalle de la propiedad.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Mora por pago tardío */}
            <div className="border-t border-gray-100 pt-4">
              <h3 className="font-semibold text-gray-900 mb-1">Multa por mora</h3>
              <p className="text-xs text-gray-400 mb-3">
                Recargo que se aplica por día a partir del día siguiente al vencimiento.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de multa</label>
                  <div className="flex gap-3">
                    {[
                      { value: 'ninguna', label: 'Sin multa' },
                      { value: 'porcentaje', label: '% del alquiler por día' },
                      { value: 'monto_fijo', label: `Monto fijo por día` },
                    ].map((opt) => (
                      <label
                        key={opt.value}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-2 px-3 py-2.5 border rounded-lg text-sm cursor-pointer transition-colors text-center',
                          watchedMoraTipo === opt.value
                            ? 'border-brand-500 bg-brand-50 text-brand-700 font-medium'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50',
                        )}
                      >
                        <input
                          type="radio"
                          value={opt.value}
                          {...register('moraTipo')}
                          className="hidden"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>

                {watchedMoraTipo !== 'ninguna' && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {watchedMoraTipo === 'porcentaje'
                        ? 'Porcentaje diario (%)'
                        : `Monto fijo diario (${watchedMoneda})`}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step={watchedMoraTipo === 'porcentaje' ? '0.01' : '1'}
                        min={0}
                        {...register('moraValor', {
                          required: 'Requerido',
                          min: { value: 0.01, message: 'Debe ser mayor a 0' },
                        })}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 pr-16"
                        placeholder={watchedMoraTipo === 'porcentaje' ? 'Ej: 0.5' : 'Ej: 1000'}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">
                        {watchedMoraTipo === 'porcentaje' ? '% / día' : `${watchedMoneda} / día`}
                      </span>
                    </div>
                    {errors.moraValor && (
                      <p className="text-red-500 text-xs mt-1">{errors.moraValor.message}</p>
                    )}
                    {watchedMoraTipo === 'porcentaje' && (watch('moraValor') > 0) && (
                      <p className="text-xs text-gray-400 mt-1">
                        Sobre un alquiler de {watchedMoneda === 'USD' ? 'U$D' : '$'} {Number(watch('montoAlquiler') || 0).toLocaleString('es-AR')},
                        la mora sería{' '}
                        <span className="font-medium text-gray-600">
                          {watchedMoneda === 'USD' ? 'U$D' : '$'} {((Number(watch('montoAlquiler') || 0) * Number(watch('moraValor') || 0)) / 100).toLocaleString('es-AR', { maximumFractionDigits: 2 })} por día
                        </span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Actualización de alquiler */}
            <div className="border-t border-gray-100 pt-4">
              <h3 className="font-semibold text-gray-900 mb-1">Actualización del alquiler</h3>
              <p className="text-xs text-gray-400 mb-3">
                Según DNU 70/2023, las partes acuerdan libremente el índice y la periodicidad.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Índice de ajuste</label>
                  <select
                    {...register('actualizacionIndice')}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  >
                    <option value="ICL">ICL — Índice Contratos de Locación (BCRA)</option>
                    <option value="IPC">IPC — Índice de Precios al Consumidor (INDEC)</option>
                    <option value="CVS">CVS — Coeficiente de Variación Salarial (INDEC)</option>
                    <option value="manual">Porcentaje fijo acordado entre partes</option>
                    <option value="ninguno">Sin actualización automática</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Periodicidad</label>
                  <select
                    {...register('actualizacionPeriodo')}
                    disabled={watchedIndice === 'ninguno'}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white disabled:opacity-50"
                  >
                    <option value="3">Cada 3 meses (trimestral)</option>
                    <option value="4">Cada 4 meses (cuatrimestral)</option>
                    <option value="6">Cada 6 meses (semestral)</option>
                    <option value="12">Cada 12 meses (anual)</option>
                  </select>
                </div>
                {watchedIndice === 'manual' && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Porcentaje de ajuste (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      {...register('actualizacionPorcentaje', {
                        required: watchedIndice === 'manual' ? 'Requerido' : false,
                        min: { value: 0, message: 'Debe ser positivo' },
                      })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="Ej: 15 (para 15%)"
                    />
                    {errors.actualizacionPorcentaje && (
                      <p className="text-red-500 text-xs mt-1">{errors.actualizacionPorcentaje.message}</p>
                    )}
                  </div>
                )}
                {watchedIndice !== 'ninguno' && (
                  <div className="col-span-2 bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-blue-700">
                      <span className="font-semibold">¿Cómo funciona?</span>{' '}
                      {watchedIndice === 'ICL' && 'El BCRA publica el ICL mensualmente. Es un promedio ponderado del IPC (50%) y el RIPTE (50%), que mide la variación de salarios.'}
                      {watchedIndice === 'IPC' && 'El INDEC publica el IPC mensualmente. Mide la variación de precios de una canasta de bienes y servicios representativa.'}
                      {watchedIndice === 'CVS' && 'El INDEC publica el CVS mensualmente. Mide la variación de los salarios formales registrados del sector privado.'}
                      {watchedIndice === 'manual' && 'El porcentaje indicado se aplicará al monto vigente en cada período. El sistema te recordará cuándo corresponde actualizar.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2 — Servicios (dinámico por provincia) ── */}
        {step === 2 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div>
              <h2 className="font-semibold text-gray-900 text-lg">Servicios públicos</h2>
              {watchedProvincia ? (
                <p className="text-sm text-gray-500 mt-0.5">
                  Servicios para{' '}
                  <span className="font-medium text-gray-700">{watchedProvincia}</span>.
                  Completá solo los que apliquen.
                </p>
              ) : (
                <p className="text-sm text-yellow-600 mt-0.5">
                  No seleccionaste provincia. Volvé al paso 1.
                </p>
              )}
            </div>

            {serviciosDeProvincia.length === 0 && watchedProvincia && (
              <div className="text-center py-8 text-gray-400 text-sm">
                No hay servicios configurados para esta provincia en el prototipo.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {serviciosDeProvincia.map((svc) => {
                const Icon = tipoIcon[svc.tipo]
                const colorClass = tipoColor[svc.tipo]
                return (
                  <div
                    key={svc.key}
                    className="border border-gray-200 rounded-lg p-3 flex flex-col gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn('p-1.5 rounded-md', colorClass)}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{svc.label}</p>
                        <p className="text-xs text-gray-400">{svc.campo}</p>
                      </div>
                    </div>
                    <input
                      {...register(`serviciosNums.${svc.key}`)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50 focus:bg-white"
                      placeholder={`${svc.campo} de ${svc.label}`}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>

          {step < steps.length - 1 ? (
            <button
              type="button"
              onClick={nextStep}
              className="flex items-center gap-2 px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={handleSubmit(onSubmit)}
              className="flex items-center gap-2 px-5 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {saving ? 'Guardando…' : propiedad ? 'Guardar cambios' : 'Crear propiedad'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
