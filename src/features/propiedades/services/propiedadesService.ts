import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/shared/lib/firebase'
import { Propiedad, PropiedadInput, NotaPropiedad, TipoNota } from '@/shared/lib/types'

const COL = 'propiedades'

function toPropiedad(id: string, data: Record<string, unknown>): Propiedad {
  return {
    ...(data as Omit<Propiedad, 'id' | 'creadoEn'>),
    id,
    creadoEn:
      data.creadoEn instanceof Timestamp
        ? data.creadoEn.toDate().toISOString()
        : String(data.creadoEn ?? ''),
  }
}

export async function getPropiedades(agentId: string): Promise<Propiedad[]> {
  const q = query(collection(db, COL), where('agentId', '==', agentId))
  const snap = await getDocs(q)
  return snap.docs.map((d) => toPropiedad(d.id, d.data() as Record<string, unknown>))
}

export async function getPropiedad(id: string): Promise<Propiedad | null> {
  const snap = await getDoc(doc(db, COL, id))
  if (!snap.exists()) return null
  return toPropiedad(snap.id, snap.data() as Record<string, unknown>)
}

export async function createPropiedad(
  input: PropiedadInput,
  agentId: string,
): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    ...input,
    agentId,
    creadoEn: serverTimestamp(),
  })
  return ref.id
}

export async function updatePropiedad(
  id: string,
  input: Partial<PropiedadInput>,
): Promise<void> {
  await updateDoc(doc(db, COL, id), input as Record<string, unknown>)
}

export async function deletePropiedad(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id))
}

export async function registrarPago(
  propiedadId: string,
  mes: string,   // YYYY-MM
  montoPagado: number,
): Promise<void> {
  await updateDoc(doc(db, COL, propiedadId), {
    [`pagos.${mes}`]: {
      mes,
      estado: 'pagado',
      fechaPago: new Date().toISOString(),
      montoPagado,
    },
  })
}

export async function desmarcarPago(
  propiedadId: string,
  mes: string,
): Promise<void> {
  await updateDoc(doc(db, COL, propiedadId), {
    [`pagos.${mes}`]: {
      mes,
      estado: 'pendiente',
    },
  })
}

// ── Notas ─────────────────────────────────────────────────────────────────────

export async function getNotas(propiedadId: string): Promise<NotaPropiedad[]> {
  const q = query(
    collection(db, COL, propiedadId, 'notas'),
    orderBy('creadoEn', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      tipo: data.tipo as TipoNota,
      texto: data.texto,
      profesional: data.profesional,
      creadoEn:
        data.creadoEn instanceof Timestamp
          ? data.creadoEn.toDate().toISOString()
          : String(data.creadoEn ?? ''),
    }
  })
}

export async function agregarNota(
  propiedadId: string,
  agentId: string,
  nota: Omit<NotaPropiedad, 'id' | 'creadoEn'>,
): Promise<NotaPropiedad> {
  const payload: Record<string, unknown> = {
    tipo: nota.tipo,
    texto: nota.texto,
    agentId,           // necesario para la regla de Firestore
    creadoEn: serverTimestamp(),
  }
  if (nota.profesional?.trim()) payload.profesional = nota.profesional.trim()

  const ref = await addDoc(collection(db, COL, propiedadId, 'notas'), payload)
  return { ...nota, id: ref.id, creadoEn: new Date().toISOString() }
}

export async function eliminarNota(propiedadId: string, notaId: string): Promise<void> {
  await deleteDoc(doc(db, COL, propiedadId, 'notas', notaId))
}

export async function updateServicioEstado(
  propiedadId: string,
  servicio: string,
  estado: { ultimoEstado: string; ultimaConsulta: string; monto?: number; vencimiento?: string },
): Promise<void> {
  await updateDoc(doc(db, COL, propiedadId), {
    [`servicios.${servicio}.ultimoEstado`]: estado.ultimoEstado,
    [`servicios.${servicio}.ultimaConsulta`]: estado.ultimaConsulta,
    ...(estado.monto !== undefined && {
      [`servicios.${servicio}.monto`]: estado.monto,
    }),
    ...(estado.vencimiento !== undefined && {
      [`servicios.${servicio}.vencimiento`]: estado.vencimiento,
    }),
  })
}
