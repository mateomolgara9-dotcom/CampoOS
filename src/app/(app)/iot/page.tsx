'use client'
import { useState, useEffect } from 'react'
import { Search, Plus, Antenna, X, Wifi, WifiOff, Battery, BatteryLow, Activity,
         CheckCircle2, AlertTriangle, Clock, Scale, Bluetooth, Play, Pause,
         RefreshCw, Settings as SettingsIcon, MapPin } from 'lucide-react'
import Topbar from '@/components/Topbar'
import { createBrowserClient } from '@supabase/ssr'
import { useEstablecimiento } from '@/hooks/useEstablecimiento'
import toast from 'react-hot-toast'

// ── Tipos ─────────────────────────────────────────────────────────────────────
type TipoDispositivo = 'Lector manga' | 'Lector portatil' | 'Bascula' | 'Lector + Bascula' | 'Collar GPS' | 'Estacion meteo'
type EstadoDispositivo = 'Conectado' | 'Disponible' | 'Desconectado' | 'Error'
type EstadoSesion = 'Activa' | 'Pausada' | 'Finalizada'

type SesionRFID = {
  id: string
  inicio: string
  fin?: string
  dispositivo_id: string
  dispositivo_nombre: string
  estado: EstadoSesion
  animales_leidos: number
  alertas: number
  duracion_minutos: number
}

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
  sesiones: SesionRFID[]
}

type LecturaRFID = {
  id: string
  hora: string
  caravana: string
  animal_nombre?: string
  peso?: number
  estado: 'OK' | 'Alerta' | 'No registrado'
  alerta_motivo?: string
  dispositivo_id: string
}

// ── Tipos DB ──────────────────────────────────────────────────────────────────
type SesionDB = {
  id: string
  dispositivo_id: string
  inicio: string
  fin: string | null
  estado: string
  animales_leidos: number
  alertas: number
  duracion_minutos: number
}

type LecturaDB = {
  id: string
  dispositivo_id: string
  hora: string
  caravana: string
  peso: string | null
  estado: string
  alerta_motivo: string | null
  animales: { nombre: string } | null
}

