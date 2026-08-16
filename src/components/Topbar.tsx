'use client'
import { useState } from 'react'
import { Bell, Search, LogOut, ChevronDown, Check, MapPin } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useEstablecimiento, type Establecimiento } from '@/hooks/useEstablecimiento'

interface TopbarProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

function CampoRow({ campo, activo, onClick }: {
  campo: Establecimiento
  activo: boolean
  onClick: () => void
}) {
  const info = [campo.provincia, campo.superficie ? `${campo.superficie} ha` : null].filter(Boolean).join(' · ')
  return (
    <button onClick={onClick}
      className={'w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-tierra transition-colors ' + (activo ? 'bg-verde-s' : '')}>
      <MapPin size={13} className={activo ? 'text-verde-act' : 'text-gris'} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-carbon truncate">{campo.nombre}</p>
        {info && <p className="text-[10px] text-gris">{info}</p>}
      </div>
      {activo && <Check size={13} className="text-verde-act flex-shrink-0" />}
    </button>
  )
}

function SwitcherCampo() {
  const { establecimiento, productorActivo, productores, campos, cambiarCampo, loading } = useEstablecimiento()
  const [open, setOpen] = useState(false)

  const camposSinProductor = campos.filter(c => !c.productor_id)

  const label = loading
    ? '...'
    : establecimiento
      ? (productorActivo ? `${productorActivo.nombre} · ${establecimiento.nombre}` : establecimiento.nombre)
      : 'Sin campo'

  async function elegir(id: string) {
    setOpen(false)
    if (id !== establecimiento?.id) await cambiarCampo(id)
  }

  return (
    <div className="relative min-w-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 hover:bg-tierra rounded-lg px-2 py-1 transition-colors max-w-full"
        aria-label="Cambiar de campo"
      >
        <span className="w-2 h-2 rounded-full bg-verde-ac flex-shrink-0" />
        <span className="text-sm font-medium text-carbon max-w-[45vw] sm:max-w-[280px] truncate">{label}</span>
        <ChevronDown size={14} className="text-gris flex-shrink-0" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1.5 w-[min(18rem,90vw)] bg-white border border-borde rounded-xl shadow-lg z-50 overflow-hidden max-h-[70vh] overflow-y-auto">
            {campos.length === 0 && (
              <div className="px-3 py-3 text-xs text-gris">
                No hay campos todavía. Creá un productor y su campo en <strong>Productores</strong>.
              </div>
            )}

            {productores.map(prod => {
              const suyos = campos.filter(c => c.productor_id === prod.id)
              return (
                <div key={prod.id} className="border-b border-borde last:border-0">
                  <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gris">{prod.nombre}</div>
                  {suyos.length === 0 ? (
                    <div className="px-3 pb-2 text-[11px] text-gris italic">Sin campos</div>
                  ) : suyos.map(c => (
                    <CampoRow key={c.id} campo={c} activo={c.id === establecimiento?.id} onClick={() => elegir(c.id)} />
                  ))}
                </div>
              )
            })}

            {camposSinProductor.length > 0 && (
              <div className="border-b border-borde last:border-0">
                <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gris">Mi establecimiento</div>
                {camposSinProductor.map(c => (
                  <CampoRow key={c.id} campo={c} activo={c.id === establecimiento?.id} onClick={() => elegir(c.id)} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default function Topbar({ title, subtitle, actions }: TopbarProps) {
  const router = useRouter()
  const { perfil } = useEstablecimiento()
  const iniciales = perfil?.avatar_iniciales ?? '??'

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div
      className="bg-white border-b border-borde h-[52px] flex items-center px-3 sm:px-5 gap-2 sm:gap-3 flex-shrink-0"
      aria-label={subtitle ? `${title} — ${subtitle}` : title}
    >
      <SwitcherCampo />

      <span className="text-xs text-gris hidden md:flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-verde-ac inline-block" />
        Sincronizado
      </span>

      <div className="ml-auto flex items-center gap-2 flex-shrink-0">
        {actions}
        <button
          className="w-8 h-8 rounded-lg border border-borde hidden sm:flex items-center justify-center text-gris hover:bg-tierra transition-colors relative"
          aria-label="Notificaciones"
        >
          <Bell size={15} />
          <span className="absolute -top-1 -right-1 bg-rojo text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-semibold">3</span>
        </button>
        <button
          className="w-8 h-8 rounded-lg border border-borde hidden sm:flex items-center justify-center text-gris hover:bg-tierra transition-colors"
          aria-label="Buscar"
        >
          <Search size={15} />
        </button>

        <div className="relative group">
          <button
            className="w-8 h-8 rounded-full bg-verde flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
            aria-label="Menú de usuario"
          >
            {iniciales}
          </button>
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
              <LogOut size={13} className="text-gris" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
