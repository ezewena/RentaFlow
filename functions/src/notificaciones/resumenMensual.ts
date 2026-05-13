import * as nodemailer from 'nodemailer'
import * as admin from 'firebase-admin'

interface PropiedadResumen {
  nombre: string
  inquilino: string
  serviciosConDeuda: string[]
  montoAlquiler: number
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

export async function enviarResumenMensual(agentEmail: string, propiedades: PropiedadResumen[]) {
  const transporter = buildTransporter()

  const conDeuda = propiedades.filter((p) => p.serviciosConDeuda.length > 0)
  const alDia = propiedades.filter((p) => p.serviciosConDeuda.length === 0)

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #2563eb; color: white; padding: 20px 24px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 20px;">RentaFlow — Resumen mensual</h1>
        <p style="margin: 4px 0 0; opacity: 0.8; font-size: 14px;">
          ${new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="color: #374151; font-size: 14px;">
          Resumen de estado de servicios de tus <strong>${propiedades.length} propiedades</strong>.
        </p>

        ${
          conDeuda.length > 0
            ? `
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <h2 style="color: #dc2626; font-size: 16px; margin: 0 0 12px;">
              ⚠ ${conDeuda.length} propiedad${conDeuda.length > 1 ? 'es' : ''} con deuda en servicios
            </h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <thead>
                <tr style="border-bottom: 1px solid #fecaca;">
                  <th style="text-align: left; padding: 6px 8px; color: #991b1b;">Propiedad</th>
                  <th style="text-align: left; padding: 6px 8px; color: #991b1b;">Inquilino</th>
                  <th style="text-align: left; padding: 6px 8px; color: #991b1b;">Servicios</th>
                </tr>
              </thead>
              <tbody>
                ${conDeuda
                  .map(
                    (p) => `
                  <tr>
                    <td style="padding: 6px 8px; color: #374151;">${p.nombre}</td>
                    <td style="padding: 6px 8px; color: #374151;">${p.inquilino}</td>
                    <td style="padding: 6px 8px; color: #dc2626;">${p.serviciosConDeuda.join(', ')}</td>
                  </tr>
                `,
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        `
            : ''
        }

        ${
          alDia.length > 0
            ? `
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <h2 style="color: #16a34a; font-size: 16px; margin: 0 0 4px;">
              ✓ ${alDia.length} propiedad${alDia.length > 1 ? 'es' : ''} al día
            </h2>
          </div>
        `
            : ''
        }

        <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
          Este email fue generado automáticamente por RentaFlow.
        </p>
      </div>
    </div>
  `

  await transporter.sendMail({
    from: `RentaFlow <${process.env.SMTP_USER}>`,
    to: agentEmail,
    subject: `RentaFlow — Resumen de servicios ${new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}`,
    html,
  })
}

export async function notificarDeuda(
  agentEmail: string,
  propiedadNombre: string,
  servicio: string,
  monto?: number,
) {
  const transporter = buildTransporter()
  await transporter.sendMail({
    from: `RentaFlow <${process.env.SMTP_USER}>`,
    to: agentEmail,
    subject: `⚠ Deuda detectada — ${propiedadNombre}`,
    html: `
      <p>Se detectó deuda en el servicio <strong>${servicio}</strong> para la propiedad <strong>${propiedadNombre}</strong>.</p>
      ${monto !== undefined ? `<p>Monto: <strong>$ ${monto.toLocaleString('es-AR')}</strong></p>` : ''}
      <p><a href="#">Ver en RentaFlow</a></p>
    `,
  })
}

export async function ejecutarResumenMensual() {
  const db = admin.firestore()
  const snap = await db.collection('propiedades').get()

  // Agrupar por agente
  const porAgente: Record<string, PropiedadResumen[]> = {}
  const agentEmails: Record<string, string> = {}

  for (const doc of snap.docs) {
    const data = doc.data()
    const agentId: string = data.agentId

    if (!porAgente[agentId]) porAgente[agentId] = []

    const serviciosConDeuda = Object.entries(data.servicios ?? {})
      .filter(([, s]) => (s as { ultimoEstado?: string })?.ultimoEstado === 'deuda')
      .map(([key]) => key.toUpperCase())

    porAgente[agentId].push({
      nombre: data.nombre,
      inquilino: data.inquilino?.nombre ?? '',
      serviciosConDeuda,
      montoAlquiler: data.contrato?.montoAlquiler ?? 0,
    })

    // Obtener email del agente desde Firebase Auth
    if (!agentEmails[agentId]) {
      try {
        const user = await admin.auth().getUser(agentId)
        agentEmails[agentId] = user.email ?? ''
      } catch {
        agentEmails[agentId] = ''
      }
    }
  }

  // Enviar resumen por agente
  for (const [agentId, propiedades] of Object.entries(porAgente)) {
    const email = agentEmails[agentId]
    if (email) {
      await enviarResumenMensual(email, propiedades)
    }
  }
}
