'use client'
import { Fragment } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import clsx from 'clsx'
import { MODULOS, moduloVisible } from '@/lib/modulos'
import { useEstablecimiento } from '@/hooks/useEstablecimiento'

export default function Sidebar() {
  const path = usePathname()
  const { modulosVisibles } = useEstablecimiento()

  const NavItem = ({ href, icon: Icon, label }: { href: string; icon: LucideIcon; label: string }) => {
    const active = path.startsWith(href)
    return (
      <Link href={href} title={label}
        className={clsx(
          'w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150 group relative',
          active
            ? 'bg-verde-ac text-verde'
            : 'text-white/40 hover:bg-white/10 hover:text-white'
        )}>
        <Icon size={18} />
        <span className="absolute left-12 bg-carbon text-white text-xs font-medium px-2 py-1 rounded-md whitespace-nowrap
          opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
          {label}
        </span>
      </Link>
    )
  }

  const visibles = MODULOS.filter(m => moduloVisible(m.href, modulosVisibles, m.fijo))
  const config = visibles.find(m => m.href === '/config')
  const flow = visibles.filter(m => m.href !== '/config')

  return (
    <div className="w-14 bg-verde flex flex-col items-center py-3 gap-1 flex-shrink-0 h-screen sticky top-0">
      <Link href="/dashboard" className="w-9 h-9 bg-verde-act rounded-lg flex items-center justify-center mb-3">
        <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
          <rect x="2" y="13" width="20" height="9" rx="2" fill="rgba(255,255,255,0.3)"/>
          <polygon points="12,3 22,13 2,13" fill="white"/>
          <rect x="9" y="16" width="6" height="6" rx="1" fill="#1A5C2A"/>
        </svg>
      </Link>

      {flow.map((m, i) => {
        const divider = i > 0 && flow[i - 1].grupo !== m.grupo
        return (
          <Fragment key={m.href}>
            {divider && <div className="w-7 h-px bg-white/10 my-2" />}
            <NavItem href={m.href} icon={m.icon} label={m.label} />
          </Fragment>
        )
      })}

      {config && (
        <div className="mt-auto">
          <div className="w-7 h-px bg-white/10 mb-2" />
          <NavItem href={config.href} icon={config.icon} label={config.label} />
        </div>
      )}
    </div>
  )
}
