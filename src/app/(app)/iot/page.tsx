'use client'
import { useState, useEffect } from 'react'
import { Search, Plus, Antenna, X, Wifi, WifiOff, Battery, BatteryLow, Activity,
         CheckCircle2, AlertTriangle, Clock, Zap, Scale, Bluetooth, Play, Pause,
         RefreshCw, Settings as SettingsIcon, MapPin, TrendingUp } from 'lucide-react'
import Topbar from '@/components/Topbar'

// ── Tipos ─────────────────────────────────────────────────────────────────────
type TipoDispositivo = 'Lector manga' | 'Lector portatil' | 'Bascula' | 'Lector + Bascula' | 'Collar GPS' | 'Estacion meteo'
type EstadoDispositivo = 'Conectado' | 'Disponible' | 'Desconectado' | 'Error'
type EstadoSesion = 'Activa' | 'Pausada' | 'Finalizada'

type Dispositivo = {
  id: string
  nombre: string
  tipo: TipoDispositivo
  marca: string
  modelo: string
  mac: string
  estado: EstadoDispositivo
  bateria?: number
  ultima_conexion: string
  ubicacion?: string
  lecturas_hoy?: number
  firmware?: string
}

type LecturaRFID = {
  id: string
  hora: string
  caravana: string
  animal_nombre?: string
  peso?: number
  estado: 'OK' | 'Alerta' | 'No registrado'
  alerta_motivo?: string
  dispositivo: string
}

type SesionRFID = {
  id: string
  inicio: string
  fin?: string
  dispositivo: string
  estado: EstadoSesion
  animales_leidos: number
  alertas: number
  duracion_minutos: number
}

// ── Datos de ejemplo ──────────────────────────────────────────────────────────
const DISPOSITIVOS: Dispositivo[] = [
  {
    id:'d1', nombre:'Lector Manga Norte', tipo:'Lector manga',
    marca:'Allflex', modelo:'RS680',
    mac:'AC:BC:32:78:91:F4', estado:'Conectado', bateria:78,
    ultima_conexion:'hace 4 min', ubicacion:'Manga Norte',
    lecturas_hoy:183, firmware:'v2.4.1',
  },
  {
    id:'d2', nombre:'Báscula Principal', tipo:'Bascula',
    marca:'Gallagher', modelo:'W400',
    mac:'78:E3:6D:12:8A:B0', estado:'Conectado', bateria:92,
    ultima_conexion:'hace 4 min', ubicacion:'Manga Norte',
    lecturas_hoy:183, firmware:'v1.8.2',
  },
  {
    id:'d3', nombre:'Lector Portátil 1', tipo:'Lector portatil',
    marca:'Tru-Test', modelo:'XR3000',
    mac:'88:1A:F1:55:6C:D2', estado:'Disponible', bateria:45,
    ultima_conexion:'hace 2 hs', ubicacion:'Casco',
    lecturas_hoy:0, firmware:'v3.1.0',
  },
  {
    id:'d4', nombre:'Lector Manga Sur', tipo:'Lector + Bascula',
    marca:'Agrident', modelo:'AWR300',
    mac:'5C:F8:21:9B:E4:33', estado:'Disponible', bateria:65,
    ultima_conexion:'ayer 16:30', ubicacion:'Manga Sur',
    lecturas_hoy:0, firmware:'v2.0.5',
  },
  {
    id:'d5', nombre:'Collar GPS - Vaca toro Manchas', tipo:'Collar GPS',
    marca:'Datamars', modelo:'Smartbow',
    mac:'A4:12:78:33:CD:9F', estado:'Conectado', bateria:34,
    ultima_conexion:'hace 12 min', ubicacion:'Potrero Sur',
    firmware:'v4.2.0',
  },
  {
    id:'d6', nombre:'Estación meteo - Casco', tipo:'Estacion meteo',
    marca:'Davis', modelo:'Vantage Pro2',
    mac:'00:14:22:88:7A:E1', estado:'Conectado', bateria:88,
    ultima_conexion:'hace 1 min', ubicacion:'Casco principal',
    firmware:'v6.3.1',
  },
  {
    id:'d7', nombre:'Lector Portátil 2', tipo:'Lector portatil',
    marca:'Allflex', modelo:'LPR',
    mac:'CC:33:11:90:5B:F8', estado:'Error', bateria:8,
    ultima_conexion:'hace 3 dias', ubicacion:'—',
    lecturas_hoy:0, firmware:'v1.5.0',
  },
]

