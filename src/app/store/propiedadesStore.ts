import { create } from 'zustand'
import { Propiedad } from '@/shared/lib/types'

interface PropiedadesState {
  propiedades: Propiedad[]
  loading: boolean
  error: string | null
  setPropiedades: (p: Propiedad[]) => void
  setLoading: (v: boolean) => void
  setError: (e: string | null) => void
  upsertPropiedad: (p: Propiedad) => void
  removePropiedad: (id: string) => void
}

export const usePropiedadesStore = create<PropiedadesState>((set) => ({
  propiedades: [],
  loading: true,
  error: null,
  setPropiedades: (propiedades) => set({ propiedades }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  upsertPropiedad: (p) =>
    set((state) => {
      const idx = state.propiedades.findIndex((x) => x.id === p.id)
      if (idx >= 0) {
        const updated = [...state.propiedades]
        updated[idx] = p
        return { propiedades: updated }
      }
      return { propiedades: [...state.propiedades, p] }
    }),
  removePropiedad: (id) =>
    set((state) => ({
      propiedades: state.propiedades.filter((p) => p.id !== id),
    })),
}))
