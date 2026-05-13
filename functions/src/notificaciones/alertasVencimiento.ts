import * as nodemailer from 'nodemailer'
import * as admin from 'firebase-admin'

// Días de anticipación en los que se avisa sobre el vencimiento del contrato
const DIAS_ALERTA_CONTRATO = [60, 30, 20, 10, 3]

// Días antes del ajuste en que se avisa al agente (y se activa el botón en la UI)
const DIAS_ALERTA_AJUSTE = 15

/**
 * Calcula la próxima fecha de actualización de alquiler de forma dinámica,
 * sin depender del campo `proximaFecha` almacenado (que sólo refleja la primera).
 *
 * Devuelve el primer día del mes en que caerá el próximo ajuste.
 */
function calcularProximaFechaAjuste(fechaInicio: string, periodoMeses: number): string {
  const [y, m] = fechaInicio.split('-').map(Number)
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  // Primera fecha de ajuste: fechaInicio + periodoMeses
  let fechaAjuste = new Date(y, m - 1 + periodoMeses, 1)

  // Avanzar hasta que sea futura
  while (fechaAjuste <= hoy) {
    fechaAjuste = new Date(
      fechaAjuste.getFullYear(),
      fechaAjuste.getMonth() + periodoMeses,
      1,
    )
  }

  const ay = fechaAjuste.getFullYear()
  const am = String(fechaAjuste.getMonth() + 1).padStart(2, '0')
  return `${ay}-${am}-01`
}

function buildTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  })
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

function formatMonto(n: number) {
  return n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
}

// Devuelve YYYY-MM-DD de hoy en hora local argentina (UTC-3)
function hoyArg(): string {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset() - 180)
  return now.toISOString().split('T')[0]
}

// ──────────────────────────────────────────────
// Email: cuota a punto de vencer
// ──────────────────────────────────────────────
async function enviarAlertaVencimientoCuota(
  agentEmail: string,
  items: { propiedadNombre: string; inquilino: string; monto: number; diasRestantes: number }[],
) {
  const transporter = buildTransporter()
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #f59e0b; color: white; padding: 20px 24px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 20px;">RentaFlow — Cuotas próximas a vencer</h1>
      </div>
      <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="color: #374151; font-size: 14px;">
          Las siguientes cuotas vencen en los próximos días:
        </p>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 12px;">
          <thead>
            <tr style="background: #fef3c7; border-bottom: 2px solid #fcd34d;">
              <th style="text-align: left; padding: 8px 10px; color: #92400e;">Propiedad</th>
              <th style="text-align: left; padding: 8px 10px; color: #92400e;">Inquilino</th>
              <th style="text-align: right; padding: 8px 10px; color: #92400e;">Monto</th>
              <th style="text-align: center; padding: 8px 10px; color: #92400e;">Vence en</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item) => `
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 8px 10px; color: #374151;">${item.propiedadNombre}</td>
                <td style="padding: 8px 10px; color: #374151;">${item.inquilino}</td>
                <td style="padding: 8px 10px; color: #374151; text-align: right;">${formatMonto(item.monto)}</td>
                <td style="padding: 8px 10px; text-align: center;">
                  <span style="background: ${item.diasRestantes <= 2 ? '#fef2f2' : '#fef3c7'}; color: ${item.diasRestantes <= 2 ? '#dc2626' : '#d97706'}; padding: 2px 8px; border-radius: 9999px; font-size: 12px; font-weight: 600;">
                    ${item.diasRestantes === 0 ? 'Hoy' : item.diasRestantes === 1 ? 'Mañana' : `${item.diasRestantes} días`}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
          Este email fue generado automáticamente por RentaFlow.
        </p>
      </div>
    </div>
  `
  await transporter.sendMail({
    from: `RentaFlow <${process.env.SMTP_USER}>`,
    to: agentEmail,
    subject: `RentaFlow — ${items.length} cuota${items.length > 1 ? 's' : ''} próxima${items.length > 1 ? 's' : ''} a vencer`,
    html,
  })
}

