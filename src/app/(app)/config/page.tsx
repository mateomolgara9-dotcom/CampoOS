'use client'
import clsx from 'clsx'
import Topbar from '@/components/Topbar'
import { MODULOS_TOGGLE, type GrupoModulo } from '@/lib/modulos'
import { useEstablecimiento } from '@/hooks/useEstablecimiento'

const GRUPOS: GrupoModulo[] = ['Asesor', 'Producción', 'Comercial']

export default function ConfigPage() {
  const { modulosVisibles, setModulosVisibles } = useEstablecimiento()

  const isOn = (href: string) => modulosVisibles === null || modulosVisibles.includes(href)

  function toggle(href: string) {
    const base = modulosVisibles === null ? MODULOS_TOGGLE.map(m => m.href) : [...modulosVisibles]
    const next = base.includes(href) ? base.filter(h => h !== href) : [...base, href]
    setModulosVisibles(next)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Configuración" />
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl space-y-4">
          <div className="bg-white border border-borde rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-borde flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-carbon">Módulos visibles</h3>
                <p className="text-[11px] text-gris">Prendé solo los que usás. Se aplica a la barra lateral (Inicio y Configuración siempre quedan).</p>
              </div>
              <button onClick={() => setModulosVisibles(null)}
                className="text-[11px] font-medium text-verde-act hover:text-verde whitespace-nowrap">
                Mostrar todos
              </button>
            </div>
            <div className="p-4 space-y-5">
              {GRUPOS.map(g => (
                <div key={g}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-2">{g}</p>
                  <div className="space-y-1.5">
                    {MODULOS_TOGGLE.filter(m => m.grupo === g).map(m => {
                      const Icon = m.icon
                      const on = isOn(m.href)
                      return (
                        <button key={m.href} onClick={() => toggle(m.href)}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg border border-borde hover:bg-tierra transition-colors">
                          <Icon size={16} className={on ? 'text-verde-act' : 'text-gris'} />
                          <span className="text-xs text-carbon flex-1 text-left">{m.label}</span>
                          <span className={clsx('w-9 h-5 rounded-full relative transition-colors flex-shrink-0', on ? 'bg-verde-act' : 'bg-borde')}>
                            <span className={clsx('absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all', on ? 'left-[18px]' : 'left-0.5')} />
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-gris px-1">
            La preferencia se guarda en este navegador. Más adelante la podemos hacer por campo o por cuenta si lo necesitás.
          </p>
        </div>
      </div>
    </div>
  )
}
