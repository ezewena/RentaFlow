import { ScrapingResult, consultarEdesur } from './edesur'
import { consultarMetrogas } from './metrogas'
import { consultarAysa } from './aysa'

type ServicioKey = 'edesur' | 'edenor' | 'metrogas' | 'naturgy' | 'aysa' | 'aysam'

export async function consultarServicio(
  servicio: ServicioKey,
  numeroCliente: string,
): Promise<ScrapingResult> {
  switch (servicio) {
    case 'edesur':
    case 'edenor':
      return consultarEdesur(numeroCliente)
    case 'metrogas':
    case 'naturgy':
      return consultarMetrogas(numeroCliente)
    case 'aysa':
    case 'aysam':
      return consultarAysa(numeroCliente)
    default:
      return { estado: 'error' }
  }
}
