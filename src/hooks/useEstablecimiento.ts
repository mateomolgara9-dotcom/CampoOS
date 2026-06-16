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

    async function loadData(uid: string, email: string | null) {
      setUserId(uid)
      setUserEmail(email ?? null)

      const { data: p } = await supabase
        .from('perfil_usuarios')
        .select('user_id, establecimiento_id, nombre_completo, rol, avatar_iniciales')
        .eq('user_id', uid)
        .single()

      if (!p) { setLoading(false); return }
      setPerfil(p)

      const { data: e } = await supabase
        .from('establecimientos')
        .select('id, nombre, provincia, superficie')
        .eq('id', p.establecimiento_id)
        .single()

      if (e) setEstablecimiento(e)
      setLoading(false)
    }

    function clear() {
      setUserId(null); setUserEmail(null)
      setPerfil(null); setEstablecimiento(null)
      setLoading(false)
    }

    // Carga inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) loadData(session.user.id, session.user.email ?? null)
      else clear()
    })

    // Reactivo ante cambios de sesión (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) loadData(session.user.id, session.user.email ?? null)
      else clear()
    })

    return () => subscription.unsubscribe()
  }, [])

  return { userId, userEmail, perfil, establecimiento, loading }
}
