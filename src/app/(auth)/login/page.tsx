'use client'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = searchParams.get('next') ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!email.trim() || !password) {
      setError('Completá todos los campos.')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (authError) {
        setError('Email o contraseña incorrectos.')
        return
      }
      router.push(nextPath)
      router.refresh()
    } catch {
      setError('Error al iniciar sesión. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
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

      {/* Card */}
      <div className="bg-white rounded-2xl border border-borde shadow-sm p-6">
        <h2 className="text-base font-semibold text-carbon mb-5">Ingresá a tu cuenta</h2>

        {error && (
          <div role="alert" className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-carbon mb-1.5" htmlFor="email">
              Email
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
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-verde text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-verde-act transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-1"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>

      <p className="text-center text-xs text-gris mt-4">
        ¿No tenés cuenta?{' '}
        <Link href="/register" className="text-verde font-medium hover:underline">
          Crear cuenta
        </Link>
      </p>
    </div>
  )
}

export default function Login() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
