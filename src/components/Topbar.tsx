'use client'
import { Bell, Search } from 'lucide-react'

interface TopbarProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export default function Topbar({ title, subtitle, actions }: TopbarProps) {
  return (
    <div className="bg-white border-b border-borde h-[52px] flex items-center px-5 gap-3 flex-shrink-0">
      {/* Establecimiento */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-verde-ac" />
        <span className="text-sm font-medium text-carbon">La Esperanza</span>
        <span className="text-xs text-gris bg-tierra px-2 py-0.5 rounded-full">Córdoba · 1.240 ha</span>
      </div>

      {/* Sync */}
      <span className="text-xs text-gris flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-verde-ac inline-block"/>
        Sincronizado
      </span>

      <div className="ml-auto flex items-center gap-2">
        {actions}
        <button className="w-8 h-8 rounded-lg border border-borde flex items-center justify-center text-gris hover:bg-tierra transition-colors relative">
          <Bell size={15} />
          <span className="absolute -top-1 -right-1 bg-rojo text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-semibold">3</span>
        </button>
        <button className="w-8 h-8 rounded-lg border border-borde flex items-center justify-center text-gris hover:bg-tierra transition-colors">
          <Search size={15} />
        </button>
        <div className="w-8 h-8 rounded-full bg-verde flex items-center justify-center text-white text-xs font-semibold cursor-pointer">
          JG
        </div>
      </div>
    </div>
  )
}
