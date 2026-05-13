export type EstadoServicio = 'al_dia' | 'deuda' | 'error' | 'sin_consultar'

// ── Usuarios / suscripción ─────────────────────────────────────────────────────
export type UserStatus = 'pending' | 'active' | 'rejected'

export interface UserDoc {
  uid: string
  email: string
  nombre: string
  status: UserStatus
  creadoEn: string
}

export interface ServicioEstado {
  ultimoEstado: EstadoServicio
  ultimaConsulta: string | null
  monto?: number
  vencimiento?: string
}

// Entry genérico que cubre cualquier proveedor de Argentina
export interface ServicioEstadoEntry extends ServicioEstado {
  nic?: string        // EDESUR, EDENOR
  nis?: string        // EDEMSA (Mendoza)
  nroCliente?: string // Metrogas, AySA, Naturgy, EPEC, EPE, etc.
  nroCuenta?: string  // AYSAM, Aguas Cordobesas, etc.
}

// Record abierto: acepta cualquier clave de proveedor
export type ServiciosPropiedad = Record<string, ServicioEstadoEntry | undefined>

export interface Inquilino {
  nombre: string
  dni: string
  email: string
  telefono: string
}

// Índices de actualización disponibles en Argentina
// ICL  = Índice de Contratos de Locación (BCRA) — blend IPC + RIPTE
// IPC  = Índice de Precios al Consumidor (INDEC)
// CVS  = Coeficiente de Variación Salarial (INDEC)
// manual = porcentaje fijo acordado entre partes
export type IndiceActualizacion = 'ICL' | 'IPC' | 'CVS' | 'manual' | 'ninguno'

export interface ActualizacionAlquiler {
  periodoMeses: 3 | 4 | 6 | 12
  indice: IndiceActualizacion
  porcentajeManual?: number   // solo cuando indice === 'manual'
  proximaFecha?: string       // ISO date — calculada automáticamente
}

export type Moneda = 'ARS' | 'USD'

export interface MoraContrato {
  tipo: 'porcentaje' | 'monto_fijo'
  valor: number          // % diario si tipo=porcentaje | ARS/día si tipo=monto_fijo
  moneda?: Moneda        // solo aplica cuando tipo=monto_fijo
}

export interface Contrato {
  fechaInicio: string
  fechaFin: string
  montoAlquiler: number
  moneda: Moneda
  diaVencimiento: number
  actualizacion?: ActualizacionAlquiler
  mora?: MoraContrato
}

export interface PagoMensual {
  mes: string           // YYYY-MM
  estado: 'pagado' | 'pendiente'
  fechaPago?: string    // ISO date — cuándo se registró el pago
  montoPagado?: number  // monto efectivamente cobrado
}

export type TipoNota = 'general' | 'inventario' | 'dano' | 'servicio_tecnico'

export interface NotaPropiedad {
  id: string
  tipo: TipoNota
  texto: string
  profesional?: string   // nombre del plomero, electricista, etc. (solo tipo servicio_tecnico)
  creadoEn: string       // ISO date
}

export interface Propiedad {
  id: string
  nombre: string
  descripcion?: string
  direccion: string
  provincia: string
  departamento?: string   // usado en Mendoza para el impuesto municipal
  inquilino: Inquilino
  contrato: Contrato
  servicios: ServiciosPropiedad
  pagos?: Record<string, PagoMensual>  // clave: YYYY-MM
  creadoEn: string
  agentId: string
  calendarEventId?: string
}

export type PropiedadInput = Omit<Propiedad, 'id' | 'creadoEn' | 'agentId' | 'calendarEventId'>
