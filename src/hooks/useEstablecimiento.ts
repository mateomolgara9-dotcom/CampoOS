'use client'
import { useEstablecimientoContext } from '@/context/EstablecimientoProvider'

export type { Perfil, Establecimiento, Productor, Rol } from '@/context/EstablecimientoProvider'

/**
 * Contexto multi-tenant de CampoOS. Devuelve el establecimiento ACTIVO
 * (el que el switcher tiene seleccionado) y, para el asesor, la lista de
 * productores/campos y la función para cambiar de campo.
 *
 * Mantiene el mismo contrato que la versión anterior (userId, userEmail,
 * perfil, establecimiento, loading, needsOnboarding), así que los módulos
 * existentes siguen funcionando sin cambios.
 */
export function useEstablecimiento() {
  return useEstablecimientoContext()
}
