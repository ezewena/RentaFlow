import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PropiedadWizard } from '@/features/propiedades/components/PropiedadWizard'

export function NuevaPropiedadPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/propiedades"
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva propiedad</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Completá los datos en 3 pasos
          </p>
        </div>
      </div>
      <PropiedadWizard />
    </div>
  )
}
