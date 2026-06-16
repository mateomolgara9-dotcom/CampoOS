'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

export type Perfil = {
  user_id: string
  establecimiento_id: string
  nombre_completo: string | null
  rol: 'admin' | 'operario' | 'solo_lectura'
  avatar_iniciales: string | null
}

export type Establecimiento = {
  id: string
  nombre: string
  provincia: string | null
  superficie: number | null
}

type Result = {
  userId: string | null
  userEmail: string | null
  perfil: Perfil | null
  establecimiento: Establecimiento | null
  loading: boolean
}

export function useEstablecimiento(): Result {
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [establecimiento, setEstablecimiento] = useState<Establecimiento | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    async function load() {
      // getUser() valida el JWT con el servidor — más confiable que getSession()
      const { data: { user }, error: userErr } = await supabase.auth.getUser()
      if (cancelled) return

      if (userErr || !user) {
        setLoading(false)
        return
      }

      setUserId(user.id)
      setUserEmail(user.email ?? null)

      const { data: p, error: pErr } = await supabase
        .from('perfil_usuarios')
        .select('user_id, establecimiento_id, nombre_completo, rol, avatar_iniciales')
        .eq('user_id', user.id)
        .single()

      if (cancelled) return

      if (pErr) {
        console.error('[CampoOS] Error al cargar perfil:', pErr.message)
        setLoading(false)
        return
      }
      if (!p) {
        setLoading(false)
        return
      }

      setPerfil(p)

      const { data: e, error: eErr } = await supabase
        .from('establecimientos')
        .select('id, nombre, provincia, superficie')
        .eq('id', p.establecimiento_id)
        .single()

      if (cancelled) return

      if (eErr) {
        console.error('[CampoOS] Error al cargar establecimiento:', eErr.message)
      } else if (e) {
        setEstablecimiento(e)
      }

      setLoading(false)
    }

    load()

    // Solo escucha logout: el componente se remonta en cada navegación (flujo normal)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' && !cancelled) {
        setUserId(null)
        setUserEmail(null)
        setPerfil(null)
        setEstablecimiento(null)
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  return { userId, userEmail, perfil, establecimiento, loading }
}
