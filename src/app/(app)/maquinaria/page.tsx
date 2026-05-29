'use client'
import { useState } from 'react'
import { Search, Plus, Wrench, Fuel, AlertTriangle, X, Calendar, Activity, Settings, TrendingUp } from 'lucide-react'
import Topbar from '@/components/Topbar'

// ── Tipos ─────────────────────────────────────────────────────────────────────
type TipoMaquina = 'Tractor' | 'Cosechadora' | 'Sembradora' | 'Pulverizadora' | 'Implemento' | 'Camion' | 'Otro'
type EstadoMaquina = 'Operativa' | 'En mantenimiento' | 'Fuera de servicio'

type Mantenimiento = {
  id: string
  fecha: string
  tipo: 'Preventivo' | 'Correctivo' | 'Service' | 'Reparacion'
  detalle: string
  horometro: number
  costo: number
  operario: string
}

type CargaCombustible = {
  fecha: string
  litros: number
  horometro: number
  costo: number
}

type Maquina = {
  id: string
  nombre: string
  tipo: TipoMaquina
  marca: string
  modelo: string
  ano: number
  patente?: string
  horometro: number
  horometro_proximo_service: number
  estado: EstadoMaquina
  combustible_actual?: number
  capacidad_tanque?: number
  consumo_promedio?: number
  ultimo_service?: string
  mantenimientos: Mantenimiento[]
  cargas_combustible: CargaCombustible[]
  observaciones?: string
}

