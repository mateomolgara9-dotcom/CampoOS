'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase'

function generarIniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/)
  if (partes.length >= 2) {
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
  }
  return nombre.slice(0, 2).toUpperCase()
}

export default function Register() {
  const router = useRouter()

  const [nombreCompleto, setNombreCompleto] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [nombreEstablecimiento, setNombreEstablecimiento] = useState('')
  const [provincia, setProvincia] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmacion, setConfirmacion] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!nombreCompleto.trim() || !email.trim() || !password || !nombreEstablecimiento.trim()) {
      setError('Completá todos los campos obligatorios.')
      return
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (nombreEstablecimiento.trim().length > 100) {
      setError('El nombre del establecimiento no puede superar los 100 caracteres.')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()

      // ── Paso 1: Crear usuario ─────────────────────────────────────────────────
      console.log('[Register] Paso 1: signUp para', email.trim())
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      })

      if (authError) {
        console.error('[Register] signUp error:', authError.message, authError.status)
        setError('No se pudo crear la cuenta. Verificá que el email no esté en uso.')
        return
      }

      const user = authData.user
      const session = authData.session
      console.log('[Register] signUp ok — userId:', user?.id, '| hasSession:', !!session)

      // Sin sesión = email confirmation requerida → no podemos hacer INSERTs
      if (!user || !session) {
        console.log('[Register] Sin sesión — email confirmation requerida')
        setConfirmacion(true)
        return
      }

      // ── Paso 2: Crear establecimiento ─────────────────────────────────────────
      // UUID generado en cliente: evita .select() en el INSERT para no disparar
      // la política SELECT (ver_mi_establecimiento) sobre una fila sin perfil_usuarios,
      // lo que causaría que PostgREST haga rollback con 403.
      console.log('[Register] Paso 2: creando establecimiento...')
      const estId = crypto.randomUUID()
      const { error: estError } = await supabase
        .from('establecimientos')
        .insert({ id: estId, nombre: nombreEstablecimiento.trim(), provincia: provincia.trim() || null })

      if (estError) {
        console.error('[Register] Error al crear establecimiento:', estError.message, '| code:', estError.code)
        setError('Error al crear el establecimiento. Revisá la consola para más detalles.')
        return
      }
      console.log('[Register] Establecimiento creado — id:', estId)

      // ── Paso 3: Crear perfil de usuario ───────────────────────────────────────
      console.log('[Register] Paso 3: creando perfil_usuarios...')
      const iniciales = generarIniciales(nombreCompleto)
      const { error: perfilError } = await supabase
        .from('perfil_usuarios')
        .insert({
          user_id: user.id,
          establecimiento_id: estId,
          nombre_completo: nombreCompleto.trim(),
          rol: 'admin',
          avatar_iniciales: iniciales,
        })

      if (perfilError) {
        console.error('[Register] Error al crear perfil:', perfilError.message, '| code:', perfilError.code)
        // Rollback best-effort (puede fallar si no hay política DELETE)
        const { error: delErr } = await supabase.from('establecimientos').delete().eq('id', estId)
        if (delErr) console.warn('[Register] No se pudo hacer rollback del establecimiento:', delErr.message)
        else console.log('[Register] Rollback del establecimiento ok')
        setError('Error al configurar el perfil. Intentá de nuevo.')
        return
      }

      console.log('[Register] ✓ Registro completo — redirigiendo a /dashboard')
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      console.error('[Register] Error inesperado:', err)
      setError('Error inesperado. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (confirmacion) {
    return (
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl border border-borde shadow-sm p-8 text-center">
          <div className="w-12 h-12 bg-verde/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
              <path d="M20 6L9 17l-5-5" stroke="#1A5C2A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="text-base font-semibold text-carbon mb-2">Revisá tu email</h2>
          <p className="text-sm text-gris">
            Te enviamos un link de confirmación a{' '}
            <strong className="text-carbon">{email}</strong>.
            Hacé clic en el link para activar tu cuenta y luego completá la configuración desde{' '}
            <Link href="/onboarding" className="text-verde font-medium hover:underline">acá</Link>.
          </p>
          <Link href="/login" className="inline-block mt-6 text-sm text-verde font-medium hover:underline">
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    )
  }

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
        <h2 className="text-base font-semibold text-carbon mb-5">Crear cuenta</h2>

        {error && (
          <div role="alert" className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gris">Tu cuenta</p>

          <div>
            <label className="block text-xs font-medium text-carbon mb-1.5" htmlFor="nombre">
              Nombre completo <span className="text-rojo">*</span>
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
            <label className="block text-xs font-medium text-carbon mb-1.5" htmlFor="email">
              Email <span className="text-rojo">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              autoComplete="email"
              className="w-full text-sm border border-borde rounded-lg px-3 py-2 outline-none focus:border-verde focus:ring-1 focus:ring-verde/20 transition-colors bg-white text-carbon placeholder:text-gris"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-carbon mb-1.5" htmlFor="password">
              Contraseña <span className="text-rojo">*</span>
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                className="w-full text-sm border border-borde rounded-lg px-3 py-2 pr-9 outline-none focus:border-verde focus:ring-1 focus:ring-verde/20 transition-colors bg-white text-carbon placeholder:text-gris"
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gris hover:text-carbon"
                aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
              </button>
            </div>
          </div>

          <p className="text-[10px] font-semibold uppercase tracking-wider text-gris pt-2">Tu establecimiento</p>

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
            disabled={loading}
            className="w-full bg-verde text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-verde-act transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-1"
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>
      </div>

      <p className="text-center text-xs text-gris mt-4">
        ¿Ya tenés cuenta?{' '}
        <Link href="/login" className="text-verde font-medium hover:underline">
          Iniciar sesión
        </Link>
      </p>
    </div>
  )
}
