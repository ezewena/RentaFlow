import { google } from 'googleapis'
import * as admin from 'firebase-admin'

interface PropiedadData {
  nombre: string
  inquilino: { nombre: string; email: string }
  contrato: { diaVencimiento: number; montoAlquiler: number; moneda: string; fechaFin: string }
  agentId: string
}

function buildCalendarService() {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_CALENDAR_CLIENT_EMAIL,
    key: process.env.GOOGLE_CALENDAR_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/calendar'],
  })
  return google.calendar({ version: 'v3', auth })
}

export async function crearEventoRecurrente(
  propiedadId: string,
  data: PropiedadData,
): Promise<string> {
  const calendar = buildCalendarService()
  const calendarId = process.env.GOOGLE_CALENDAR_ID ?? 'primary'

  const { diaVencimiento, montoAlquiler, moneda, fechaFin } = data.contrato
  const year = new Date().getFullYear()
  const month = String(new Date().getMonth() + 1).padStart(2, '0')
  const day = String(diaVencimiento).padStart(2, '0')

  const eventDate = `${year}-${month}-${day}`
  const untilDate = fechaFin.replace(/-/g, '') + 'T000000Z'

  const event = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: `Vencimiento alquiler — ${data.nombre}`,
      description: [
        `Inquilino: ${data.inquilino.nombre}`,
        `Email: ${data.inquilino.email}`,
        `Monto: ${moneda} ${montoAlquiler.toLocaleString('es-AR')}`,
        `Propiedad ID: ${propiedadId}`,
      ].join('\n'),
      start: { date: eventDate },
      end: { date: eventDate },
      recurrence: [`RRULE:FREQ=MONTHLY;BYMONTHDAY=${diaVencimiento};UNTIL=${untilDate}`],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 3 * 24 * 60 },
          { method: 'popup', minutes: 0 },
          { method: 'email', minutes: 3 * 24 * 60 },
        ],
      },
    },
  })

  // Guardar eventId en Firestore
  await admin.firestore().collection('propiedades').doc(propiedadId).update({
    calendarEventId: event.data.id,
  })

  return event.data.id ?? ''
}

export async function actualizarEventoRecurrente(
  propiedadId: string,
  eventId: string,
  data: PropiedadData,
): Promise<void> {
  const calendar = buildCalendarService()
  const calendarId = process.env.GOOGLE_CALENDAR_ID ?? 'primary'

  const { diaVencimiento, montoAlquiler, moneda, fechaFin } = data.contrato
  const untilDate = fechaFin.replace(/-/g, '') + 'T000000Z'

  await calendar.events.update({
    calendarId,
    eventId,
    requestBody: {
      summary: `Vencimiento alquiler — ${data.nombre}`,
      description: [
        `Inquilino: ${data.inquilino.nombre}`,
        `Email: ${data.inquilino.email}`,
        `Monto: ${moneda} ${montoAlquiler.toLocaleString('es-AR')}`,
      ].join('\n'),
      recurrence: [`RRULE:FREQ=MONTHLY;BYMONTHDAY=${diaVencimiento};UNTIL=${untilDate}`],
    },
  })
}