// ── Datos de ejemplo ──────────────────────────────────────────────────────────
const MAQUINAS: Maquina[] = [
  {
    id:'1', nombre:'JD 6130J', tipo:'Tractor', marca:'John Deere', modelo:'6130J',
    ano:2019, patente:'TR-AAA-001', horometro:2850, horometro_proximo_service:3000,
    estado:'Operativa', combustible_actual:240, capacidad_tanque:340, consumo_promedio:12,
    ultimo_service:'2026-02-15',
    mantenimientos:[
      { id:'m1', fecha:'2026-02-15', tipo:'Service',     detalle:'Cambio de aceite, filtros y revisión general', horometro:2700, costo:850,  operario:'Taller Garcia' },
      { id:'m2', fecha:'2025-10-20', tipo:'Reparacion',  detalle:'Reparación de bomba hidráulica',               horometro:2350, costo:1200, operario:'Taller Garcia' },
      { id:'m3', fecha:'2025-08-05', tipo:'Service',     detalle:'Service 2400 hs — Cambio aceite + filtros',    horometro:2400, costo:780,  operario:'Taller Garcia' },
    ],
    cargas_combustible:[
      { fecha:'2026-05-20', litros:280, horometro:2845, costo:294 },
      { fecha:'2026-05-10', litros:300, horometro:2810, costo:315 },
      { fecha:'2026-04-28', litros:285, horometro:2768, costo:299 },
    ],
  },
  {
    id:'2', nombre:'JD 7230J', tipo:'Tractor', marca:'John Deere', modelo:'7230J Premium',
    ano:2021, patente:'TR-AAA-002', horometro:1450, horometro_proximo_service:1500,
    estado:'Operativa', combustible_actual:90, capacidad_tanque:420, consumo_promedio:15,
    ultimo_service:'2026-03-10',
    mantenimientos:[
      { id:'m4', fecha:'2026-03-10', tipo:'Service', detalle:'Service rutinario 1200 hs', horometro:1200, costo:920, operario:'Concesionario JD' },
    ],
    cargas_combustible:[
      { fecha:'2026-05-22', litros:330, horometro:1445, costo:347 },
      { fecha:'2026-05-08', litros:350, horometro:1402, costo:368 },
    ],
  },
  {
    id:'3', nombre:'Case IH 8230', tipo:'Cosechadora', marca:'Case IH', modelo:'Axial-Flow 8230',
    ano:2020, patente:'CO-BBB-003', horometro:1820, horometro_proximo_service:2000,
    estado:'Operativa', combustible_actual:550, capacidad_tanque:680, consumo_promedio:35,
    ultimo_service:'2025-12-15',
    mantenimientos:[
      { id:'m5', fecha:'2025-12-15', tipo:'Service',     detalle:'Service pre-cosecha completo',     horometro:1700, costo:2450, operario:'Concesionario Case' },
      { id:'m6', fecha:'2025-11-10', tipo:'Preventivo',  detalle:'Cambio cuchillas + lubricación',   horometro:1620, costo:680,  operario:'Taller Garcia' },
    ],
    cargas_combustible:[
      { fecha:'2026-04-15', litros:620, horometro:1810, costo:651 },
      { fecha:'2026-04-05', litros:650, horometro:1772, costo:683 },
    ],
  },
  {
    id:'4', nombre:'Apache 24000', tipo:'Sembradora', marca:'Apache', modelo:'27500 Air Drill',
    ano:2022, horometro:480, horometro_proximo_service:600,
    estado:'Operativa',
    ultimo_service:'2026-01-20',
    mantenimientos:[
      { id:'m7', fecha:'2026-01-20', tipo:'Service', detalle:'Service post-siembra + revisión completa', horometro:400, costo:1100, operario:'Apache servicio' },
    ],
    cargas_combustible:[],
  },
  {
    id:'5', nombre:'Pla MAP 3000', tipo:'Pulverizadora', marca:'Pla', modelo:'MAP 3000',
    ano:2018, patente:'PU-CCC-005', horometro:3650, horometro_proximo_service:3700,
    estado:'En mantenimiento', combustible_actual:120, capacidad_tanque:280, consumo_promedio:18,
    ultimo_service:'2025-11-20',
    mantenimientos:[
      { id:'m8', fecha:'2026-05-15', tipo:'Reparacion', detalle:'Reparación bomba de pulverización (en taller)', horometro:3640, costo:0, operario:'Taller especialista' },
      { id:'m9', fecha:'2025-11-20', tipo:'Service',    detalle:'Service general',                               horometro:3400, costo:1450, operario:'Taller Garcia' },
    ],
    cargas_combustible:[
      { fecha:'2026-05-05', litros:240, horometro:3625, costo:252 },
    ],
  },
  {
    id:'6', nombre:'JD 6130J #2', tipo:'Tractor', marca:'John Deere', modelo:'6130J',
    ano:2017, patente:'TR-AAA-006', horometro:4980, horometro_proximo_service:5000,
    estado:'Operativa', combustible_actual:180, capacidad_tanque:340, consumo_promedio:13,
    ultimo_service:'2026-01-10',
    mantenimientos:[
      { id:'m10', fecha:'2026-01-10', tipo:'Service', detalle:'Service 4800 hs', horometro:4800, costo:920, operario:'Taller Garcia' },
    ],
    cargas_combustible:[
      { fecha:'2026-05-18', litros:295, horometro:4975, costo:310 },
    ],
  },
  {
    id:'7', nombre:'Mercedes 1620', tipo:'Camion', marca:'Mercedes-Benz', modelo:'1620',
    ano:2015, patente:'AC-987-PT', horometro:185000, horometro_proximo_service:190000,
    estado:'Operativa', combustible_actual:140, capacidad_tanque:300, consumo_promedio:35,
    ultimo_service:'2026-04-05',
    mantenimientos:[
      { id:'m11', fecha:'2026-04-05', tipo:'Service', detalle:'Service km 180.000 + cambio neumáticos', horometro:180000, costo:2800, operario:'Taller MB' },
    ],
    cargas_combustible:[
      { fecha:'2026-05-19', litros:280, horometro:184800, costo:294 },
    ],
  },
  {
    id:'8', nombre:'Yomel TC', tipo:'Implemento', marca:'Yomel', modelo:'TC 200',
    ano:2020, horometro:0, horometro_proximo_service:0,
    estado:'Operativa',
    mantenimientos:[],
    cargas_combustible:[],
    observaciones:'Implemento de transporte de granos, sin horómetro propio',
  },
]

// ── Helpers ────────────────────────────────────────────────────────────────────
function getEstadoChip(e: EstadoMaquina) {
  const map: Record<EstadoMaquina, string> = {
    'Operativa':         'chip chip-green',
    'En mantenimiento':  'chip chip-amber',
    'Fuera de servicio': 'chip chip-red',
  }
  return map[e]
}

function getTipoIcon(t: TipoMaquina) {
  return <Wrench size={14}/>
}

function getServiceStatus(m: Maquina) {
  if (m.horometro_proximo_service === 0) return 'sin-service'
  const diff = m.horometro_proximo_service - m.horometro
  if (diff <= 0) return 'vencido'
  if (diff <= 50) return 'urgente'
  if (diff <= 150) return 'proximo'
  return 'ok'
}

function getServiceLabel(m: Maquina) {
  if (m.horometro_proximo_service === 0) return '—'
  const diff = m.horometro_proximo_service - m.horometro
  if (diff <= 0) return 'VENCIDO'
  return diff + ' hs'
}

function formatDate(d?: string) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

