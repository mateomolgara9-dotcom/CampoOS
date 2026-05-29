'use client'
import { useState } from 'react'
import { PawPrint, Map, Antenna, Package, Wrench, Receipt,
         AlertTriangle, Activity, Cloud, Sun, CloudRain } from 'lucide-react'
import Topbar from '@/components/Topbar'
import KpiCard from '@/components/KpiCard'
import type { KPI } from '@/types'
import Link from 'next/link'

const kpis: KPI[] = [
  { label: 'Hacienda total',   value: '847',       sub: 'animales activos',     trend: '+12 vs mes anterior', trendUp: true,  accent: 'verde' },
  { label: 'Peso promedio',    value: '318 kg',     sub: 'última pesada 18/05',  trend: 'GDP +0.8 kg/día',     trendUp: true,  accent: 'verde' },
  { label: 'Lotes activos',    value: '14',         sub: 'de 18 lotes totales',  trend: '3 en barbecho',       trendUp: false, accent: 'ambar' },
  { label: 'Margen campaña',   value: 'USD 148',    sub: 'por hectárea acum.',   trend: '+18% vs campaña ant.',trendUp: true,  accent: 'azul'  },
]

const actividad = [
  { icon: Antenna,       color: 'bg-verde-s text-verde',      title: 'Pesada RFID completada — Manga Norte',      sub: '183 animales · promedio 312 kg · GDP +0.8 kg/día', time: 'hace 4 min' },
  { icon: AlertTriangle, color: 'bg-ambar-s text-ambar',      title: 'Alerta sanitaria — Vacuna aftosa vencida',  sub: 'Animales AR-1142 y AR-1143 · Acción requerida',    time: 'hace 1 h'   },
  { icon: Map,           color: 'bg-verde-s text-verde',      title: 'Aplicación herbicida — Lote 7 El Sauce',    sub: 'Glifosato 3 l/ha · 120 ha · Op: Miguel Ruiz',      time: 'hace 3 h'   },
  { icon: Package,       color: 'bg-azul-s text-azul',        title: 'Compra registrada — Semillas maíz DK7500',  sub: '450 kg · ARS 2.340.000 · Agroquímicos Sur',        time: 'ayer 16:30' },
  { icon: Wrench,        color: 'bg-rojo-s text-rojo',        title: 'Service pendiente — John Deere 6130J',      sub: 'Horómetro 2.850 h · Próximo service a 3.000 h',    time: 'ayer 09:00' },
]

const alertas = [
  { color: 'bg-rojo',  title: 'Vacuna aftosa vencida',  sub: 'Requiere acción inmediata', count: '2',  countClass: 'bg-rojo-s text-rojo' },
  { color: 'bg-ambar', title: 'Service de maquinaria',   sub: 'Próximos 150 hs de uso',   count: '1',  countClass: 'bg-ambar-s text-ambar' },
  { color: 'bg-ambar', title: 'Stock bajo — herbicida',  sub: 'Menos de 20% en depósito', count: '1',  countClass: 'bg-ambar-s text-ambar' },
  { color: 'bg-azul',  title: 'Lluvia prevista mañana',  sub: '12–18 mm · Revisar labores',count: '!', countClass: 'bg-azul-s text-azul' },
]

const modulos = [
  { href:'/animales',   icon: PawPrint,  label: 'Animales' },
  { href:'/iot',        icon: Antenna,   label: 'IoT RFID' },
  { href:'/lotes',      icon: Map,       label: 'Lotes'    },
  { href:'/inventario', icon: Package,   label: 'Inventario'},
  { href:'/maquinaria', icon: Wrench,    label: 'Maquinaria'},
  { href:'/ventas',     icon: Receipt,   label: 'Ventas'   },
]

