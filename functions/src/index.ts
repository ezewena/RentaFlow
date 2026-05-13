import * as admin from 'firebase-admin'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { consultarServicio } from './scraping/index'
import { crearEventoRecurrente, actualizarEventoRecurrente } from './calendario/crearRecordatorio'
import { ejecutarResumenMensual } from './notificaciones/resumenMensual'
import { ejecutarAlertasDiarias } from './notificaciones/alertasVencimiento'

admin.initializeApp()

// ── Consultar deuda de un servicio (llamado desde el frontend) ────────────────
export const consultarDeudaServicio = onCall(
  { region: 'us-central1', timeoutSeconds: 60, memory: '1GiB' },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'No autenticado')

    const { servicio, numeroCliente } = request.data as {
      servicio: string
      numeroCliente: string
    }

    if (!servicio || !numeroCliente) {
      throw new HttpsError('invalid-argument', 'servicio y numeroCliente son requeridos')
    }

    const resultado = await consultarServicio(
      servicio as 'edesur' | 'edenor' | 'metrogas' | 'naturgy' | 'aysa' | 'aysam',
      numeroCliente,
    )
    return resultado
  },
)

// ── Crear/actualizar evento en Google Calendar al guardar propiedad ────────────
export const crearRecordatorioCalendario = onDocumentWritten(
  { document: 'propiedades/{propId}', region: 'us-central1' },
  async (event) => {
    const propId = event.params.propId
    const after = event.data?.after?.data()

    if (!after) return // documento eliminado

    // No procesar si no hay variables de Calendar configuradas
    if (!process.env.GOOGLE_CALENDAR_CLIENT_EMAIL) return

    const propData = {
      nombre: after.nombre,
      inquilino: after.inquilino,
      contrato: after.contrato,
      agentId: after.agentId,
    }

    try {
      if (after.calendarEventId) {
        await actualizarEventoRecurrente(propId, after.calendarEventId, propData)
      } else {
        await crearEventoRecurrente(propId, propData)
      }
    } catch (error) {
      console.error('Error gestionando evento de Calendar:', error)
    }
  },
)

// ── Consulta automática de deuda — día 5 de cada mes ─────────────────────────
export const consultaDeudaMensual = onSchedule(
  { schedule: '0 9 5 * *', region: 'us-central1', timeoutSeconds: 540, memory: '2GiB' },
  async () => {
    const db = admin.firestore()
    const snap = await db.collection('propiedades').get()

    for (const docSnap of snap.docs) {
      const data = docSnap.data()
      const servicios = data.servicios ?? {}

      for (const [key, estado] of Object.entries(servicios)) {
        const s = estado as Record<string, string>
        const num = s.nic ?? s.nroCliente ?? s.nroCuenta
        if (!num) continue

        try {
          const resultado = await consultarServicio(
            key as 'edesur' | 'edenor' | 'metrogas' | 'naturgy' | 'aysa' | 'aysam',
            num,
          )
          await db.collection('propiedades').doc(docSnap.id).update({
            [`servicios.${key}.ultimoEstado`]: resultado.estado,
            [`servicios.${key}.ultimaConsulta`]: new Date().toISOString(),
            ...(resultado.monto !== undefined && {
              [`servicios.${key}.monto`]: resultado.monto,
            }),
          })
        } catch (error) {
          console.error(`Error consultando ${key} para propiedad ${docSnap.id}:`, error)
        }
      }
    }

    console.log(`Consulta mensual completada para ${snap.size} propiedades`)
  },
)

// ── Resumen mensual por email — día 1 de cada mes ────────────────────────────
export const resumenMensualEmail = onSchedule(
  { schedule: '0 8 1 * *', region: 'us-central1', timeoutSeconds: 300 },
  async () => {
    await ejecutarResumenMensual()
    console.log('Resumenes mensuales enviados')
  },
)

// ── Alertas diarias: vencimiento cuota, ajuste próximo, deuda servicios ───────
// Corre todos los días a las 8:00 AM (hora Argentina = UTC-3 → 11:00 UTC)
export const alertasDiarias = onSchedule(
  { schedule: '0 11 * * *', region: 'us-central1', timeoutSeconds: 300 },
  async () => {
    await ejecutarAlertasDiarias()
    console.log('Alertas diarias procesadas')
  },
)
