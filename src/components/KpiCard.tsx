import { TrendingUp, TrendingDown } from 'lucide-react'
import clsx from 'clsx'
import type { KPI } from '@/types'

export default function KpiCard({ label, value, sub, trend, trendUp, accent }: KPI) {
  const accentColor = {
    verde: 'border-t-verde-ac',
    ambar: 'border-t-ambar',
    azul:  'border-t-azul',
    rojo:  'border-t-rojo',
  }[accent]

  return (
    <div className={clsx('bg-white border border-borde rounded-xl p-3.5 border-t-2', accentColor)}>
      <div className="text-[10px] text-gris mb-1.5 font-medium uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-semibold text-carbon leading-none mb-1">{value}</div>
      <div className="text-[10px] text-gris">{sub}</div>
      {trend && (
        <div className={clsx(
          'inline-flex items-center gap-1 text-[10px] font-semibold mt-1.5 px-1.5 py-0.5 rounded-full',
          trendUp ? 'bg-verde-s text-verde' : 'bg-rojo-s text-rojo'
        )}>
          {trendUp ? <TrendingUp size={10}/> : <TrendingDown size={10}/>}
          {trend}
        </div>
      )}
    </div>
  )
}
