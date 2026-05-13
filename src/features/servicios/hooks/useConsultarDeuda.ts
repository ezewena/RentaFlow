import { useState } from 'react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/shared/lib/firebase'
import { updateServicioEstado } from '@/features/propiedades/services/propiedadesService'
import { usePropiedadesStore } from '@/app/store/propiedadesStore'
import { EstadoServicio } from '@/shared/lib/types'

interface ConsultaResult {
  estado: EstadoServicio
  monto?: number
  vencimiento?: string
}

export function useConsultarDeuda() {
  const [consultando, setConsultando] = useState<string | null>(null)
  const { upsertPropiedad, propiedades } = usePropiedadesStore()

  const consultarDeuda = async (
    propiedadId: string,
    servicio: string,
    numeroCliente: string,
  ) => {
    setConsultando(`${propiedadId}-${servicio}`)
    try {
      const fn = httpsCallable<
        { servicio: string; numeroCliente: string },
        ConsultaResult
      >(functions, 'consultarDeudaServicio')

      const result = await fn({ servicio, numeroCliente })
      const ahora = new Date().toISOString()

      await updateServicioEstado(propiedadId, servicio, {
        ultimoEstado: result.data.estado,
        ultimaConsulta: ahora,
        monto: result.data.monto,
        vencimiento: result.data.vencimiento,
      })

      const propiedad = propiedades.find((p) => p.id === propiedadId)
      if (propiedad) {
        upsertPropiedad({
          ...propiedad,
          servicios: {
            ...propiedad.servicios,
            [servicio]: {
              ...propiedad.servicios[servicio],
              ultimoEstado: result.data.estado,
              ultimaConsulta: ahora,
              monto: result.data.monto,
              vencimiento: result.data.vencimiento,
            },
          },
        })
      }

      return result.data
    } finally {
      setConsultando(null)
    }
  }

  return { consultarDeuda, consultando }
}
