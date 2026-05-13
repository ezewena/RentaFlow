import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Propiedad } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'ARS') {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function daysUntil(dateStr: string): number {
  const target = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

// Clave del mes actual en formato YYYY-MM
export function mesActual(): string {
  const hoy = new Date()
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`
}

export interface DeudaActual {
  enMora: boolean
  diasMora: number
  montoBase: number
  moraDiaria: number
  moraTotal: number
  totalDeuda: number
  moneda: string
}

// Calcula si la propiedad está en mora hoy y cuánto debe
// montoBaseOverride: permite pasar el monto ajustado por índice en lugar del monto base del contrato
export function calcularDeudaActual(p: Propiedad, montoBaseOverride?: number): DeudaActual | null {
  const hoy = new Date()
  const mes = mesActual()
  const pagoMes = p.pagos?.[mes]

  // Si ya está pagado este mes, no hay deuda
  if (pagoMes?.estado === 'pagado') return null

  const diaVenc = p.contrato.diaVencimiento
  const diaHoy = hoy.getDate()

  // Solo hay mora a partir del día siguiente al vencimiento
  if (diaHoy <= diaVenc) return null

  const diasMora = diaHoy - diaVenc
  const montoBase = montoBaseOverride ?? p.contrato.montoAlquiler
  const mora = p.contrato.mora
  const moneda = p.contrato.moneda ?? 'ARS'

  let moraDiaria = 0
  if (mora) {
    moraDiaria =
      mora.tipo === 'porcentaje'
        ? (montoBase * mora.valor) / 100
        : mora.valor
  }

  const moraTotal = moraDiaria * diasMora

  return {
    enMora: true,
    diasMora,
    montoBase,
    moraDiaria,
    moraTotal,
    totalDeuda: montoBase + moraTotal,
    moneda,
  }
}
