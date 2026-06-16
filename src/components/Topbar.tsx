'use client'
import { Bell, Search, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useEstablecimiento } from '@/hooks/useEstablecimiento'

interface TopbarProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export default function Topbar({ title, subtitle, actions }: TopbarProps) {
  const router = useRouter()
  const { perfil, establecimiento, loading } = useEstablecimiento()

  const iniciales = perfil?.avatar_iniciales ?? '??'
  const nombreEst = establecimiento?.nombre ?? (loading ? '...' : 'Sin establecimiento')
  const infoEst = [establecimiento?.provincia, establecimiento?.superficie ? `${establecimiento.superficie.toLocaleString()} ha` : null]
    .filter(Boolean).join(' · ')

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div
      className="bg-white border-b border-borde h-[52px] flex items-center px-5 gap-3 flex-shrink-0"
      aria-label={subtitle ? `${title} — ${subtitle}` : title}
    >
      {/* Establecimiento */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-verde-ac flex-shrink-0" />
        <span className="text-sm font-medium text-carbon">{nombreEst}</span>
        {infoEst && (
          <span className="text-xs text-gris bg-tierra px-2 py-0.5 rounded-full">{infoEst}</span>
        )}
      </div>

      {/* Sync */}
      <span className="text-xs text-gris flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-verde-ac inline-block"/>
        Sincronizado
      </span>

      <div className="ml-auto flex items-center gap-2">
        {actions}
        <button
          className="w-8 h-8 rounded-lg border border-borde flex items-center justify-center text-gris hover:bg-tierra transition-colors relative"
          aria-label="Notificaciones"
        >
          <Bell size={15} />
          <span className="absolute -top-1 -right-1 bg-rojo text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-semibold">3</span>
        </button>
        <button
          className="w-8 h-8 rounded-lg border border-borde flex items-center justify-center text-gris hover:bg-tierra transition-colors"
          aria-label="Buscar"
        >
          <Search size={15} />
        </button>

        {/* Avatar con dropdown */}
        <div className="relative group">
          <button
            className="w-8 h-8 rounded-full bg-verde flex items-center justify-center text-white text-xs font-semibold"
            aria-label="Menú de usuario"
          >
            {iniciales}
          </button>
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-borde rounded-xl shadow-lg
            opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 overflow-hidden">
            {perfil?.nombre_completo && (
              <div className="px-3 py-2.5 border-b border-borde">
                <p className="text-xs font-semibold text-carbon truncate">{perfil.nombre_completo}</p>
                <p className="text-[10px] text-gris capitalize">{perfil.rol}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-carbon hover:bg-tierra transition-colors"
            >
              <LogOut size={13} className="text-gris"/>
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