// ──────────────────────────────────────────────
// Email: actualización de alquiler próxima
// ──────────────────────────────────────────────
async function enviarAlertaActualizacion(
  agentEmail: string,
  items: { propiedadNombre: string; inquilino: string; monto: number; indice: string; diasRestantes: number; proximaFecha: string }[],
) {
  const transporter = buildTransporter()
  const indiceLabel: Record<string, string> = {
    ICL: 'ICL (BCRA)',
    IPC: 'IPC (INDEC)',
    CVS: 'CVS (INDEC)',
    manual: 'Porcentaje manual',
  }
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #7c3aed; color: white; padding: 20px 24px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 20px;">RentaFlow — Actualizaciones de alquiler próximas</h1>
      </div>
      <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="color: #374151; font-size: 14px;">
          Los siguientes contratos tienen actualización programada próximamente:
        </p>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 12px;">
          <thead>
            <tr style="background: #f5f3ff; border-bottom: 2px solid #ddd6fe;">
              <th style="text-align: left; padding: 8px 10px; color: #4c1d95;">Propiedad</th>
              <th style="text-align: left; padding: 8px 10px; color: #4c1d95;">Inquilino</th>
              <th style="text-align: right; padding: 8px 10px; color: #4c1d95;">Monto actual</th>
              <th style="text-align: left; padding: 8px 10px; color: #4c1d95;">Índice</th>
              <th style="text-align: center; padding: 8px 10px; color: #4c1d95;">Fecha</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item) => `
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 8px 10px; color: #374151;">${item.propiedadNombre}</td>
                <td style="padding: 8px 10px; color: #374151;">${item.inquilino}</td>
                <td style="padding: 8px 10px; color: #374151; text-align: right;">${formatMonto(item.monto)}</td>
                <td style="padding: 8px 10px; color: #7c3aed; font-weight: 600;">${indiceLabel[item.indice] ?? item.indice}</td>
                <td style="padding: 8px 10px; text-align: center; color: #374151;">${formatFecha(item.proximaFecha)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="background: #f5f3ff; border-radius: 8px; padding: 12px 16px; margin-top: 16px;">
          <p style="color: #5b21b6; font-size: 13px; margin: 0;">
            <strong>Recordatorio:</strong> Consultá el valor actualizado del índice en el sitio del
            BCRA (<a href="https://www.bcra.gob.ar" style="color: #7c3aed;">bcra.gob.ar</a>) o del
            INDEC (<a href="https://www.indec.gob.ar" style="color: #7c3aed;">indec.gob.ar</a>)
            antes de notificar el nuevo monto al inquilino.
          </p>
        </div>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
          Este email fue generado automáticamente por RentaFlow.
        </p>
      </div>
    </div>
  `
  await transporter.sendMail({
    from: `RentaFlow <${process.env.SMTP_USER}>`,
    to: agentEmail,
    subject: `RentaFlow — ${items.length} actualización${items.length > 1 ? 'es' : ''} de alquiler próxima${items.length > 1 ? 's' : ''}`,
    html,
  })
}