type DispositivoDB = {
  id: string
  nombre: string
  tipo: string
  marca: string | null
  modelo: string | null
  mac: string | null
  estado: string
  bateria: number | null
  ultima_conexion: string
  ubicacion: string | null
  lecturas_hoy: number
  firmware: string | null
  sesiones_rfid: SesionDB[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatConexion(ts: string): string {
  const diffMin = Math.floor((Date.now() - new Date(ts).getTime()) / 60000)
  if (diffMin < 1) return 'ahora mismo'
  if (diffMin < 60) return `hace ${diffMin} min`
  const diffHs = Math.floor(diffMin / 60)
  if (diffHs < 24) return `hace ${diffHs} hs`
  return `hace ${Math.floor(diffHs / 24)} días`
}

function formatHora(ts: string): string {
  return new Date(ts).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

function mapDispositivo(d: DispositivoDB): Dispositivo {
  const sesiones: SesionRFID[] = (d.sesiones_rfid || [])
    .map(s => ({
      id: s.id,
      inicio: formatHora(s.inicio),
      fin: s.fin ? formatHora(s.fin) : undefined,
      dispositivo_id: d.id,
      dispositivo_nombre: d.nombre,
      estado: s.estado as EstadoSesion,
      animales_leidos: s.animales_leidos,
      alertas: s.alertas,
      duracion_minutos: s.duracion_minutos,
    }))
    .sort((a, b) => {
      if (a.estado === 'Activa' && b.estado !== 'Activa') return -1
      if (b.estado === 'Activa' && a.estado !== 'Activa') return 1
      return 0
    })

  return {
    id: d.id,
    nombre: d.nombre,
    tipo: d.tipo as TipoDispositivo,
    marca: d.marca ?? '',
    modelo: d.modelo ?? '',
    mac: d.mac ?? '',
    estado: d.estado as EstadoDispositivo,
    bateria: d.bateria ?? undefined,
    ultima_conexion: formatConexion(d.ultima_conexion),
    ubicacion: d.ubicacion ?? undefined,
    lecturas_hoy: d.lecturas_hoy,
    firmware: d.firmware ?? undefined,
    sesiones,
  }
}

function mapLectura(l: LecturaDB): LecturaRFID {
  return {
    id: l.id,
    hora: formatHora(l.hora),
    caravana: l.caravana,
    animal_nombre: l.animales?.nombre,
    peso: l.peso != null ? Number(l.peso) : undefined,
    estado: l.estado as 'OK' | 'Alerta' | 'No registrado',
    alerta_motivo: l.alerta_motivo ?? undefined,
    dispositivo_id: l.dispositivo_id,
  }
}

function getEstadoColor(e: EstadoDispositivo) {
  if (e === 'Conectado')  return { chip: 'chip chip-green', dot: 'bg-verde-act', icon: <Wifi size={12}/> }
  if (e === 'Disponible') return { chip: 'chip chip-blue',  dot: 'bg-azul',      icon: <Bluetooth size={12}/> }
  if (e === 'Error')      return { chip: 'chip chip-red',   dot: 'bg-rojo',      icon: <AlertTriangle size={12}/> }
  return                         { chip: 'chip chip-gray',  dot: 'bg-gray-400',  icon: <WifiOff size={12}/> }
}

function getTipoIcon(t: TipoDispositivo) {
  if (t === 'Bascula')        return <Scale size={14}/>
  if (t === 'Collar GPS')     return <MapPin size={14}/>
  if (t === 'Estacion meteo') return <Activity size={14}/>
  return <Antenna size={14}/>
}

function getBateriaColor(b?: number) {
  if (b === undefined) return 'text-gris'
  if (b > 50) return 'text-verde-act'
  if (b > 20) return 'text-ambar'
  return 'text-rojo'
}

function getBateriaIcon(b?: number) {
  if (b === undefined || b <= 20) return <BatteryLow size={14}/>
  return <Battery size={14}/>
}

// ── Formulario nuevo dispositivo ──────────────────────────────────────────────
const TIPOS_DISPOSITIVO: TipoDispositivo[] = [
  'Lector manga', 'Lector portatil', 'Bascula', 'Lector + Bascula', 'Collar GPS', 'Estacion meteo',
]

function FormNuevoDispositivo({
  establecimientoId, onClose, onSuccess,
}: {
  establecimientoId: string
  onClose: () => void
  onSuccess: (d: Dispositivo) => void
}) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [nombre, setNombre]       = useState('')
  const [tipo, setTipo]           = useState<TipoDispositivo>('Lector manga')
  const [marca, setMarca]         = useState('')
  const [modelo, setModelo]       = useState('')
  const [mac, setMac]             = useState('')
  const [ubicacion, setUbicacion] = useState('')
  const [firmware, setFirmware]   = useState('')
  const [saving, setSaving]       = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) { toast.error('El nombre es obligatorio'); return }
    setSaving(true)
    try {
      const id = crypto.randomUUID()
      const { error: err } = await supabase.from('dispositivos_iot').insert({
        id,
        establecimiento_id: establecimientoId,
        nombre:    nombre.trim(),
        tipo,
        marca:     marca.trim()    || null,
        modelo:    modelo.trim()   || null,
        mac:       mac.trim()      || null,
        ubicacion: ubicacion.trim() || null,
        firmware:  firmware.trim() || null,
      })
      if (err) throw err
      toast.success('Dispositivo registrado correctamente')
      onSuccess({
        id,
        nombre:   nombre.trim(),
        tipo,
        marca:    marca.trim(),
        modelo:   modelo.trim(),
        mac:      mac.trim(),
        estado:   'Disponible',
        bateria:  undefined,
        ultima_conexion: 'recién registrado',
        ubicacion: ubicacion.trim() || undefined,
        lecturas_hoy: 0,
        firmware: firmware.trim() || undefined,
        sesiones: [],
      })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-borde">
          <h2 className="text-sm font-semibold text-carbon">Nuevo dispositivo IoT</h2>
          <button onClick={onClose} className="text-gris hover:text-carbon"><X size={16}/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-2">Datos básicos</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gris block mb-1">Nombre *</label>
                <input value={nombre} onChange={e => setNombre(e.target.value)}
                  placeholder="Ej: Lector Manga Norte"
                  className="w-full border border-borde rounded-lg px-3 py-2 text-xs outline-none focus:border-verde-ac"/>
              </div>
              <div>
                <label className="text-xs text-gris block mb-1">Tipo *</label>
                <select value={tipo} onChange={e => setTipo(e.target.value as TipoDispositivo)}
                  className="w-full border border-borde rounded-lg px-3 py-2 text-xs outline-none focus:border-verde-ac bg-white">
                  {TIPOS_DISPOSITIVO.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gris block mb-1">Marca</label>
                  <input value={marca} onChange={e => setMarca(e.target.value)}
                    placeholder="Ej: Allflex"
                    className="w-full border border-borde rounded-lg px-3 py-2 text-xs outline-none focus:border-verde-ac"/>
                </div>
                <div>
                  <label className="text-xs text-gris block mb-1">Modelo</label>
                  <input value={modelo} onChange={e => setModelo(e.target.value)}
                    placeholder="Ej: RS680"
                    className="w-full border border-borde rounded-lg px-3 py-2 text-xs outline-none focus:border-verde-ac"/>
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-2">Red y ubicación</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gris block mb-1">MAC Address</label>
                <input value={mac} onChange={e => setMac(e.target.value)}
                  placeholder="Ej: AC:BC:32:78:91:F4"
                  className="w-full border border-borde rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-verde-ac"/>
              </div>
              <div>
                <label className="text-xs text-gris block mb-1">Ubicación</label>
                <input value={ubicacion} onChange={e => setUbicacion(e.target.value)}
                  placeholder="Ej: Manga Norte, Casco principal"
                  className="w-full border border-borde rounded-lg px-3 py-2 text-xs outline-none focus:border-verde-ac"/>
              </div>
              <div>
                <label className="text-xs text-gris block mb-1">Firmware</label>
                <input value={firmware} onChange={e => setFirmware(e.target.value)}
                  placeholder="Ej: v2.4.1"
                  className="w-full border border-borde rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-verde-ac"/>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-borde text-carbon text-xs font-medium py-2 rounded-lg hover:bg-tierra transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-verde-act text-white text-xs font-semibold py-2 rounded-lg hover:bg-verde transition-colors disabled:opacity-60">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Banner sesión activa ──────────────────────────────────────────────────────
function SesionActivaBanner({ sesion }: { sesion: SesionRFID }) {
  const [tiempo, setTiempo] = useState(sesion.duracion_minutos)

  useEffect(() => {
    const interval = setInterval(() => setTiempo(t => t + 0.05), 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-verde-n border-2 border-verde-ac rounded-xl p-4 mb-4 relative overflow-hidden">
      <div className="absolute top-3 left-3 flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-verde-ac opacity-75"/>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-verde-ac"/>
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-verde-ac">SESION ACTIVA</span>
      </div>

      <div className="flex items-center justify-between mt-3">
        <div>
          <p className="text-base font-semibold text-white">Operación en {sesion.dispositivo_nombre}</p>
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
          <p className="text-[10px] text-white/60 mb-0.5">Duración</p>
          <p className="text-xl font-semibold text-white">{Math.floor(tiempo)}<span className="text-xs text-white/60"> min</span></p>
        </div>
        <div className="bg-white/10 rounded-lg p-2">
          <p className="text-[10px] text-white/60 mb-0.5">Estado</p>
          <p className="text-xl font-semibold text-verde-ac">Live</p>
        </div>
      </div>
    </div>
  )
}

// ── Panel detalle dispositivo ─────────────────────────────────────────────────
function PanelDetalleDispositivo({ d, onClose }: { d: Dispositivo, onClose: () => void }) {
  const colors   = getEstadoColor(d.estado)
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
        <div className="pb-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-2">Estado del dispositivo</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-tierra rounded-lg p-2.5">
              <div className={"flex items-center gap-1.5 " + batColor}>
                {getBateriaIcon(d.bateria)}
                <span className="text-lg font-semibold">{d.bateria ?? '—'}{d.bateria !== undefined ? '%' : ''}</span>
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

        <div className="py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-2">Datos técnicos</p>
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs text-gris">MAC Address</span>
              <span className="text-xs font-mono font-medium text-carbon">{d.mac || '—'}</span>
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

// ── Página principal ──────────────────────────────────────────────────────────
export default function IoT() {
  const { establecimiento, loading: loadingEst } = useEstablecimiento()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([])
  const [lecturas, setLecturas]         = useState<LecturaRFID[]>([])
  const [loading, setLoading]           = useState(true)
  const [tabActiva, setTabActiva]       = useState<'dispositivos' | 'lecturas' | 'sesiones'>('dispositivos')
  const [busqueda, setBusqueda]         = useState('')
  const [seleccionado, setSeleccionado] = useState<Dispositivo | null>(null)
  const [mostrarForm, setMostrarForm]   = useState(false)

  useEffect(() => {
    if (!establecimiento) return
    let cancelled = false

    async function load() {
      try {
        const { data: dispData, error: dispErr } = await supabase
          .from('dispositivos_iot')
          .select('*, sesiones_rfid(*)')
          .eq('establecimiento_id', establecimiento!.id)
          .order('nombre')

        if (dispErr) throw dispErr
        if (cancelled) return

        const mapped = (dispData || []).map(d => mapDispositivo(d as DispositivoDB))
        setDispositivos(mapped)

        if (mapped.length > 0) {
          const deviceIds = mapped.map(d => d.id)
          const { data: lecData, error: lecErr } = await supabase
            .from('lecturas_rfid')
            .select('*, animales(nombre)')
            .in('dispositivo_id', deviceIds)
            .order('hora', { ascending: false })
            .limit(100)

          if (!lecErr && !cancelled) {
            setLecturas((lecData || []).map(l => mapLectura(l as LecturaDB)))
          }
        }
      } catch (err) {
        console.error('IoT load error:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [establecimiento])

  // Valores derivados
  const sesionActiva      = dispositivos.flatMap(d => d.sesiones).find(s => s.estado === 'Activa')
  const todasLasSesiones  = dispositivos.flatMap(d => d.sesiones)
  const totalDispositivos = dispositivos.length
  const conectados        = dispositivos.filter(d => d.estado === 'Conectado').length
  const conError          = dispositivos.filter(d => d.estado === 'Error').length
  const lecturasTotales   = dispositivos.reduce((acc, d) => acc + (d.lecturas_hoy || 0), 0)
  const bateriaBaja       = dispositivos.filter(d => d.bateria !== undefined && d.bateria < 30).length

  const dispositivosFiltrados = dispositivos.filter(d =>
    d.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    d.marca.toLowerCase().includes(busqueda.toLowerCase()) ||
    d.modelo.toLowerCase().includes(busqueda.toLowerCase())
  )
  const lecturasFiltradas = lecturas.filter(l =>
    l.caravana.toLowerCase().includes(busqueda.toLowerCase()) ||
    (l.animal_nombre || '').toLowerCase().includes(busqueda.toLowerCase())
  )
  const sesionesFiltradas = todasLasSesiones.filter(s =>
    s.dispositivo_nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  function handleSuccess(d: Dispositivo) {
    setDispositivos(prev => [...prev, d].sort((a, b) => a.nombre.localeCompare(b.nombre)))
    setMostrarForm(false)
  }

  const actions = (
    <div className="flex gap-2">
      {!sesionActiva && (
        <button className="flex items-center gap-1.5 text-xs font-semibold bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition-colors">
          <Play size={12}/> Iniciar sesion RFID
        </button>
      )}
      <button
        onClick={() => establecimiento && setMostrarForm(true)}
        disabled={!establecimiento}
        className="flex items-center gap-1.5 text-xs font-semibold bg-verde-act text-white px-3 py-1.5 rounded-lg hover:bg-verde transition-colors disabled:opacity-60">
        <Plus size={13}/> Agregar dispositivo
      </button>
    </div>
  )

  if (loadingEst || loading) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <Topbar title="IoT & Caravanas RFID" actions={actions}/>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gris">Cargando dispositivos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="IoT & Caravanas RFID" actions={actions}/>

      {mostrarForm && establecimiento && (
        <FormNuevoDispositivo
          establecimientoId={establecimiento.id}
          onClose={() => setMostrarForm(false)}
          onSuccess={handleSuccess}
        />
      )}

      <div className="flex-1 overflow-y-auto p-4">

        {sesionActiva && <SesionActivaBanner sesion={sesionActiva}/>}

        {totalDispositivos === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Antenna size={40} className="text-gris mb-3 opacity-40"/>
            <p className="text-sm font-medium text-carbon mb-1">No hay dispositivos registrados</p>
            <p className="text-xs text-gris mb-4">Agregá tu primer lector RFID, báscula o sensor IoT</p>
            <button onClick={() => setMostrarForm(true)}
              className="flex items-center gap-1.5 text-xs font-semibold bg-verde-act text-white px-4 py-2 rounded-lg hover:bg-verde transition-colors">
              <Plus size={13}/> Agregar dispositivo
            </button>
          </div>
        ) : (
          <>
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
                <div className={"text-xl font-semibold " + (bateriaBaja > 0 ? 'text-ambar' : 'text-verde')}>{bateriaBaja}</div>
                <div className="text-[10px] text-gris">dispositivos &lt;30%</div>
              </div>
              <div className={"bg-white border border-borde rounded-xl p-3 border-t-2 " +
                (conError > 0 ? 'border-t-rojo' : 'border-t-verde-ac')}>
                <div className="text-[10px] text-gris mb-1 uppercase tracking-wide font-medium">Con error</div>
                <div className={"text-xl font-semibold " + (conError > 0 ? 'text-rojo' : 'text-verde')}>{conError}</div>
                <div className="text-[10px] text-gris">requieren atención</div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-0.5 bg-white border border-borde rounded-xl p-1 w-fit mb-3">
              {([
                { id: 'dispositivos', label: 'Dispositivos',     count: totalDispositivos },
                { id: 'lecturas',     label: 'Lecturas en vivo', count: lecturas.length },
                { id: 'sesiones',     label: 'Sesiones',         count: todasLasSesiones.length },
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
              dispositivosFiltrados.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Search size={32} className="text-gris mb-2 opacity-40"/>
                  <p className="text-sm font-medium text-carbon mb-1">Sin resultados</p>
                  <p className="text-xs text-gris">No hay dispositivos que coincidan con la búsqueda</p>
                </div>
              ) : (
                <div className={"grid gap-3 " + (seleccionado ? 'grid-cols-[1fr_320px]' : 'grid-cols-1')}>
                  <div className={"grid gap-2.5 " + (seleccionado ? 'grid-cols-2' : 'grid-cols-3')}>
                    {dispositivosFiltrados.map(d => {
                      const colors   = getEstadoColor(d.estado)
                      const batColor = getBateriaColor(d.bateria)
                      return (
                        <div key={d.id}
                          onClick={() => setSeleccionado(seleccionado?.id === d.id ? null : d)}
                          className={"bg-white border rounded-xl p-3 cursor-pointer transition-all hover:shadow-md " +
                            (seleccionado?.id === d.id ? 'border-verde-act bg-verde-s' : 'border-borde hover:border-gris')}>
                          <div className="flex items-start gap-2.5">
                            <div className={"w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 " +
                              (d.estado === 'Conectado' ? 'bg-verde-s text-verde' :
                               d.estado === 'Error'     ? 'bg-rojo-s text-rojo'   : 'bg-tierra text-gris')}>
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
                                  <span className="text-[10px] text-verde font-medium">{d.lecturas_hoy} lecturas</span>
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
              )
            )}

            {/* Tab: Lecturas */}
            {tabActiva === 'lecturas' && (
              lecturas.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Activity size={32} className="text-gris mb-2 opacity-40"/>
                  <p className="text-sm font-medium text-carbon mb-1">Sin lecturas registradas</p>
                  <p className="text-xs text-gris">Las lecturas RFID aparecerán acá cuando los dispositivos estén activos</p>
                </div>
              ) : (
                <div className="bg-white border border-borde rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-borde flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-verde-ac opacity-75"/>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-verde-act"/>
                      </span>
                      <h3 className="text-sm font-medium text-carbon">Lecturas recientes</h3>
                    </div>
                    <span className="text-[10px] text-gris">{lecturas.length} registros</span>
                  </div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-tierra border-b border-borde">
                        {['Hora', 'Caravana', 'Animal', 'Peso', 'Estado'].map(h => (
                          <th key={h} className="text-left px-3 py-2 font-medium text-gris">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-borde">
                      {lecturasFiltradas.length === 0 ? (
                        <tr><td colSpan={5} className="px-3 py-8 text-center text-xs text-gris">Sin resultados para la búsqueda</td></tr>
                      ) : lecturasFiltradas.map(l => (
                        <tr key={l.id} className="hover:bg-tierra/50 transition-colors">
                          <td className="px-3 py-2 text-gris font-mono text-[11px]">{l.hora}</td>
                          <td className="px-3 py-2">
                            <span className="font-mono text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">{l.caravana}</span>
                          </td>
                          <td className="px-3 py-2 text-carbon">
                            {l.animal_nombre || <span className="text-rojo italic">Sin registrar</span>}
                          </td>
                          <td className="px-3 py-2 font-medium text-carbon">{l.peso ? l.peso + ' kg' : '—'}</td>
                          <td className="px-3 py-2">
                            {l.estado === 'OK' && (
                              <span className="chip chip-green flex items-center gap-1 w-fit"><CheckCircle2 size={10}/> OK</span>
                            )}
                            {l.estado === 'Alerta' && (
                              <span className="chip chip-red flex items-center gap-1 w-fit" title={l.alerta_motivo}>
                                <AlertTriangle size={10}/> {l.alerta_motivo || 'Alerta'}
                              </span>
                            )}
                            {l.estado === 'No registrado' && (
                              <span className="chip chip-amber flex items-center gap-1 w-fit">
                                <AlertTriangle size={10}/> {l.alerta_motivo || 'No registrado'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {/* Tab: Sesiones */}
            {tabActiva === 'sesiones' && (
              todasLasSesiones.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Clock size={32} className="text-gris mb-2 opacity-40"/>
                  <p className="text-sm font-medium text-carbon mb-1">Sin sesiones registradas</p>
                  <p className="text-xs text-gris">Las sesiones RFID aparecerán acá cuando se inicien operaciones</p>
                </div>
              ) : (
                <div className="bg-white border border-borde rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-tierra border-b border-borde">
                        {['Inicio', 'Fin', 'Duración', 'Dispositivo', 'Animales', 'Alertas', 'Estado'].map(h => (
                          <th key={h} className="text-left px-3 py-2 font-medium text-gris">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-borde">
                      {sesionesFiltradas.length === 0 ? (
                        <tr><td colSpan={7} className="px-3 py-8 text-center text-xs text-gris">Sin resultados para la búsqueda</td></tr>
                      ) : sesionesFiltradas.map(s => (
                        <tr key={s.id} className="hover:bg-tierra/50 transition-colors">
                          <td className="px-3 py-2 text-gris font-mono">{s.inicio}</td>
                          <td className="px-3 py-2 text-gris font-mono">{s.fin || '—'}</td>
                          <td className="px-3 py-2 text-carbon font-medium">{s.duracion_minutos} min</td>
                          <td className="px-3 py-2 text-carbon">{s.dispositivo_nombre}</td>
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
                            {s.estado === 'Pausada'    && <span className="chip chip-amber">Pausada</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  )
}