// ── Panel detalle ──────────────────────────────────────────────────────────────
function PanelDetalleMaquina({ maquina, onClose }: { maquina: Maquina, onClose: () => void }) {
  const serviceStatus = getServiceStatus(maquina)
  const tanquePct = maquina.combustible_actual && maquina.capacidad_tanque
    ? Math.round((maquina.combustible_actual / maquina.capacidad_tanque) * 100)
    : 0

  return (
    <div className="bg-white border border-borde rounded-xl overflow-hidden">
      <div className="bg-verde px-4 py-3 flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">{maquina.nombre}</p>
          <p className="text-xs text-white/60 mt-0.5">{maquina.marca} {maquina.modelo} · {maquina.ano}</p>
          <div className="flex gap-1.5 mt-1.5">
            <span className={getEstadoChip(maquina.estado)}>{maquina.estado}</span>
            <span className="chip" style={{background:'rgba(255,255,255,.15)',color:'#fff'}}>{maquina.tipo}</span>
          </div>
        </div>
        <button onClick={onClose} className="text-white/50 hover:text-white"><X size={14}/></button>
      </div>

      <div className="p-4 divide-y divide-borde">
        {/* Horómetro destacado */}
        <div className="pb-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-2">Horómetro</p>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-3xl font-semibold text-carbon">{maquina.horometro.toLocaleString()}</span>
            <span className="text-sm text-gris mb-1">horas</span>
          </div>
          {maquina.horometro_proximo_service > 0 && (
            <>
              {serviceStatus === 'vencido' && (
                <div className="flex items-center gap-1.5 text-xs text-rojo font-medium bg-rojo-s px-3 py-1.5 rounded-lg">
                  <AlertTriangle size={12}/> Service vencido — atención inmediata
                </div>
              )}
              {serviceStatus === 'urgente' && (
                <div className="flex items-center gap-1.5 text-xs text-rojo font-medium bg-rojo-s px-3 py-1.5 rounded-lg">
                  <AlertTriangle size={12}/> Service en {getServiceLabel(maquina)}
                </div>
              )}
              {serviceStatus === 'proximo' && (
                <div className="flex items-center gap-1.5 text-xs text-ambar font-medium bg-ambar-s px-3 py-1.5 rounded-lg">
                  <Calendar size={12}/> Próximo service en {getServiceLabel(maquina)}
                </div>
              )}
              {serviceStatus === 'ok' && (
                <div className="flex items-center gap-1.5 text-xs text-verde font-medium bg-verde-s px-3 py-1.5 rounded-lg">
                  ✓ Próximo service en {getServiceLabel(maquina)}
                </div>
              )}
            </>
          )}
        </div>

        {/* Combustible */}
        {maquina.combustible_actual !== undefined && maquina.capacidad_tanque && (
          <div className="py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-2">Combustible</p>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-2xl font-semibold text-carbon">{maquina.combustible_actual}</span>
              <span className="text-sm text-gris mb-1">/ {maquina.capacidad_tanque} litros</span>
            </div>
            <div className="w-full bg-tierra rounded-full h-2 mb-2">
              <div className={"h-2 rounded-full transition-all " +
                (tanquePct > 50 ? 'bg-verde-act' : tanquePct > 25 ? 'bg-ambar' : 'bg-rojo')}
                style={{width: tanquePct + '%'}}/>
            </div>
            <p className="text-[10px] text-gris">{tanquePct}% del tanque · Consumo promedio: {maquina.consumo_promedio} L/h</p>
          </div>
        )}

        {/* Datos */}
        <div className="py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-2">Información</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              ['Patente', maquina.patente || '—'],
              ['Año', maquina.ano.toString()],
              ['Último service', formatDate(maquina.ultimo_service)],
              ['Mantenimientos', maquina.mantenimientos.length.toString()],
            ].map(([l, v]) => (
              <div key={l} className="bg-tierra rounded-lg p-2">
                <p className="text-[10px] text-gris mb-0.5">{l}</p>
                <p className="text-xs font-semibold text-carbon">{v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Mantenimientos recientes */}
        <div className="py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-3">
            Mantenimientos recientes
          </p>
          {maquina.mantenimientos.length === 0 ? (
            <p className="text-xs text-gris italic">Sin mantenimientos registrados.</p>
          ) : (
            <div className="space-y-2">
              {maquina.mantenimientos.slice(0, 3).map(m => (
                <div key={m.id} className="flex gap-2 items-start">
                  <div className={"w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 " +
                    (m.tipo === 'Reparacion' ? 'bg-rojo' :
                     m.tipo === 'Service' ? 'bg-verde-act' : 'bg-ambar')}/>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-[11px] font-semibold text-carbon">{m.tipo}</p>
                      {m.costo > 0 && (
                        <span className="text-[10px] text-gris">USD {m.costo}</span>
                      )}
                    </div>
                    <p className="text-[11px] text-gris">{m.detalle}</p>
                    <p className="text-[10px] text-gris mt-0.5">
                      {formatDate(m.fecha)} · {m.horometro.toLocaleString()} hs
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="pt-4 flex flex-col gap-2">
          <button className="w-full text-xs font-semibold bg-verde-act text-white py-2 rounded-lg hover:bg-verde transition-colors">
            Registrar mantenimiento
          </button>
          <button className="w-full text-xs font-medium border border-borde text-carbon py-2 rounded-lg hover:bg-tierra transition-colors">
            Cargar combustible
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Pagina principal ───────────────────────────────────────────────────────────
export default function Maquinaria() {
  const [busqueda, setBusqueda] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState<string>('Todos')
  const [estadoFiltro, setEstadoFiltro] = useState<string>('Todos')
  const [soloAlertas, setSoloAlertas] = useState(false)
  const [seleccionada, setSeleccionada] = useState<Maquina | null>(null)

  const filtradas = MAQUINAS.filter(m => {
    const matchBusqueda = m.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      m.marca.toLowerCase().includes(busqueda.toLowerCase()) ||
      m.modelo.toLowerCase().includes(busqueda.toLowerCase())
    const matchTipo = tipoFiltro === 'Todos' || m.tipo === tipoFiltro
    const matchEstado = estadoFiltro === 'Todos' || m.estado === estadoFiltro
    const status = getServiceStatus(m)
    const matchAlerta = !soloAlertas || status === 'vencido' || status === 'urgente' || m.estado !== 'Operativa'
    return matchBusqueda && matchTipo && matchEstado && matchAlerta
  })

  // KPIs
  const totalMaquinas = MAQUINAS.length
  const operativas = MAQUINAS.filter(m => m.estado === 'Operativa').length
  const alertasService = MAQUINAS.filter(m => {
    const s = getServiceStatus(m)
    return s === 'vencido' || s === 'urgente'
  }).length
  const horasMes = MAQUINAS.reduce((acc, m) => {
    if (m.cargas_combustible.length < 2) return acc
    const ultima = m.cargas_combustible[0]
    const anteultima = m.cargas_combustible[1]
    return acc + Math.max(0, ultima.horometro - anteultima.horometro)
  }, 0)
  const costoMantenimientos = MAQUINAS.reduce((acc, m) =>
    acc + m.mantenimientos.reduce((sum, x) => sum + x.costo, 0), 0)

  const actions = (
    <div className="flex gap-2">
      <button className="flex items-center gap-1.5 text-xs font-semibold bg-verde-act text-white px-3 py-1.5 rounded-lg hover:bg-verde transition-colors">
        <Plus size={13}/> Nueva máquina
      </button>
    </div>
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Maquinaria" actions={actions}/>
      <div className="flex-1 overflow-y-auto p-4">

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-2.5 mb-4">
          {[
            { l:'Total equipos',          v: totalMaquinas.toString(),                                  s: operativas + ' operativas',                  c:'border-t-verde-ac' },
            { l:'Alertas de service',     v: alertasService.toString(),                                 s:'requieren atención pronto',                   c: alertasService > 0 ? 'border-t-rojo' : 'border-t-verde-ac' },
            { l:'Horas trabajadas',       v: horasMes.toString() + ' hs',                              s:'desde última carga combustible',              c:'border-t-azul' },
            { l:'Costo mantenimiento',    v:'USD ' + costoMantenimientos.toLocaleString(),             s:'acumulado historial',                          c:'border-t-ambar' },
          ].map(({ l, v, s, c }) => (
            <div key={l} className={"bg-white border border-borde rounded-xl p-3 border-t-2 " + c}>
              <div className="text-[10px] text-gris mb-1 uppercase tracking-wide font-medium">{l}</div>
              <div className="text-xl font-semibold text-carbon">{v}</div>
              <div className="text-[10px] text-gris">{s}</div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <div className="flex items-center gap-2 bg-white border border-borde rounded-lg px-3 py-1.5 flex-1 max-w-xs">
            <Search size={13} className="text-gris flex-shrink-0"/>
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar máquina, marca, modelo..."
              className="text-xs outline-none bg-transparent flex-1 text-carbon placeholder:text-gris"/>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {['Todos', 'Tractor', 'Cosechadora', 'Sembradora', 'Pulverizadora', 'Camion'].map(t => (
              <button key={t}
                onClick={() => setTipoFiltro(t)}
                className={"text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium " +
                  (tipoFiltro === t
                    ? 'bg-verde text-white border-verde'
                    : 'bg-white border-borde text-carbon hover:bg-tierra')}>
                {t}
              </button>
            ))}
          </div>
          <button
            onClick={() => setSoloAlertas(!soloAlertas)}
            className={"flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium " +
              (soloAlertas ? 'bg-rojo text-white border-rojo' : 'bg-white border-borde text-carbon hover:bg-tierra')}>
            <AlertTriangle size={12}/> Solo alertas
          </button>
          <span className="ml-auto text-xs text-gris bg-tierra border border-borde px-3 py-1.5 rounded-lg">
            <strong className="text-carbon">{filtradas.length}</strong> equipos
          </span>
        </div>

        {/* Tabla + Detalle */}
        <div className={"grid gap-3 " + (seleccionada ? 'grid-cols-[1fr_320px]' : 'grid-cols-1')}>

          {/* Tabla */}
          <div className="bg-white border border-borde rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-tierra border-b border-borde">
                  {['Máquina','Tipo','Patente','Horómetro','Próx. service','Combustible','Estado'].map(h => (
                    <th key={h} className="text-left px-3 py-2 font-medium text-gris">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-borde">
                {filtradas.map(maquina => {
                  const serviceStatus = getServiceStatus(maquina)
                  const serviceLabel = getServiceLabel(maquina)
                  const tanquePct = maquina.combustible_actual && maquina.capacidad_tanque
                    ? Math.round((maquina.combustible_actual / maquina.capacidad_tanque) * 100)
                    : null
                  return (
                    <tr key={maquina.id}
                      onClick={() => setSeleccionada(seleccionada?.id === maquina.id ? null : maquina)}
                      className={"cursor-pointer transition-colors hover:bg-tierra/50 " +
                        (seleccionada?.id === maquina.id ? 'bg-verde-s' : '')}>
                      <td className="px-3 py-2">
                        <p className="font-medium text-carbon">{maquina.nombre}</p>
                        <p className="text-[10px] text-gris">{maquina.marca} {maquina.modelo}</p>
                      </td>
                      <td className="px-3 py-2">
                        <span className="chip chip-blue">{maquina.tipo}</span>
                      </td>
                      <td className="px-3 py-2 text-gris font-mono">{maquina.patente || '—'}</td>
                      <td className="px-3 py-2 font-medium text-carbon whitespace-nowrap">
                        {maquina.horometro.toLocaleString()} hs
                      </td>
                      <td className="px-3 py-2">
                        {serviceStatus === 'vencido' && <span className="chip chip-red">VENCIDO</span>}
                        {serviceStatus === 'urgente' && <span className="chip chip-red">{serviceLabel}</span>}
                        {serviceStatus === 'proximo' && <span className="chip chip-amber">{serviceLabel}</span>}
                        {serviceStatus === 'ok'      && <span className="chip chip-green">{serviceLabel}</span>}
                        {serviceStatus === 'sin-service' && <span className="text-gris">—</span>}
                      </td>
                      <td className="px-3 py-2 min-w-[100px]">
                        {tanquePct !== null ? (
                          <div>
                            <div className="w-full bg-tierra rounded-full h-1.5">
                              <div className={"h-1.5 rounded-full " +
                                (tanquePct > 50 ? 'bg-verde-act' : tanquePct > 25 ? 'bg-ambar' : 'bg-rojo')}
                                style={{width: tanquePct + '%'}}/>
                            </div>
                            <p className="text-[10px] text-gris mt-0.5">{maquina.combustible_actual} L · {tanquePct}%</p>
                          </div>
                        ) : (
                          <span className="text-gris text-[10px]">N/A</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span className={getEstadoChip(maquina.estado)}>{maquina.estado}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filtradas.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Wrench size={32} className="text-borde mb-3"/>
                <p className="text-sm font-medium text-carbon mb-1">No hay equipos</p>
                <p className="text-xs text-gris">Cambia los filtros o agrega una nueva máquina</p>
              </div>
            )}
          </div>

          {/* Panel detalle */}
          {seleccionada && (
            <PanelDetalleMaquina maquina={seleccionada} onClose={() => setSeleccionada(null)}/>
          )}
        </div>
      </div>
    </div>
  )
}
