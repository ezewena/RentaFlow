import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getPropiedad } from '@/features/propiedades/services/propiedadesService'
import { PropiedadWizard } from '@/features/propiedades/components/PropiedadWizard'
import { Propiedad } from '@/shared/lib/types'

export function EditarPropiedadPage() {
  const { id } = useParams<{ id: string }>()
  const [propiedad, setPropiedad] = useState<Propiedad | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    getPropiedad(id)
      .then(setPropiedad)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to={`/propiedades/${id}`}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar propiedad</h1>
          {propiedad && (
            <p className="text-gray-500 text-sm mt-0.5">{propiedad.nombre}</p>
          )}
        </div>
      </div>
      {propiedad && <PropiedadWizard propiedad={propiedad} />}
    </div>
  )
}
