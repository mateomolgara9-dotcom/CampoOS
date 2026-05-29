'use client'
import { useState } from 'react'
import { Search, Plus, Car, Truck, X, Calendar, AlertTriangle, FileText, Fuel, MapPin, Shield } from 'lucide-react'
import Topbar from '@/components/Topbar'

// ── Tipos ─────────────────────────────────────────────────────────────────────
type TipoVehiculo = 'Camioneta' | 'Camion' | 'Acoplado' | 'Utilitario' | 'Auto' | 'Moto'
type EstadoVehiculo = 'Operativo' | 'En taller' | 'Fuera de servicio'

type CargaCombustibleVeh = {
  id: string
  fecha: string
  litros: number
  km: number
  costo: number
  estacion?: string
}

type Vehiculo = {
  id: string
  nombre: string
  tipo: TipoVehiculo
  marca: string
  modelo: string
  ano: number
  patente: string
  chasis?: string
  km: number
  estado: EstadoVehiculo
  consumo_promedio?: number  // litros / 100 km
  combustible_actual?: number
  capacidad_tanque?: number
  asignado_a?: string
  // Documentación
  vtv_vencimiento?: string
  seguro_vencimiento?: string
  patente_vencimiento?: string
  // Combustible
  cargas: CargaCombustibleVeh[]
  observaciones?: string
}

// ── Datos de ejemplo ──────────────────────────────────────────────────────────
const VEHICULOS: Vehiculo[] = [
  {
    id:'v1', nombre:'Hilux 4x4 blanca', tipo:'Camioneta',
    marca:'Toyota', modelo:'Hilux SRV 4x4', ano:2022,
    patente:'AE-547-PT', chasis:'8AJBA3CD0NMK00125',
    km:48500, estado:'Operativo', consumo_promedio:9.2,
    combustible_actual:65, capacidad_tanque:80,
    asignado_a:'Juan Garcia (encargado)',
    vtv_vencimiento:'2026-11-15', seguro_vencimiento:'2026-08-20', patente_vencimiento:'2026-12-31',
    cargas:[
      { id:'c1', fecha:'2026-05-21', litros:55, km:48490, costo:58, estacion:'YPF Villa Maria' },
      { id:'c2', fecha:'2026-05-10', litros:60, km:47950, costo:63 },
    ],
  },
  {
    id:'v2', nombre:'Ranger doble cabina', tipo:'Camioneta',
    marca:'Ford', modelo:'Ranger XLT 3.2', ano:2020,
    patente:'AC-892-QR', chasis:'8AFER02F0LJ012450',
    km:92400, estado:'Operativo', consumo_promedio:10.5,
    combustible_actual:45, capacidad_tanque:80,
    asignado_a:'Personal de campo',
    vtv_vencimiento:'2026-07-08', seguro_vencimiento:'2026-09-15', patente_vencimiento:'2026-12-31',
    cargas:[
      { id:'c3', fecha:'2026-05-20', litros:62, km:92350, costo:65, estacion:'Axion Villa Nueva' },
    ],
  },
  {
    id:'v3', nombre:'Camion jaula', tipo:'Camion',
    marca:'Mercedes-Benz', modelo:'1620', ano:2015,
    patente:'AC-987-PT', km:185000, estado:'Operativo', consumo_promedio:32,
    combustible_actual:140, capacidad_tanque:300,
    asignado_a:'Personal de transporte',
    vtv_vencimiento:'2026-10-12', seguro_vencimiento:'2026-11-30', patente_vencimiento:'2026-12-31',
    cargas:[
      { id:'c4', fecha:'2026-05-19', litros:280, km:184800, costo:294 },
    ],
  },
  {
    id:'v4', nombre:'Acoplado jaula', tipo:'Acoplado',
    marca:'Helvetica', modelo:'Acoplado jaula 30 anim.', ano:2018,
    patente:'AB-451-KL',
    km:0, estado:'Operativo',
    asignado_a:'Camion jaula',
    vtv_vencimiento:'2026-08-15', patente_vencimiento:'2026-12-31',
    cargas:[],
    observaciones:'Capacidad 30 animales adultos',
  },
  {
    id:'v5', nombre:'Camioneta amarok', tipo:'Camioneta',
    marca:'Volkswagen', modelo:'Amarok V6 3.0', ano:2021,
    patente:'AD-123-MN', km:65800, estado:'En taller', consumo_promedio:11.8,
    combustible_actual:30, capacidad_tanque:80,
    asignado_a:'Productor',
    vtv_vencimiento:'2026-06-30', seguro_vencimiento:'2026-12-10', patente_vencimiento:'2026-12-31',
    cargas:[
      { id:'c5', fecha:'2026-04-30', litros:50, km:65300, costo:53 },
    ],
    observaciones:'En reparación de embrague — Concesionario VW',
  },
  {
    id:'v6', nombre:'Utilitario Partner', tipo:'Utilitario',
    marca:'Peugeot', modelo:'Partner Furgon', ano:2017,
    patente:'AA-789-OP', km:142500, estado:'Operativo', consumo_promedio:8.4,
    combustible_actual:25, capacidad_tanque:60,
    asignado_a:'Mantenimiento general',
    vtv_vencimiento:'2026-05-30', seguro_vencimiento:'2026-07-15', patente_vencimiento:'2026-12-31',
    cargas:[
      { id:'c6', fecha:'2026-05-18', litros:45, km:142400, costo:47 },
    ],
  },
  {
    id:'v7', nombre:'Moto trabajo', tipo:'Moto',
    marca:'Honda', modelo:'XR 150L', ano:2023,
    patente:'A123BCD', km:8500, estado:'Operativo', consumo_promedio:3.2,
    combustible_actual:6, capacidad_tanque:12,
    asignado_a:'Personal de campo',
    seguro_vencimiento:'2027-01-20', patente_vencimiento:'2026-12-31',
    cargas:[],
  },
]