const LECTURAS_RECIENTES: LecturaRFID[] = [
  { id:'l1', hora:'14:23', caravana:'AR-3341', animal_nombre:'Novillo Hereford', peso:287, estado:'OK',              dispositivo:'Lector Manga Norte' },
  { id:'l2', hora:'14:22', caravana:'AR-1143', animal_nombre:'Vaca HH Braford',  peso:331, estado:'Alerta', alerta_motivo:'Vacuna aftosa vencida', dispositivo:'Lector Manga Norte' },
  { id:'l3', hora:'14:21', caravana:'AR-2087', animal_nombre:'Vaca Angus',       peso:318, estado:'OK',              dispositivo:'Lector Manga Norte' },
  { id:'l4', hora:'14:20', caravana:'AR-4521', animal_nombre:'Vaquillona',        peso:264, estado:'OK',              dispositivo:'Lector Manga Norte' },
  { id:'l5', hora:'14:19', caravana:'AR-7712', animal_nombre:'Novillo Aberdeen', peso:312, estado:'OK',              dispositivo:'Lector Manga Norte' },
  { id:'l6', hora:'14:18', caravana:'AR-1142', animal_nombre:'Vaca HH Braford',  peso:342, estado:'Alerta', alerta_motivo:'Vacuna aftosa vencida', dispositivo:'Lector Manga Norte' },
  { id:'l7', hora:'14:17', caravana:'AR-8847', animal_nombre:undefined,           peso:280, estado:'No registrado',   alerta_motivo:'Caravana no encontrada en sistema', dispositivo:'Lector Manga Norte' },
  { id:'l8', hora:'14:16', caravana:'AR-0891', animal_nombre:'Ternero Cruzado',  peso:148, estado:'OK',              dispositivo:'Lector Manga Norte' },
]

const SESIONES_HOY: SesionRFID[] = [
  { id:'s1', inicio:'13:45', dispositivo:'Lector Manga Norte', estado:'Activa',     animales_leidos:183, alertas:7, duracion_minutos:38 },
  { id:'s2', inicio:'09:30', fin:'10:48', dispositivo:'Lector Manga Norte', estado:'Finalizada', animales_leidos:142, alertas:3, duracion_minutos:78 },
]

// ── Helpers ────────────────────────────────────────────────────────────────────
function getEstadoColor(e: EstadoDispositivo) {
  if (e === 'Conectado') return { chip: 'chip chip-green', dot: 'bg-verde-act', icon: <Wifi size={12}/> }
  if (e === 'Disponible') return { chip: 'chip chip-blue', dot: 'bg-azul', icon: <Bluetooth size={12}/> }
  if (e === 'Error') return { chip: 'chip chip-red', dot: 'bg-rojo', icon: <AlertTriangle size={12}/> }
  return { chip: 'chip chip-gray', dot: 'bg-gray-400', icon: <WifiOff size={12}/> }
}

function getTipoIcon(t: TipoDispositivo) {
  if (t === 'Bascula') return <Scale size={14}/>
  if (t === 'Collar GPS') return <MapPin size={14}/>
  if (t === 'Estacion meteo') return <Activity size={14}/>
  return <Antenna size={14}/>
}

function getBateriaColor(b?: number) {
  if (!b) return 'text-gris'
  if (b > 50) return 'text-verde-act'
  if (b > 20) return 'text-ambar'
  return 'text-rojo'
}

function getBateriaIcon(b?: number) {
  if (!b || b <= 20) return <BatteryLow size={14}/>
  return <Battery size={14}/>
}