// ──────────────────────────────────────────────
// Email: servicios con deuda detectada
// ──────────────────────────────────────────────
async function enviarAlertaDeudaServicios(
  agentEmail: string,
  items: { propiedadNombre: string; inquilino: string; servicios: { label: string; monto?: number }[] }[],
) {
  const transporter = buildTransporter()
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #dc2626; color: white; padding: 20px 24px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 20px;">RentaFlow — Servicios con deuda pendiente</h1>
      </div>
      <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="color: #374151; font-size: 14px;">
          Se detectaron deudas en los siguientes servicios:
        </p>
        ${items.map((item) => `
          <div style="border: 1px solid #fecaca; border-radius: 8px; padding: 14px; margin: 12px 0; background: #fef2f2;">
            <p style="margin: 0 0 6px; font-weight: 600; color: #991b1b;">${item.propiedadNombre}</p>
            <p style="margin: 0 0 8px; font-size: 13px; color: #6b7280;">Inquilino: ${item.inquilino}</p>
            <ul style="margin: 0; padding-left: 16px; font-size: 13px; color: #374151;">
              ${item.servicios.map((s) => `
                <li>${s.label}${s.monto !== undefined ? ` — <strong>$ ${s.monto.toLocaleString('es-AR')}</strong>` : ''}</li>
              `).join('')}
            </ul>
          </div>
        `).join('')}
        <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
          Este email fue generado automáticamente por RentaFlow.
        </p>
      </div>
    </div>
  `
  await transporter.sendMail({
    from: `RentaFlow <${process.env.SMTP_USER}>`,
    to: agentEmail,
    subject: `RentaFlow — Deuda en servicios detectada`,
    html,
  })
}

// ──────────────────────────────────────────────
// Email: vencimiento de contrato próximo
// ──────────────────────────────────────────────
async function enviarAlertaVencimientoContrato(
  agentEmail: string,
  items: { propiedadNombre: string; inquilino: string; fechaFin: string; diasRestantes: number }[],
) {
  const transporter = buildTransporter()

  const urgencyColor = (dias: number) => {
    if (dias <= 10) return '#dc2626'
    if (dias <= 30) return '#d97706'
    return '#2563eb'
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1e40af; color: white; padding: 20px 24px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 20px;">RentaFlow — Contratos por vencer</h1>
        <p style="margin: 4px 0 0; opacity: 0.8; font-size: 13px;">
          ${new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
      </div>
      <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="color: #374151; font-size: 14px;">
          Los siguientes contratos están próximos a vencer. Te recomendamos contactar al inquilino
          con anticipación para acordar la renovación o el desalojo.
        </p>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 12px;">
          <thead>
            <tr style="background: #eff6ff; border-bottom: 2px solid #bfdbfe;">
              <th style="text-align: left; padding: 8px 10px; color: #1e40af;">Propiedad</th>
              <th style="text-align: left; padding: 8px 10px; color: #1e40af;">Inquilino</th>
              <th style="text-align: center; padding: 8px 10px; color: #1e40af;">Vence el</th>
              <th style="text-align: center; padding: 8px 10px; color: #1e40af;">Días restantes</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item) => `
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 8px 10px; color: #374151; font-weight: 600;">${item.propiedadNombre}</td>
                <td style="padding: 8px 10px; color: #374151;">${item.inquilino}</td>
                <td style="padding: 8px 10px; text-align: center; color: #374151;">${formatFecha(item.fechaFin)}</td>
                <td style="padding: 8px 10px; text-align: center;">
                  <span style="
                    background: ${urgencyColor(item.diasRestantes)}18;
                    color: ${urgencyColor(item.diasRestantes)};
                    padding: 3px 10px; border-radius: 9999px;
                    font-size: 12px; font-weight: 700;
                  ">
                    ${item.diasRestantes} días
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="background: #f0f9ff; border-radius: 8px; padding: 12px 16px; margin-top: 16px;">
          <p style="color: #0369a1; font-size: 13px; margin: 0;">
            <strong>Recordatorio legal:</strong> En Argentina, el plazo mínimo de un contrato de
            locación con destino habitacional es de 3 años (Ley 27.551). Si el contrato no se renueva,
            el inquilino debe ser notificado con al menos 3 meses de anticipación.
          </p>
        </div>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
          Este email fue generado automáticamente por RentaFlow.
        </p>
      </div>
    </div>
  `

  await transporter.sendMail({
    from: `RentaFlow <${process.env.SMTP_USER}>`,
    to: agentEmail,
    subject: `RentaFlow — ${items.length} contrato${items.length > 1 ? 's' : ''} por vencer`,
    html,
  })
}

// ──────────────────────────────────────────────
// Push notification via FCM
// ──────────────────────────────────────────────
async function enviarPushNotification(
  fcmToken: string,
  title: string,
  body: string,
) {
  try {
    await admin.messaging().send({
      token: fcmToken,
      notification: { title, body },
      webpush: {
        notification: {
          title,
          body,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          requireInteraction: true,
        },
        fcmOptions: { link: '/' },
      },
    })
  } catch (err) {
    console.error('Error enviando push notification:', err)
  }
}

// ──────────────────────────────────────────────
// Función principal — ejecutada diariamente
// ──────────────────────────────────────────────
export async function ejecutarAlertasDiarias() {
  const db = admin.firestore()
  const hoy = hoyArg()

  const snap = await db.collection('propiedades').get()

  // Agrupar alertas por agente
  type AlertaVencimiento = { propiedadNombre: string; inquilino: string; monto: number; diasRestantes: number }
  type AlertaActualizacion = { propiedadNombre: string; inquilino: string; monto: number; indice: string; diasRestantes: number; proximaFecha: string }
  type AlertaDeuda = { propiedadNombre: string; inquilino: string; servicios: { label: string; monto?: number }[] }
  type AlertaContrato = { propiedadNombre: string; inquilino: string; fechaFin: string; diasRestantes: number }

  const vencimientos: Record<string, AlertaVencimiento[]> = {}
  const actualizaciones: Record<string, AlertaActualizacion[]> = {}
  const deudas: Record<string, AlertaDeuda[]> = {}
  const contratos: Record<string, AlertaContrato[]> = {}
  const agentEmails: Record<string, string> = {}
  const fcmTokens: Record<string, string> = {}

  for (const docSnap of snap.docs) {
    const p = docSnap.data()
    const agentId: string = p.agentId
    const nombre: string = p.nombre ?? 'Sin nombre'
    const inquilino: string = p.inquilino?.nombre ?? 'Sin inquilino'
    const monto: number = p.contrato?.montoAlquiler ?? 0
    const diaVenc: number = p.contrato?.diaVencimiento ?? 1

    // Obtener email del agente y token FCM
    if (!agentEmails[agentId]) {
      try {
        const u = await admin.auth().getUser(agentId)
        agentEmails[agentId] = u.email ?? ''
      } catch { agentEmails[agentId] = '' }

      try {
        const usuarioDoc = await db.collection('usuarios').doc(agentId).get()
        fcmTokens[agentId] = usuarioDoc.data()?.fcmToken ?? ''
      } catch { fcmTokens[agentId] = '' }
    }

    // ── Alerta vencimiento de contrato: 60, 30, 20, 10, 3 días ──
    const fechaFin: string = p.contrato?.fechaFin ?? ''
    if (fechaFin) {
      const diffContrato = Math.round(
        (new Date(fechaFin).getTime() - new Date(hoy).getTime()) / 86400000,
      )
      if (DIAS_ALERTA_CONTRATO.includes(diffContrato)) {
        if (!contratos[agentId]) contratos[agentId] = []
        contratos[agentId].push({
          propiedadNombre: nombre,
          inquilino,
          fechaFin,
          diasRestantes: diffContrato,
        })
      }
    }

    // ── Alerta cuota: vence en 5 días o menos ──
    const [ano, mes] = hoy.split('-').map(Number)
    const fechaVenc = `${ano}-${String(mes).padStart(2, '0')}-${String(diaVenc).padStart(2, '0')}`
    const diffDias = Math.round(
      (new Date(fechaVenc).getTime() - new Date(hoy).getTime()) / 86400000,
    )
    if (diffDias >= 0 && diffDias <= 5) {
      if (!vencimientos[agentId]) vencimientos[agentId] = []
      vencimientos[agentId].push({ propiedadNombre: nombre, inquilino, monto, diasRestantes: diffDias })
    }

    // ── Alerta actualización: próxima en DIAS_ALERTA_AJUSTE días o menos ──
    // Se calcula dinámicamente para funcionar más allá del primer período.
    const act = p.contrato?.actualizacion
    const fechaInicio: string = p.contrato?.fechaInicio ?? ''
    if (act && act.indice !== 'ninguno' && act.indice !== 'manual' && fechaInicio) {
      const proximaFechaAjuste = calcularProximaFechaAjuste(fechaInicio, act.periodoMeses)
      const diffAct = Math.round(
        (new Date(proximaFechaAjuste).getTime() - new Date(hoy).getTime()) / 86400000,
      )
      if (diffAct >= 0 && diffAct <= DIAS_ALERTA_AJUSTE) {
        if (!actualizaciones[agentId]) actualizaciones[agentId] = []
        actualizaciones[agentId].push({
          propiedadNombre: nombre,
          inquilino,
          monto,
          indice: act.indice,
          diasRestantes: diffAct,
          proximaFecha: proximaFechaAjuste,
        })
      }
    }

    // ── Alerta deuda servicios ──
    const serviciosConDeuda = Object.entries(p.servicios ?? {})
      .filter(([, s]) => (s as { ultimoEstado?: string })?.ultimoEstado === 'deuda')
      .map(([key, s]) => ({
        label: key.toUpperCase(),
        monto: (s as { monto?: number })?.monto,
      }))
    if (serviciosConDeuda.length > 0) {
      if (!deudas[agentId]) deudas[agentId] = []
      deudas[agentId].push({ propiedadNombre: nombre, inquilino, servicios: serviciosConDeuda })
    }
  }

  // Enviar emails y push agrupados por agente
  for (const agentId of Object.keys(agentEmails)) {
    const email = agentEmails[agentId]
    const fcmToken = fcmTokens[agentId] ?? ''

    // ── Cuota mensual próxima ──
    if (vencimientos[agentId]?.length) {
      if (email) await enviarAlertaVencimientoCuota(email, vencimientos[agentId])
      if (fcmToken) {
        const count = vencimientos[agentId].length
        await enviarPushNotification(
          fcmToken,
          `Cuota${count > 1 ? 's' : ''} próxima${count > 1 ? 's' : ''} a vencer`,
          vencimientos[agentId].map((v) =>
            `${v.propiedadNombre}: vence en ${v.diasRestantes === 0 ? 'hoy' : `${v.diasRestantes} días`}`,
          ).join(' | '),
        )
      }
    }

    // ── Actualización de alquiler próxima ──
    if (actualizaciones[agentId]?.length) {
      if (email) await enviarAlertaActualizacion(email, actualizaciones[agentId])
      if (fcmToken) {
        const count = actualizaciones[agentId].length
        await enviarPushNotification(
          fcmToken,
          `Actualización de alquiler en ${count > 1 ? `${count} propiedades` : actualizaciones[agentId][0].propiedadNombre}`,
          actualizaciones[agentId].map((a) =>
            `${a.propiedadNombre}: ${a.indice} — ${formatFecha(a.proximaFecha)}`,
          ).join(' | '),
        )
      }
    }

    // ── Deuda en servicios ──
    if (deudas[agentId]?.length) {
      if (email) await enviarAlertaDeudaServicios(email, deudas[agentId])
      if (fcmToken) {
        await enviarPushNotification(
          fcmToken,
          'Deuda en servicios detectada',
          deudas[agentId].map((d) =>
            `${d.propiedadNombre}: ${d.servicios.map((s) => s.label).join(', ')}`,
          ).join(' | '),
        )
      }
    }

    // ── Contrato por vencer ──
    if (contratos[agentId]?.length) {
      if (email) await enviarAlertaVencimientoContrato(email, contratos[agentId])
      if (fcmToken) {
        for (const c of contratos[agentId]) {
          await enviarPushNotification(
            fcmToken,
            `Contrato por vencer — ${c.propiedadNombre}`,
            `El contrato de ${c.inquilino} vence el ${formatFecha(c.fechaFin)} (${c.diasRestantes} días restantes).`,
          )
        }
      }
    }
  }
}
