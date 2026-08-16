'use client'
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import toast from 'react-hot-toast'

export type Rol = 'admin' | 'operario' | 'solo_lectura'

export type Perfil = {
  user_id: string
  establecimiento_id: string
  establecimiento_activo_id: string | null
  nombre_completo: string | null
  rol: Rol
  avatar_iniciales: string | null
}

export type Establecimiento = {
  id: string
  nombre: string
  provincia: string | null
  superficie: number | null
  productor_id: string | null
}

export type Productor = {
  id: string
  nombre: string
  razon_social: string | null
  cuit: string | null
  telefono: string | null
  email: string | null
  localidad: string | null
  provincia: string | null
}

type EstablecimientoContextValue = {
  userId: string | null
  userEmail: string | null
  perfil: Perfil | null
  /** El establecimiento ACTIVO (el que el switcher tiene seleccionado). */
  establecimiento: Establecimiento | null
  /** El productor dueño del campo activo (si el campo pertenece a uno). */
  productorActivo: Productor | null
  productores: Productor[]
  /** Todos los campos accesibles: mi establecimiento + los de mis productores. */
  campos: Establecimiento[]
  loading: boolean
  needsOnboarding: boolean
  cambiarCampo: (estId: string) => Promise<void>
  refrescar: () => Promise<void>
  /** null = mostrar todos los módulos. Array = solo esos (+ los fijos). Persiste en el navegador. */
  modulosVisibles: string[] | null
  setModulosVisibles: (keys: string[] | null) => void
}

const EstablecimientoContext = createContext<EstablecimientoContextValue | undefined>(undefined)

export function EstablecimientoProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [establecimiento, setEstablecimiento] = useState<Establecimiento | null>(null)
  const [productores, setProductores] = useState<Productor[]>([])
  const [campos, setCampos] = useState<Establecimiento[]>([])
  const [loading, setLoading] = useState(true)
  const [modulosVisibles, setMV] = useState<string[] | null>(null)

  const cargar = useCallback(async () => {
    const supabase = createClient()
    const { data: { user }, error: userErr } = await supabase.auth.getUser()
    if (userErr || !user) { setLoading(false); return }

    setUserId(user.id)
    setUserEmail(user.email ?? null)

    const { data: p, error: pErr } = await supabase
      .from('perfil_usuarios')
      .select('user_id, establecimiento_id, establecimiento_activo_id, nombre_completo, rol, avatar_iniciales')
      .eq('user_id', user.id)
      .maybeSingle()

    if (pErr) { console.error('[CampoOS] Error al cargar perfil:', pErr.message); setLoading(false); return }
    if (!p) { setPerfil(null); setLoading(false); return }  // → needsOnboarding
    setPerfil(p as Perfil)

    // Productores del asesor + campos accesibles (RLS ya filtra a lo que le corresponde)
    const [{ data: prods }, { data: ests }] = await Promise.all([
      supabase.from('productores')
        .select('id, nombre, razon_social, cuit, telefono, email, localidad, provincia')
        .order('nombre'),
      supabase.from('establecimientos')
        .select('id, nombre, provincia, superficie, productor_id')
        .order('nombre'),
    ])

    const camposList: Establecimiento[] = (ests ?? []).map(e => ({
      id: e.id as string,
      nombre: e.nombre as string,
      provincia: (e.provincia ?? null) as string | null,
      superficie: e.superficie != null ? Number(e.superficie) : null,
      productor_id: (e.productor_id ?? null) as string | null,
    }))

    setProductores((prods ?? []) as Productor[])
    setCampos(camposList)

    // Campo activo: el activo guardado (si sigue siendo accesible) o el del perfil
    const activoId = p.establecimiento_activo_id ?? p.establecimiento_id
    const activo =
      camposList.find(e => e.id === activoId) ??
      camposList.find(e => e.id === p.establecimiento_id) ??
      null
    setEstablecimiento(activo)
    setLoading(false)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false
    setLoading(true)
    cargar()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' && !cancelled) {
        setUserId(null); setUserEmail(null); setPerfil(null)
        setEstablecimiento(null); setProductores([]); setCampos([])
      }
    })

    return () => { cancelled = true; subscription.unsubscribe() }
  }, [cargar])

  const cambiarCampo = useCallback(async (estId: string) => {
    if (!userId) return
    const target = campos.find(c => c.id === estId)
    if (!target) { toast.error('No tenés acceso a ese campo'); return }

    const supabase = createClient()
    const { error } = await supabase
      .from('perfil_usuarios')
      .update({ establecimiento_activo_id: estId })
      .eq('user_id', userId)

    if (error) {
      console.error('[CampoOS] Error al cambiar de campo:', error.message)
      toast.error('No se pudo cambiar de campo')
      return
    }

    setPerfil(prev => (prev ? { ...prev, establecimiento_activo_id: estId } : prev))
    setEstablecimiento(target)
  }, [userId, campos])

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('campoos_modulos_visibles') : null
      if (raw) setMV(JSON.parse(raw) as string[])
    } catch { /* ignore */ }
  }, [])

  const setModulosVisibles = useCallback((keys: string[] | null) => {
    setMV(keys)
    try {
      if (keys === null) localStorage.removeItem('campoos_modulos_visibles')
      else localStorage.setItem('campoos_modulos_visibles', JSON.stringify(keys))
    } catch { /* ignore */ }
  }, [])

  const productorActivo = establecimiento?.productor_id
    ? productores.find(p => p.id === establecimiento.productor_id) ?? null
    : null

  const needsOnboarding = !loading && userId !== null && perfil === null

  const value: EstablecimientoContextValue = {
    userId, userEmail, perfil, establecimiento, productorActivo,
    productores, campos, loading, needsOnboarding, cambiarCampo, refrescar: cargar,
    modulosVisibles, setModulosVisibles,
  }

  return <EstablecimientoContext.Provider value={value}>{children}</EstablecimientoContext.Provider>
}

export function useEstablecimientoContext() {
  const ctx = useContext(EstablecimientoContext)
  if (ctx === undefined) {
    throw new Error('useEstablecimiento debe usarse dentro de <EstablecimientoProvider>')
  }
  return ctx
}