export default function Dashboard() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Dashboard" />
      <div className="flex-1 overflow-y-auto p-5">

        {/* Page header */}
        <div className="flex items-end justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-carbon">Buenos días, Juan</h1>
            <p className="text-xs text-gris mt-0.5">Viernes 23 de mayo · Campaña 2025/26</p>
          </div>
          <div className="flex gap-2">
            <button className="text-xs font-medium px-3 py-1.5 rounded-lg border border-borde bg-white text-carbon hover:bg-tierra transition-colors">Exportar</button>
            <button className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-verde-act text-white hover:bg-verde transition-colors">+ Nueva tarea</button>
          </div>
        </div>

        {/* Alert banner */}
        <div className="bg-ambar-s border border-ambar rounded-xl p-3 flex items-center gap-3 mb-4">
          <AlertTriangle size={16} className="text-ambar flex-shrink-0"/>
          <p className="text-xs text-amber-800 flex-1">
            <span className="font-semibold">3 alertas requieren atención:</span> 2 animales con vacuna vencida · 1 máquina con service pendiente · lluvia prevista mañana
          </p>
          <button className="text-xs font-semibold text-ambar whitespace-nowrap hover:underline">Ver todas →</button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-2.5 mb-4">
          {kpis.map((kpi, i) => <KpiCard key={i} {...kpi} />)}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-[1fr_280px] gap-3">

          {/* Left */}
          <div className="flex flex-col gap-3">

            {/* Actividad */}
            <div className="bg-white border border-borde rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-borde">
                <h3 className="text-sm font-medium text-carbon flex items-center gap-1.5">
                  <Activity size={15} className="text-verde-act"/> Actividad reciente
                </h3>
                <button className="text-xs text-azul hover:underline">Ver historial</button>
              </div>
              <div className="divide-y divide-borde">
                {actividad.map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5 px-4 py-3">
                    <div className={"w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 " + item.color}>
                      <item.icon size={14}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-carbon truncate">{item.title}</p>
                      <p className="text-[11px] text-gris mt-0.5 truncate">{item.sub}</p>
                    </div>
                    <span className="text-[10px] text-gris whitespace-nowrap mt-0.5">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rodeo summary */}
            <div className="bg-white border border-borde rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-borde">
                <h3 className="text-sm font-medium text-carbon flex items-center gap-1.5">
                  <PawPrint size={15} className="text-verde-act"/> Composición del rodeo
                </h3>
                <Link href="/animales" className="text-xs text-azul hover:underline">Ver detalle →</Link>
              </div>
              <div className="p-4 flex gap-4 items-end">
                <div className="flex gap-1.5 items-end h-14 flex-1">
                  {[{l:'Vacas',v:342,h:'100%'},{l:'Terneros',v:198,h:'58%'},{l:'Vaquillonas',v:167,h:'49%'},{l:'Novillos',v:112,h:'33%'},{l:'Toros',v:28,h:'14%'}].map((b,i)=>(
                    <div key={i} className="flex flex-col items-center flex-1">
                      <div className={"w-full rounded-t-sm " + (i===0?"bg-verde-act":"bg-verde-s")} style={{height:b.h}}/>
                      <p className="text-[9px] text-gris mt-1 text-center leading-tight">{b.l}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-1.5 min-w-[120px]">
                  {[['Vacas','342'],['Terneros','198'],['Vaquillonas','167'],['Novillos','112'],['Toros','28']].map(([l,v])=>(
                    <div key={l} className="flex justify-between text-[11px]">
                      <span className="text-gris">{l}</span>
                      <span className="font-medium text-carbon">{v}</span>
                    </div>
                  ))}
                  <div className="border-t border-borde pt-1.5 flex justify-between text-[11px]">
                    <span className="font-medium text-carbon">Total</span>
                    <span className="font-semibold text-verde">847</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="flex flex-col gap-3">

            {/* Clima */}
            <div className="bg-white border border-borde rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-borde">
                <h3 className="text-sm font-medium text-carbon flex items-center gap-1.5">
                  <Cloud size={15} className="text-verde-act"/> Clima hoy
                </h3>
                <span className="text-[10px] text-gris">Villa María, CBA</span>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-3 pb-3 border-b border-borde mb-3">
                  <Sun size={36} className="text-ambar flex-shrink-0"/>
                  <div>
                    <div className="text-3xl font-light text-carbon">19°C</div>
                    <div className="text-xs text-gris">Parcialmente nublado</div>
                    <div className="text-[10px] text-gris">La Esperanza</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[['💧','Humedad 68%'],['💨','Viento 14 km/h'],['🌡️','Máx 23° Mín 9°'],['🌧️','Lluvia 0 mm']].map(([e,t])=>(
                    <div key={t} className="text-[11px] text-gris flex items-center gap-1">{e} {t}</div>
                  ))}
                </div>
                <div className="flex justify-between pt-2 border-t border-borde">
                  {[['Sáb','🌧️','15°'],['Dom','☁️','18°'],['Lun','☀️','22°'],['Mar','☀️','24°'],['Mié','🌧️','16°']].map(([d,i,t])=>(
                    <div key={d} className="text-center">
                      <div className="text-[10px] text-gris">{d}</div>
                      <div className="text-sm my-0.5">{i}</div>
                      <div className="text-[11px] font-medium text-carbon">{t}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Alertas */}
            <div className="bg-white border border-borde rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-borde">
                <h3 className="text-sm font-medium text-carbon">Alertas activas</h3>
                <button className="text-xs text-azul hover:underline">Ver todas</button>
              </div>
              <div className="divide-y divide-borde">
                {alertas.map((a,i)=>(
                  <div key={i} className="flex items-start gap-2 px-4 py-2.5">
                    <div className={"w-1.5 h-10 rounded-full flex-shrink-0 " + a.color}/>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-carbon">{a.title}</p>
                      <p className="text-[11px] text-gris">{a.sub}</p>
                    </div>
                    <span className={"text-[10px] font-bold px-1.5 py-0.5 rounded-full " + a.countClass}>{a.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Accesos rápidos */}
            <div className="bg-white border border-borde rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-borde">
                <h3 className="text-sm font-medium text-carbon">Accesos rápidos</h3>
              </div>
              <div className="p-3 grid grid-cols-3 gap-2">
                {modulos.map(m=>(
                  <Link key={m.href} href={m.href}
                    className="bg-tierra border border-borde rounded-lg p-2.5 text-center hover:bg-verde-s hover:border-verde-ac transition-all group">
                    <m.icon size={18} className="text-verde-act mx-auto mb-1 group-hover:text-verde"/>
                    <p className="text-[10px] font-medium text-carbon">{m.label}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
