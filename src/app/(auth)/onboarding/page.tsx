'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

function generarIniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/)
  if (partes.length >= 2) {
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
  }
  return nombre.slice(0, 2).toUpperCase()
}

export default function Onboarding() {
  const router = useRouter()
  // Un único cliente compartido entre verificación y submit
  const supabaseRef = useRef<SupabaseClient | null>(null)

  const [userId, setUserId] = useState<string | null>(null)
  const [checkingState, setCheckingState] = useState(true)
  const [nombreCompleto, setNombreCompleto] = useState('')
  const [nombreEstablecimiento, setNombreEstablecimiento] = useState('')
  const [provincia, setProvincia] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabaseRef.current = createClient()
    const supabase = supabaseRef.current
    let cancelled = false

    async function verificarEstado() {
      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled) return
      if (!user) { router.replace('/login'); return }

      // Si ya tiene perfil, no debería estar acá
      const { data: perfil } = await supabase
        .from('perfil_usuarios')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (cancelled) return
      if (perfil) { router.replace('/dashboard'); return }

      setUserId(user.id)
      setCheckingState(false)
    }

    verificarEstado()
    return () => { cancelled = true }
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!userId) return
    if (!nombreCompleto.trim() || !nombreEstablecimiento.trim()) {
      setError('Completá todos los campos obligatorios.')
      return
    }
    if (nombreEstablecimiento.trim().length > 100) {
      setError('El nombre del establecimiento no puede superar los 100 caracteres.')
      return
    }

    setSubmitting(true)
    try {
      const supabase = supabaseRef.current ?? createClient()

      // Verificar sesión activa antes de cualquier INSERT
      const { data: { session } } = await supabase.auth.getSession()
      console.log('[Onboarding] Sesión al hacer submit:', {
        userId: session?.user?.id ?? null,
        hasAccessToken: !!session?.access_token,
        tokenExpiry: session?.expires_at ?? null,
      })
      if (!session) {
        console.error('[Onboarding] Sin sesión activa — redirigiendo a login')
        router.replace('/login?next=/onboarding')
        return
      }

      // Paso 1: crear establecimiento
      // Generamos el UUID en el cliente para evitar usar .select() en el INSERT.
      // Si usáramos .insert().select('id'), PostgREST evaluaría las políticas SELECT
      // (ver_mi_establecimiento) sobre la fila recién creada, fallaría (perfil_usuarios
      // aún no existe) y haría rollback del INSERT completo con error 403.
      const estId = crypto.randomUUID()
      const { error: estError } = await supabase
        .from('establecimientos')
        .insert({ id: estId, nombre: nombreEstablecimiento.trim(), provincia: provincia.trim() || null })

      if (estError) {
        console.error('[Onboarding] Error al crear establecimiento:', estError.message, '| code:', estError.code)
        setError('Error al crear el establecimiento. Intentá de nuevo.')
        return
      }
      console.log('[Onboarding] Establecimiento creado — id:', estId)

      // Paso 2: crear perfil
      const { error: perfilError } = await supabase
        .from('perfil_usuarios')
        .insert({
          user_id: userId,
          establecimiento_id: estId,
          nombre_completo: nombreCompleto.trim(),
          rol: 'admin',
          avatar_iniciales: generarIniciales(nombreCompleto),
        })

      if (perfilError) {
        console.error('[Onboarding] Error al crear perfil:', perfilError.message, '| code:', perfilError.code)
        // Rollback best-effort (puede fallar si no hay política DELETE)
        await supabase.from('establecimientos').delete().eq('id', estId)
        setError('Error al configurar el perfil. Intentá de nuevo.')
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      console.error('[Onboarding] Error inesperado:', err)
      setError('Error inesperado. Intentá de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  if (checkingState) return null

  return (
    <div className="w-full max-w-sm">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 bg-verde rounded-xl flex items-center justify-center mb-3 shadow-sm">
          <svg viewBox="0 0 24 24" fill="none" width="26" height="26">
            <rect x="2" y="13" width="20" height="9" rx="2" fill="rgba(255,255,255,0.3)"/>
            <polygon points="12,3 22,13 2,13" fill="white"/>
            <rect x="9" y="16" width="6" height="6" rx="1" fill="#1A5C2A"/>
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-carbon">CampoOS</h1>
        <p className="text-sm text-gris mt-0.5">Gestión agropecuaria</p>
      </div>

      <div className="bg-white rounded-2xl border border-borde shadow-sm p-6">
        <h2 className="text-base font-semibold text-carbon mb-1">Completar configuración</h2>
        <p className="text-xs text-gris mb-5">
          Tu cuenta fue creada pero le falta la configuración inicial.
          Completá estos datos para acceder al sistema.
        </p>

        {error && (
          <div role="alert" className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-carbon mb-1.5" htmlFor="nombre">
              Tu nombre completo <span className="text-rojo">*</span>
            </label>
            <input
              id="nombre"
              type="text"
              value={nombreCompleto}
              onChange={e => setNombreCompleto(e.target.value)}
              placeholder="Juan García"
              autoComplete="name"
              maxLength={100}
              className="w-full text-sm border border-borde rounded-lg px-3 py-2 outline-none focus:border-verde focus:ring-1 focus:ring-verde/20 transition-colors bg-white text-carbon placeholder:text-gris"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-carbon mb-1.5" htmlFor="est-nombre">
              Nombre del campo <span className="text-rojo">*</span>
            </label>
            <input
              id="est-nombre"
              type="text"
              value={nombreEstablecimiento}
              onChange={e => setNombreEstablecimiento(e.target.value)}
              placeholder="La Esperanza"
              maxLength={100}
              className="w-full text-sm border border-borde rounded-lg px-3 py-2 outline-none focus:border-verde focus:ring-1 focus:ring-verde/20 transition-colors bg-white text-carbon placeholder:text-gris"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-carbon mb-1.5" htmlFor="provincia">
              Provincia
            </label>
            <input
              id="provincia"
              type="text"
              value={provincia}
              onChange={e => setProvincia(e.target.value)}
              placeholder="Córdoba"
              maxLength={50}
              className="w-full text-sm border border-borde rounded-lg px-3 py-2 outline-none focus:border-verde focus:ring-1 focus:ring-verde/20 transition-colors bg-white text-carbon placeholder:text-gris"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-verde text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-verde-act transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-1"
          >
            {submitting ? 'Guardando...' : 'Completar configuración'}
          </button>
        </form>
      </div>
    </div>
  )
}
