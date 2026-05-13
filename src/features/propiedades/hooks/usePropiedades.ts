import { useEffect } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/shared/lib/firebase'
import { useAuth } from '@/features/auth/AuthContext'
import { usePropiedadesStore } from '@/app/store/propiedadesStore'
import { Propiedad } from '@/shared/lib/types'
import { Timestamp } from 'firebase/firestore'

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

export function usePropiedades() {
  const { user } = useAuth()
  const { propiedades, loading, error, setPropiedades, setLoading, setError } =
    usePropiedadesStore()

  useEffect(() => {
    if (!user?.uid) return

    setLoading(true)

    const q = query(
      collection(db, 'propiedades'),
      where('agentId', '==', user.uid),
    )

    // onSnapshot usa el caché local primero → respuesta inmediata,
    // luego sincroniza con el servidor en background
    const unsub = onSnapshot(
      q,
      (snap) => {
        setPropiedades(snap.docs.map((d) => toPropiedad(d.id, d.data() as Record<string, unknown>)))
        setLoading(false)
      },
      (err) => {
        console.error('Firestore onSnapshot error:', err.code, err.message)
        setError(err.message)
        setLoading(false)
      },
    )

    return unsub  // limpia el listener al desmontar o cuando cambia el uid
  }, [user?.uid])  // solo re-subscribe si cambia el UID, no el objeto User completo

  return { propiedades, loading, error }
}
