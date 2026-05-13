import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { PrivateRoute } from './PrivateRoute'
import { AdminRoute } from './AdminRoute'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { PropiedadesPage } from '@/pages/PropiedadesPage'
import { PropiedadDetailPage } from '@/pages/PropiedadDetailPage'
import { NuevaPropiedadPage } from '@/pages/NuevaPropiedadPage'
import { EditarPropiedadPage } from '@/pages/EditarPropiedadPage'
import { AdminPage } from '@/pages/AdminPage'
import { Layout } from '@/shared/components/Layout'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Públicas */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Privadas — agentes aprobados */}
        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/propiedades" element={<PropiedadesPage />} />
            <Route path="/propiedades/nueva" element={<NuevaPropiedadPage />} />
            <Route path="/propiedades/:id" element={<PropiedadDetailPage />} />
            <Route path="/propiedades/:id/editar" element={<EditarPropiedadPage />} />
          </Route>
        </Route>

        {/* Admin */}
        <Route element={<AdminRoute />}>
          <Route element={<Layout />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