// ── Helpers ────────────────────────────────────────────────────────────────────
function getTipoIcon(t: TipoVehiculo) {
  if (t === 'Camion') return <Truck size={14}/>
  if (t === 'Acoplado') return <Truck size={14}/>
  return <Car size={14}/>
}

function getEstadoChip(e: EstadoVehiculo) {
  const map: Record<EstadoVehiculo, string> = {
    'Operativo': 'chip chip-green',
    'En taller': 'chip chip-amber',
    'Fuera de servicio': 'chip chip-red',
  }
  return map[e]
}

function formatDate(d?: string) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function diasHasta(d?: string) {
  if (!d) return null
  const hoy = new Date()
  const venc = new Date(d)
  return Math.ceil((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
}

function getDocStatus(d?: string): 'vencido' | 'urgente' | 'proximo' | 'ok' | 'na' {
  const dias = diasHasta(d)
  if (dias === null) return 'na'
  if (dias < 0) return 'vencido'
  if (dias <= 30) return 'urgente'
  if (dias <= 90) return 'proximo'
  return 'ok'
}

function getDocChip(d?: string) {
  const status = getDocStatus(d)
  if (status === 'vencido') return 'chip chip-red'
  if (status === 'urgente') return 'chip chip-red'
  if (status === 'proximo') return 'chip chip-amber'
  if (status === 'ok') return 'chip chip-green'
  return 'chip chip-gray'
}

function getDocLabel(d?: string) {
  const status = getDocStatus(d)
  const dias = diasHasta(d)
  if (status === 'na') return '—'
  if (status === 'vencido') return 'Vencido hace ' + Math.abs(dias!) + ' días'
  if (status === 'urgente') return 'En ' + dias + ' días'
  return formatDate(d)
}

// ── Panel detalle vehiculo ─────────────────────────────────────────────────────
function PanelDetalleVehiculo({ v, onClose }: { v: Vehiculo, onClose: () => void }) {
  const tanquePct = v.combustible_actual && v.capacidad_tanque
    ? Math.round((v.combustible_actual / v.capacidad_tanque) * 100) : 0

  return (
    <div className="bg-white border border-borde rounded-xl overflow-hidden">
      <div className="bg-verde px-4 py-3 flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">{v.nombre}</p>
          <p className="text-xs text-white/60 mt-0.5">{v.marca} {v.modelo} · {v.ano}</p>
          <div className="flex gap-1.5 mt-1.5 flex-wrap">
            <span className={getEstadoChip(v.estado)}>{v.estado}</span>
            <span className="chip" style={{background:'rgba(255,255,255,.15)',color:'#fff'}}>{v.tipo}</span>
          </div>
        </div>
        <button onClick={onClose} className="text-white/50 hover:text-white"><X size={14}/></button>
      </div>

      <div className="p-4 divide-y divide-borde">
        {/* Patente y KM */}
        <div className="pb-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-2">Identificación</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-tierra rounded-lg p-2">
              <p className="text-[10px] text-gris mb-0.5">Patente</p>
              <p className="text-sm font-mono font-bold text-carbon">{v.patente}</p>
            </div>
            <div className="bg-tierra rounded-lg p-2">
              <p className="text-[10px] text-gris mb-0.5">Kilómetros</p>
              <p className="text-sm font-semibold text-carbon">{v.km.toLocaleString()} km</p>
            </div>
          </div>
        </div>

        {/* Combustible */}
        {v.combustible_actual !== undefined && v.capacidad_tanque && (
          <div className="py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-2">Combustible</p>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-2xl font-semibold text-carbon">{v.combustible_actual}</span>
              <span className="text-sm text-gris mb-1">/ {v.capacidad_tanque} litros</span>
            </div>
            <div className="w-full bg-tierra rounded-full h-2 mb-2">
              <div className={"h-2 rounded-full transition-all " +
                (tanquePct > 50 ? 'bg-verde-act' : tanquePct > 25 ? 'bg-ambar' : 'bg-rojo')}
                style={{width: tanquePct + '%'}}/>
            </div>
            <p className="text-[10px] text-gris">
              {tanquePct}% del tanque · Consumo: {v.consumo_promedio} L/100km
            </p>
          </div>
        )}

        {/* Documentación */}
        <div className="py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-2">Documentación</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-gris flex items-center gap-1.5">
                <Shield size={12}/> VTV
              </span>
              <span className={getDocChip(v.vtv_vencimiento)}>{getDocLabel(v.vtv_vencimiento)}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-gris flex items-center gap-1.5">
                <FileText size={12}/> Seguro
              </span>
              <span className={getDocChip(v.seguro_vencimiento)}>{getDocLabel(v.seguro_vencimiento)}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-gris flex items-center gap-1.5">
                <FileText size={12}/> Patente
              </span>
              <span className={getDocChip(v.patente_vencimiento)}>{getDocLabel(v.patente_vencimiento)}</span>
            </div>
          </div>
        </div>

        {/* Asignación */}
        {v.asignado_a && (
          <div className="py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-2">Asignación</p>
            <div className="bg-azul-s rounded-lg p-2">
              <p className="text-[10px] text-azul">Asignado a</p>
              <p className="text-xs font-semibold text-carbon">{v.asignado_a}</p>
            </div>
          </div>
        )}

        {/* Últimas cargas */}
        {v.cargas.length > 0 && (
          <div className="py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-2">
              Últimas cargas de combustible
            </p>
            <div className="space-y-1.5">
              {v.cargas.slice(0, 3).map(c => (
                <div key={c.id} className="flex items-center justify-between text-xs bg-tierra rounded-lg p-2">
                  <div>
                    <p className="font-medium text-carbon">{formatDate(c.fecha)} · {c.litros} L</p>
                    <p className="text-[10px] text-gris">{c.km.toLocaleString()} km {c.estacion ? '· ' + c.estacion : ''}</p>
                  </div>
                  <span className="font-semibold text-rojo">USD {c.costo}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {v.observaciones && (
          <div className="py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-2">Observaciones</p>
            <p className="text-xs text-carbon bg-tierra rounded-lg p-2">{v.observaciones}</p>
          </div>
        )}

        <div className="pt-4 flex flex-col gap-2">
          <button className="w-full text-xs font-semibold bg-verde-act text-white py-2 rounded-lg hover:bg-verde transition-colors">
            Cargar combustible
          </button>
          <button className="w-full text-xs font-medium border border-borde text-carbon py-2 rounded-lg hover:bg-tierra transition-colors">
            Ver historial completo
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Pagina principal ───────────────────────────────────────────────────────────
export default function Flota() {
  const [busqueda, setBusqueda] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState<string>('Todos')
  const [soloAlertas, setSoloAlertas] = useState(false)
  const [seleccionado, setSeleccionado] = useState<Vehiculo | null>(null)

  const filtrados = VEHICULOS.filter(v => {
    const matchBusqueda = v.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      v.marca.toLowerCase().includes(busqueda.toLowerCase()) ||
      v.modelo.toLowerCase().includes(busqueda.toLowerCase()) ||
      v.patente.toLowerCase().includes(busqueda.toLowerCase())
    const matchTipo = tipoFiltro === 'Todos' || v.tipo === tipoFiltro
    const tieneAlerta = getDocStatus(v.vtv_vencimiento) === 'vencido' ||
                        getDocStatus(v.vtv_vencimiento) === 'urgente' ||
                        getDocStatus(v.seguro_vencimiento) === 'vencido' ||
                        getDocStatus(v.seguro_vencimiento) === 'urgente' ||
                        v.estado !== 'Operativo'
    const matchAlerta = !soloAlertas || tieneAlerta
    return matchBusqueda && matchTipo && matchAlerta
  })

  // KPIs
  const totalVehiculos = VEHICULOS.length
  const operativos = VEHICULOS.filter(v => v.estado === 'Operativo').length
  const alertasDoc = VEHICULOS.filter(v => {
    const s1 = getDocStatus(v.vtv_vencimiento)
    const s2 = getDocStatus(v.seguro_vencimiento)
    return s1 === 'vencido' || s1 === 'urgente' || s2 === 'vencido' || s2 === 'urgente'
  }).length
  const kmTotales = VEHICULOS.reduce((acc, v) => acc + v.km, 0)
  const litrosTotales = VEHICULOS.reduce((acc, v) =>
    acc + v.cargas.reduce((s, c) => s + c.litros, 0), 0)

  const actions = (
    <div className="flex gap-2">
      <button className="flex items-center gap-1.5 text-xs font-semibold bg-verde-act text-white px-3 py-1.5 rounded-lg hover:bg-verde transition-colors">
        <Plus size={13}/> Nuevo vehículo
      </button>
    </div>
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Flota" actions={actions}/>
      <div className="flex-1 overflow-y-auto p-4">

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-2.5 mb-4">
          <div className="bg-white border border-borde rounded-xl p-3 border-t-2 border-t-verde-ac">
            <div className="text-[10px] text-gris mb-1 uppercase tracking-wide font-medium">Total vehículos</div>
            <div className="text-xl font-semibold text-carbon">{totalVehiculos}</div>
            <div className="text-[10px] text-gris">{operativos} operativos</div>
          </div>
          <div className={"bg-white border border-borde rounded-xl p-3 border-t-2 " +
            (alertasDoc > 0 ? 'border-t-rojo' : 'border-t-verde-ac')}>
            <div className="text-[10px] text-gris mb-1 uppercase tracking-wide font-medium">Alertas documentación</div>
            <div className={"text-xl font-semibold " + (alertasDoc > 0 ? 'text-rojo' : 'text-verde')}>
              {alertasDoc}
            </div>
            <div className="text-[10px] text-gris">VTV o seguro próximo</div>
          </div>
          <div className="bg-white border border-borde rounded-xl p-3 border-t-2 border-t-azul">
            <div className="text-[10px] text-gris mb-1 uppercase tracking-wide font-medium">Kilómetros totales</div>
            <div className="text-xl font-semibold text-carbon">{kmTotales.toLocaleString()}</div>
            <div className="text-[10px] text-gris">recorridos por la flota</div>
          </div>
          <div className="bg-white border border-borde rounded-xl p-3 border-t-2 border-t-ambar">
            <div className="text-[10px] text-gris mb-1 uppercase tracking-wide font-medium">Combustible cargado</div>
            <div className="text-xl font-semibold text-carbon">{litrosTotales.toLocaleString()} L</div>
            <div className="text-[10px] text-gris">historial registrado</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <div className="flex items-center gap-2 bg-white border border-borde rounded-lg px-3 py-1.5 flex-1 max-w-xs">
            <Search size={13} className="text-gris flex-shrink-0"/>
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar vehículo, patente, marca..."
              className="text-xs outline-none bg-transparent flex-1 text-carbon placeholder:text-gris"/>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {(['Todos', 'Camioneta', 'Camion', 'Acoplado', 'Utilitario', 'Moto'] as const).map(t => (
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
            <strong className="text-carbon">{filtrados.length}</strong> vehículos
          </span>
        </div>

        {/* Tabla + detalle */}
        <div className={"grid gap-3 " + (seleccionado ? 'grid-cols-[1fr_320px]' : 'grid-cols-1')}>

          <div className="bg-white border border-borde rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-tierra border-b border-borde">
                  {['Vehículo','Patente','Tipo','KM','Combustible','VTV','Seguro','Estado'].map(h => (
                    <th key={h} className="text-left px-3 py-2 font-medium text-gris">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-borde">
                {filtrados.map(v => {
                  const tanquePct = v.combustible_actual && v.capacidad_tanque
                    ? Math.round((v.combustible_actual / v.capacidad_tanque) * 100) : null
                  return (
                    <tr key={v.id}
                      onClick={() => setSeleccionado(seleccionado?.id === v.id ? null : v)}
                      className={"cursor-pointer transition-colors hover:bg-tierra/50 " +
                        (seleccionado?.id === v.id ? 'bg-verde-s' : '')}>
                      <td className="px-3 py-2">
                        <p className="font-medium text-carbon">{v.nombre}</p>
                        <p className="text-[10px] text-gris">{v.marca} {v.modelo} · {v.ano}</p>
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                          {v.patente}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="flex items-center gap-1.5 text-carbon">
                          {getTipoIcon(v.tipo)}
                          <span className="text-[11px]">{v.tipo}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2 font-medium text-carbon">{v.km.toLocaleString()} km</td>
                      <td className="px-3 py-2 min-w-[100px]">
                        {tanquePct !== null ? (
                          <div>
                            <div className="w-full bg-tierra rounded-full h-1.5">
                              <div className={"h-1.5 rounded-full " +
                                (tanquePct > 50 ? 'bg-verde-act' : tanquePct > 25 ? 'bg-ambar' : 'bg-rojo')}
                                style={{width: tanquePct + '%'}}/>
                            </div>
                            <p className="text-[10px] text-gris mt-0.5">{v.combustible_actual} L · {tanquePct}%</p>
                          </div>
                        ) : (
                          <span className="text-gris text-[10px]">N/A</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span className={getDocChip(v.vtv_vencimiento)}>{getDocLabel(v.vtv_vencimiento)}</span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={getDocChip(v.seguro_vencimiento)}>{getDocLabel(v.seguro_vencimiento)}</span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={getEstadoChip(v.estado)}>{v.estado}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filtrados.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Car size={32} className="text-borde mb-3"/>
                <p className="text-sm font-medium text-carbon mb-1">No hay vehículos</p>
                <p className="text-xs text-gris">Cambia los filtros o agrega uno nuevo</p>
              </div>
            )}
          </div>

          {seleccionado && (
            <PanelDetalleVehiculo v={seleccionado} onClose={() => setSeleccionado(null)}/>
          )}
        </div>
      </div>
    </div>
  )
}