// ── Sesion activa banner ──────────────────────────────────────────────────────
function SesionActivaBanner({ sesion }: { sesion: SesionRFID }) {
  const [tiempo, setTiempo] = useState(sesion.duracion_minutos)

  useEffect(() => {
    const interval = setInterval(() => setTiempo(t => t + 0.05), 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-verde-n border-2 border-verde-ac rounded-xl p-4 mb-4 relative overflow-hidden">
      {/* Pulsing dot animation */}
      <div className="absolute top-3 left-3 flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-verde-ac opacity-75"/>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-verde-ac"/>
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-verde-ac">SESION ACTIVA</span>
      </div>

      <div className="flex items-center justify-between mt-3">
        <div>
          <p className="text-base font-semibold text-white">Operación en {sesion.dispositivo}</p>
          <p className="text-xs text-white/60 mt-0.5">Iniciada a las {sesion.inicio} · {Math.floor(tiempo)} minutos en curso</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 text-xs font-medium border border-white/20 text-white px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <Pause size={12}/> Pausar
          </button>
          <button className="flex items-center gap-1.5 text-xs font-semibold bg-rojo text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors">
            <X size={12}/> Finalizar sesion
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mt-4">
        <div className="bg-white/10 rounded-lg p-2">
          <p className="text-[10px] text-white/60 mb-0.5">Animales leídos</p>
          <p className="text-xl font-semibold text-verde-ac">{sesion.animales_leidos}</p>
        </div>
        <div className="bg-white/10 rounded-lg p-2">
          <p className="text-[10px] text-white/60 mb-0.5">Alertas</p>
          <p className="text-xl font-semibold text-ambar">{sesion.alertas}</p>
        </div>
        <div className="bg-white/10 rounded-lg p-2">
          <p className="text-[10px] text-white/60 mb-0.5">Velocidad</p>
          <p className="text-xl font-semibold text-white">4.8<span className="text-xs text-white/60"> /min</span></p>
        </div>
        <div className="bg-white/10 rounded-lg p-2">
          <p className="text-[10px] text-white/60 mb-0.5">Sin registrar</p>
          <p className="text-xl font-semibold text-rojo">1</p>
        </div>
      </div>
    </div>
  )
}

// ── Panel detalle dispositivo ─────────────────────────────────────────────────
function PanelDetalleDispositivo({ d, onClose }: { d: Dispositivo, onClose: () => void }) {
  const colors = getEstadoColor(d.estado)
  const batColor = getBateriaColor(d.bateria)

  return (
    <div className="bg-white border border-borde rounded-xl overflow-hidden">
      <div className="bg-verde px-4 py-3 flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">{d.nombre}</p>
          <p className="text-xs text-white/60 mt-0.5">{d.marca} {d.modelo}</p>
          <div className="flex gap-1.5 mt-1.5 flex-wrap">
            <span className={colors.chip}>{d.estado}</span>
            <span className="chip" style={{background:'rgba(255,255,255,.15)',color:'#fff'}}>{d.tipo}</span>
          </div>
        </div>
        <button onClick={onClose} className="text-white/50 hover:text-white"><X size={14}/></button>
      </div>

      <div className="p-4 divide-y divide-borde">
        {/* Estado destacado */}
        <div className="pb-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-2">Estado del dispositivo</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-tierra rounded-lg p-2.5">
              <div className={"flex items-center gap-1.5 " + batColor}>
                {getBateriaIcon(d.bateria)}
                <span className="text-lg font-semibold">{d.bateria || '—'}{d.bateria ? '%' : ''}</span>
              </div>
              <p className="text-[10px] text-gris mt-1">Batería</p>
            </div>
            <div className="bg-tierra rounded-lg p-2.5">
              <div className="flex items-center gap-1.5 text-carbon">
                {colors.icon}
                <span className="text-xs font-semibold">{d.ultima_conexion}</span>
              </div>
              <p className="text-[10px] text-gris mt-1">Última conexión</p>
            </div>
          </div>
        </div>

        {/* Datos técnicos */}
        <div className="py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-2">Datos técnicos</p>
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs text-gris">MAC Address</span>
              <span className="text-xs font-mono font-medium text-carbon">{d.mac}</span>
            </div>
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs text-gris">Firmware</span>
              <span className="text-xs font-mono font-medium text-carbon">{d.firmware || '—'}</span>
            </div>
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs text-gris">Ubicación</span>
              <span className="text-xs font-medium text-carbon">{d.ubicacion || '—'}</span>
            </div>
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs text-gris">Lecturas hoy</span>
              <span className="text-xs font-semibold text-verde">{d.lecturas_hoy || 0}</span>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="pt-4 flex flex-col gap-2">
          {d.estado === 'Disponible' && (
            <button className="w-full text-xs font-semibold bg-verde-act text-white py-2 rounded-lg hover:bg-verde transition-colors flex items-center justify-center gap-1.5">
              <Bluetooth size={13}/> Conectar dispositivo
            </button>
          )}
          {d.estado === 'Conectado' && (
            <button className="w-full text-xs font-semibold bg-rojo text-white py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-1.5">
              <WifiOff size={13}/> Desconectar
            </button>
          )}
          {d.estado === 'Error' && (
            <button className="w-full text-xs font-semibold bg-ambar text-white py-2 rounded-lg hover:bg-yellow-600 transition-colors flex items-center justify-center gap-1.5">
              <RefreshCw size={13}/> Reintentar conexión
            </button>
          )}
          <button className="w-full text-xs font-medium border border-borde text-carbon py-2 rounded-lg hover:bg-tierra transition-colors flex items-center justify-center gap-1.5">
            <SettingsIcon size={13}/> Configurar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Pagina principal ───────────────────────────────────────────────────────────
export default function IoT() {
  const [tabActiva, setTabActiva] = useState<'dispositivos' | 'lecturas' | 'sesiones'>('dispositivos')
  const [busqueda, setBusqueda] = useState('')
  const [seleccionado, setSeleccionado] = useState<Dispositivo | null>(null)

  const sesionActiva = SESIONES_HOY.find(s => s.estado === 'Activa')

  const dispositivosFiltrados = DISPOSITIVOS.filter(d =>
    d.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    d.marca.toLowerCase().includes(busqueda.toLowerCase()) ||
    d.modelo.toLowerCase().includes(busqueda.toLowerCase())
  )

  const lecturasFiltradas = LECTURAS_RECIENTES.filter(l =>
    l.caravana.toLowerCase().includes(busqueda.toLowerCase()) ||
    (l.animal_nombre || '').toLowerCase().includes(busqueda.toLowerCase())
  )

  // KPIs
  const totalDispositivos = DISPOSITIVOS.length
  const conectados = DISPOSITIVOS.filter(d => d.estado === 'Conectado').length
  const conError = DISPOSITIVOS.filter(d => d.estado === 'Error').length
  const lecturasTotales = DISPOSITIVOS.reduce((acc, d) => acc + (d.lecturas_hoy || 0), 0)
  const bateriaBaja = DISPOSITIVOS.filter(d => d.bateria !== undefined && d.bateria < 30).length

  const actions = (
    <div className="flex gap-2">
      {!sesionActiva && (
        <button className="flex items-center gap-1.5 text-xs font-semibold bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition-colors">
          <Play size={12}/> Iniciar sesion RFID
        </button>
      )}
      <button className="flex items-center gap-1.5 text-xs font-semibold bg-verde-act text-white px-3 py-1.5 rounded-lg hover:bg-verde transition-colors">
        <Plus size={13}/> Agregar dispositivo
      </button>
    </div>
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="IoT & Caravanas RFID" actions={actions}/>
      <div className="flex-1 overflow-y-auto p-4">

        {/* Sesión activa banner */}
        {sesionActiva && <SesionActivaBanner sesion={sesionActiva}/>}

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-2.5 mb-4">
          <div className="bg-white border border-borde rounded-xl p-3 border-t-2 border-t-verde-ac">
            <div className="text-[10px] text-gris mb-1 uppercase tracking-wide font-medium">Dispositivos totales</div>
            <div className="text-xl font-semibold text-carbon">{totalDispositivos}</div>
            <div className="text-[10px] text-gris">{conectados} conectados ahora</div>
          </div>
          <div className="bg-white border border-borde rounded-xl p-3 border-t-2 border-t-verde-ac">
            <div className="text-[10px] text-gris mb-1 uppercase tracking-wide font-medium">Lecturas hoy</div>
            <div className="text-xl font-semibold text-verde">{lecturasTotales.toLocaleString()}</div>
            <div className="text-[10px] text-gris">animales identificados</div>
          </div>
          <div className={"bg-white border border-borde rounded-xl p-3 border-t-2 " +
            (bateriaBaja > 0 ? 'border-t-ambar' : 'border-t-verde-ac')}>
            <div className="text-[10px] text-gris mb-1 uppercase tracking-wide font-medium">Batería baja</div>
            <div className={"text-xl font-semibold " + (bateriaBaja > 0 ? 'text-ambar' : 'text-verde')}>
              {bateriaBaja}
            </div>
            <div className="text-[10px] text-gris">dispositivos &lt;30%</div>
          </div>
          <div className={"bg-white border border-borde rounded-xl p-3 border-t-2 " +
            (conError > 0 ? 'border-t-rojo' : 'border-t-verde-ac')}>
            <div className="text-[10px] text-gris mb-1 uppercase tracking-wide font-medium">Con error</div>
            <div className={"text-xl font-semibold " + (conError > 0 ? 'text-rojo' : 'text-verde')}>
              {conError}
            </div>
            <div className="text-[10px] text-gris">requieren atención</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 bg-white border border-borde rounded-xl p-1 w-fit mb-3">
          {([
            { id:'dispositivos', label:'Dispositivos', count: DISPOSITIVOS.length },
            { id:'lecturas',     label:'Lecturas en vivo', count: LECTURAS_RECIENTES.length },
            { id:'sesiones',     label:'Sesiones', count: SESIONES_HOY.length },
          ] as const).map(t => (
            <button key={t.id}
              onClick={() => setTabActiva(t.id)}
              className={"px-4 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 " +
                (tabActiva === t.id ? 'bg-verde text-white' : 'text-gris hover:bg-tierra')}>
              {t.label}
              <span className={"text-[10px] px-1.5 rounded-full " +
                (tabActiva === t.id ? 'bg-white/20' : 'bg-tierra')}>{t.count}</span>
            </button>
          ))}
        </div>

        {/* Búsqueda */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-2 bg-white border border-borde rounded-lg px-3 py-1.5 flex-1 max-w-xs">
            <Search size={13} className="text-gris flex-shrink-0"/>
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder={tabActiva === 'dispositivos' ? 'Buscar dispositivo...' : 'Buscar caravana, animal...'}
              className="text-xs outline-none bg-transparent flex-1 text-carbon placeholder:text-gris"/>
          </div>
        </div>

        {/* Tab: Dispositivos */}
        {tabActiva === 'dispositivos' && (
          <div className={"grid gap-3 " + (seleccionado ? 'grid-cols-[1fr_320px]' : 'grid-cols-1')}>
            <div className={"grid gap-2.5 " + (seleccionado ? 'grid-cols-2' : 'grid-cols-3')}>
              {dispositivosFiltrados.map(d => {
                const colors = getEstadoColor(d.estado)
                const batColor = getBateriaColor(d.bateria)
                return (
                  <div key={d.id}
                    onClick={() => setSeleccionado(seleccionado?.id === d.id ? null : d)}
                    className={"bg-white border rounded-xl p-3 cursor-pointer transition-all hover:shadow-md " +
                      (seleccionado?.id === d.id ? 'border-verde-act bg-verde-s' : 'border-borde hover:border-gris')}>
                    <div className="flex items-start gap-2.5">
                      <div className={"w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 " +
                        (d.estado === 'Conectado' ? 'bg-verde-s text-verde' :
                         d.estado === 'Error' ? 'bg-rojo-s text-rojo' : 'bg-tierra text-gris')}>
                        {getTipoIcon(d.tipo)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={"w-1.5 h-1.5 rounded-full " + colors.dot}/>
                          <p className="text-xs font-semibold text-carbon truncate">{d.nombre}</p>
                        </div>
                        <p className="text-[10px] text-gris truncate mt-0.5">{d.marca} {d.modelo}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          {d.bateria !== undefined && (
                            <span className={"flex items-center gap-0.5 text-[10px] " + batColor}>
                              {getBateriaIcon(d.bateria)} {d.bateria}%
                            </span>
                          )}
                          {d.lecturas_hoy !== undefined && d.lecturas_hoy > 0 && (
                            <span className="text-[10px] text-verde font-medium">
                              {d.lecturas_hoy} lecturas
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-borde flex items-center justify-between">
                      <span className="text-[10px] text-gris">{d.ubicacion || '—'}</span>
                      <span className={colors.chip + " text-[10px]"}>{d.estado}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {seleccionado && (
              <PanelDetalleDispositivo d={seleccionado} onClose={() => setSeleccionado(null)}/>
            )}
          </div>
        )}

        {/* Tab: Lecturas en vivo */}
        {tabActiva === 'lecturas' && (
          <div className="bg-white border border-borde rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-borde flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-verde-ac opacity-75"/>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-verde-act"/>
                </span>
                <h3 className="text-sm font-medium text-carbon">Lecturas en tiempo real</h3>
              </div>
              <span className="text-[10px] text-gris">Auto-actualizando cada 2 seg</span>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-tierra border-b border-borde">
                  {['Hora','Caravana','Animal','Peso','Estado','Dispositivo'].map(h => (
                    <th key={h} className="text-left px-3 py-2 font-medium text-gris">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-borde">
                {lecturasFiltradas.map(l => (
                  <tr key={l.id} className="hover:bg-tierra/50 transition-colors">
                    <td className="px-3 py-2 text-gris font-mono text-[11px]">{l.hora}</td>
                    <td className="px-3 py-2">
                      <span className="font-mono text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                        {l.caravana}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-carbon">{l.animal_nombre || <span className="text-rojo italic">Sin registrar</span>}</td>
                    <td className="px-3 py-2 font-medium text-carbon">{l.peso ? l.peso + ' kg' : '—'}</td>
                    <td className="px-3 py-2">
                      {l.estado === 'OK' && (
                        <span className="chip chip-green flex items-center gap-1 w-fit">
                          <CheckCircle2 size={10}/> OK
                        </span>
                      )}
                      {l.estado === 'Alerta' && (
                        <span className="chip chip-red flex items-center gap-1 w-fit" title={l.alerta_motivo}>
                          <AlertTriangle size={10}/> {l.alerta_motivo}
                        </span>
                      )}
                      {l.estado === 'No registrado' && (
                        <span className="chip chip-amber flex items-center gap-1 w-fit">
                          <AlertTriangle size={10}/> {l.alerta_motivo}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-gris text-[11px]">{l.dispositivo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab: Sesiones */}
        {tabActiva === 'sesiones' && (
          <div className="bg-white border border-borde rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-tierra border-b border-borde">
                  {['Inicio','Fin','Duración','Dispositivo','Animales','Alertas','Estado'].map(h => (
                    <th key={h} className="text-left px-3 py-2 font-medium text-gris">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-borde">
                {SESIONES_HOY.map(s => (
                  <tr key={s.id} className="hover:bg-tierra/50 transition-colors">
                    <td className="px-3 py-2 text-gris font-mono">{s.inicio}</td>
                    <td className="px-3 py-2 text-gris font-mono">{s.fin || '—'}</td>
                    <td className="px-3 py-2 text-carbon font-medium">{s.duracion_minutos} min</td>
                    <td className="px-3 py-2 text-carbon">{s.dispositivo}</td>
                    <td className="px-3 py-2 font-semibold text-verde">{s.animales_leidos}</td>
                    <td className="px-3 py-2 font-semibold text-ambar">{s.alertas}</td>
                    <td className="px-3 py-2">
                      {s.estado === 'Activa' && (
                        <span className="chip chip-green flex items-center gap-1 w-fit">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-verde-act opacity-75"/>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-verde-act"/>
                          </span>
                          Activa
                        </span>
                      )}
                      {s.estado === 'Finalizada' && <span className="chip chip-gray">Finalizada</span>}
                      {s.estado === 'Pausada' && <span className="chip chip-amber">Pausada</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  )
}
