'use client'
import { useState, useEffect } from 'react'
import { Search, Plus, Wrench, AlertTriangle, X, Calendar, Upload } from 'lucide-react'
import Topbar from '@/components/Topbar'
import { createClient } from '@/lib/supabase'
import { useEstablecimiento } from '@/hooks/useEstablecimiento'
import toast from 'react-hot-toast'
import dynamic from 'next/dynamic'
import type { ColumnDef } from '@/components/ImportExcelModal'
const ImportExcelModal = dynamic(() => import('@/components/ImportExcelModal'), { ssr: false })

const IMPORT_COLUMNS: ColumnDef[] = [
  { key: 'nombre',                    header: 'Nombre',                   required: true,  type: 'string' },
  { key: 'tipo',                      header: 'Tipo',                     required: true,  type: 'enum',   enumValues: ['Tractor','Cosechadora','Sembradora','Pulverizadora','Camion','Implemento','Otro'] },
  { key: 'marca',                     header: 'Marca',                    required: false, type: 'string' },
  { key: 'modelo',                    header: 'Modelo',                   required: false, type: 'string' },
  { key: 'ano',                       header: 'Año',                      required: false, type: 'number' },
  { key: 'patente',                   header: 'Patente',                  required: false, type: 'string' },
  { key: 'horometro',                 header: 'Horometro',                required: false, type: 'number' },
  { key: 'horometro_proximo_service', header: 'Horometro Proximo Service',required: false, type: 'number' },
  { key: 'estado',                    header: 'Estado',                   required: true,  type: 'enum',   enumValues: ['Operativa','En mantenimiento','Fuera de servicio'] },
]

const IMPORT_EXAMPLES: unknown[][] = [
  ['John Deere 6130J',   'Tractor',     'John Deere', '6130J',  2019, 'AB 123 CD', 2850, 3000, 'Operativa'],
  ['Case IH 8240',       'Cosechadora', 'Case IH',    '8240',   2017, 'EF 456 GH',  890,    0, 'Operativa'],
  ['Sembr. Apache 900',  'Sembradora',  'Apache',     '900/39', 2020, '',             0,    0, 'Operativa'],
]

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

// ── Helpers ────────────────────────────────────────────────────────────────────
function getEstadoChip(e: EstadoMaquina) {
  const map: Record<EstadoMaquina, string> = {
    'Operativa':         'chip chip-green',
    'En mantenimiento':  'chip chip-amber',
    'Fuera de servicio': 'chip chip-red',
  }
  return map[e]
}

function getServiceStatus(m: Maquina) {
  if (m.horometro_proximo_service === 0) return 'sin-service'
  const diff = m.horometro_proximo_service - m.horometro
  if (diff <= 0)   return 'vencido'
  if (diff <= 50)  return 'urgente'
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
  const [y, mo, day] = d.split('-')
  return `${day}/${mo}/${y}`
}

// ── Panel detalle ──────────────────────────────────────────────────────────────
function PanelDetalleMaquina({ maquina, onClose }: { maquina: Maquina, onClose: () => void }) {
  const serviceStatus = getServiceStatus(maquina)
  const tanquePct = maquina.combustible_actual != null && maquina.capacidad_tanque
    ? Math.round((maquina.combustible_actual / maquina.capacidad_tanque) * 100)
    : 0

  return (
    <div className="bg-white border border-borde rounded-xl overflow-hidden">
      <div className="bg-verde px-4 py-3 flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">{maquina.nombre}</p>
          <p className="text-xs text-white/60 mt-0.5">{maquina.marca} {maquina.modelo} · {maquina.ano || '—'}</p>
          <div className="flex gap-1.5 mt-1.5">
            <span className={getEstadoChip(maquina.estado)}>{maquina.estado}</span>
            <span className="chip" style={{background:'rgba(255,255,255,.15)',color:'#fff'}}>{maquina.tipo}</span>
          </div>
        </div>
        <button onClick={onClose} className="text-white/50 hover:text-white"><X size={14}/></button>
      </div>

      <div className="p-4 divide-y divide-borde">
        {/* Horómetro */}
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
        {maquina.combustible_actual != null && maquina.capacidad_tanque && (
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
            <p className="text-[10px] text-gris">
              {tanquePct}% del tanque
              {maquina.consumo_promedio ? ` · Consumo promedio: ${maquina.consumo_promedio} L/h` : ''}
            </p>
          </div>
        )}

        {/* Datos */}
        <div className="py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-2">Información</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              ['Patente', maquina.patente || '—'],
              ['Año', maquina.ano ? maquina.ano.toString() : '—'],
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
                      {m.costo > 0 && <span className="text-[10px] text-gris">USD {m.costo}</span>}
                    </div>
                    <p className="text-[11px] text-gris">{m.detalle}</p>
                    <p className="text-[10px] text-gris mt-0.5">
                      {formatDate(m.fecha)}{m.horometro > 0 ? ` · ${m.horometro.toLocaleString()} hs` : ''}
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

// ── Formulario nueva máquina ───────────────────────────────────────────────────
function FormNuevo({
  establecimientoId,
  onClose,
  onSuccess,
}: {
  establecimientoId: string
  onClose: () => void
  onSuccess: (m: Maquina) => void
}) {
  const [form, setForm] = useState({
    nombre: '', tipo: 'Tractor' as TipoMaquina, marca: '', modelo: '',
    ano: '', patente: '', horometro: '0', horometro_proximo_service: '',
    estado: 'Operativa' as EstadoMaquina,
  })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!form.nombre.trim()) { toast.error('El nombre del equipo es obligatorio'); return }
    setSaving(true)
    try {
      const supabase = createClient()
      const id = crypto.randomUUID()
      const { error: dbError } = await supabase
        .from('maquinas')
        .insert({
          id,
          establecimiento_id: establecimientoId,
          nombre: form.nombre.trim(),
          tipo: form.tipo,
          marca: form.marca.trim() || null,
          modelo: form.modelo.trim() || null,
          ano: form.ano ? Number(form.ano) : null,
          patente: form.patente.trim() || null,
          horometro: Number(form.horometro) || 0,
          horometro_proximo_service: form.horometro_proximo_service
            ? Number(form.horometro_proximo_service) : null,
          estado: form.estado,
        })

      if (dbError) {
        console.error('[Maquinaria] Error al guardar:', dbError.message, dbError.code)
        toast.error('No se pudo guardar la máquina. Intentá de nuevo.')
        return
      }

      toast.success('Máquina guardada correctamente')
      onSuccess({
        id,
        nombre: form.nombre.trim(),
        tipo: form.tipo,
        marca: form.marca.trim(),
        modelo: form.modelo.trim(),
        ano: Number(form.ano) || 0,
        patente: form.patente.trim() || undefined,
        horometro: Number(form.horometro) || 0,
        horometro_proximo_service: form.horometro_proximo_service
          ? Number(form.horometro_proximo_service) : 0,
        estado: form.estado,
        mantenimientos: [],
        cargas_combustible: [],
      })
    } catch (err) {
      console.error('[Maquinaria] Error inesperado:', err)
      toast.error('Error inesperado. Intentá de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const inp = "w-full text-xs border border-borde rounded-lg px-3 py-2 bg-white text-carbon outline-none focus:border-verde-act transition-colors"
  const lbl = "text-[10px] font-semibold uppercase tracking-wider text-gris mb-1 block"

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="bg-verde px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Nueva máquina</p>
            <p className="text-xs text-white/60 mt-0.5">Completá los datos del equipo</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <X size={18}/>
          </button>
        </div>
        <div className="p-5 grid grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto">
          <div className="col-span-2">
            <label className={lbl}>Nombre del equipo *</label>
            <input className={inp} placeholder="ej. JD 6130J" value={form.nombre}
              onChange={e => setForm({...form, nombre: e.target.value})}/>
          </div>
          <div>
            <label className={lbl}>Tipo *</label>
            <select className={inp} value={form.tipo}
              onChange={e => setForm({...form, tipo: e.target.value as TipoMaquina})}>
              {(['Tractor','Cosechadora','Sembradora','Pulverizadora','Implemento','Camion','Otro'] as TipoMaquina[]).map(t =>
                <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Estado *</label>
            <select className={inp} value={form.estado}
              onChange={e => setForm({...form, estado: e.target.value as EstadoMaquina})}>
              {(['Operativa','En mantenimiento','Fuera de servicio'] as EstadoMaquina[]).map(e =>
                <option key={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Marca</label>
            <input className={inp} placeholder="ej. John Deere" value={form.marca}
              onChange={e => setForm({...form, marca: e.target.value})}/>
          </div>
          <div>
            <label className={lbl}>Modelo</label>
            <input className={inp} placeholder="ej. 6130J" value={form.modelo}
              onChange={e => setForm({...form, modelo: e.target.value})}/>
          </div>
          <div>
            <label className={lbl}>Año</label>
            <input className={inp} type="number" placeholder="ej. 2020" value={form.ano}
              onChange={e => setForm({...form, ano: e.target.value})}/>
          </div>
          <div>
            <label className={lbl}>Patente</label>
            <input className={inp} placeholder="ej. TR-AAA-001" value={form.patente}
              onChange={e => setForm({...form, patente: e.target.value})}/>
          </div>
          <div>
            <label className={lbl}>Horómetro inicial (hs)</label>
            <input className={inp} type="number" placeholder="0" value={form.horometro}
              onChange={e => setForm({...form, horometro: e.target.value})}/>
          </div>
          <div>
            <label className={lbl}>Próximo service (hs)</label>
            <input className={inp} type="number" placeholder="ej. 3000" value={form.horometro_proximo_service}
              onChange={e => setForm({...form, horometro_proximo_service: e.target.value})}/>
          </div>
        </div>
        <div className="px-5 py-4 border-t border-borde flex justify-end gap-2">
          <button onClick={onClose} disabled={saving}
            className="text-xs font-medium px-4 py-2 rounded-lg border border-borde text-carbon hover:bg-tierra transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving}
            className="text-xs font-semibold px-4 py-2 rounded-lg bg-verde-act text-white hover:bg-verde transition-colors disabled:opacity-60">
            {saving ? 'Guardando...' : 'Guardar máquina'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Pagina principal ───────────────────────────────────────────────────────────
export default function Maquinaria() {
  const { establecimiento, loading: loadingEst } = useEstablecimiento()
  const [maquinas, setMaquinas] = useState<Maquina[]>([])
  const [loadingMaq, setLoadingMaq] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [mostrarImport, setMostrarImport] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [busqueda, setBusqueda] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState<string>('Todos')
  const [soloAlertas, setSoloAlertas] = useState(false)
  const [seleccionada, setSeleccionada] = useState<Maquina | null>(null)

  useEffect(() => {
    if (!establecimiento?.id) return

    let cancelled = false
    async function cargar() {
      setLoadingMaq(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from('maquinas')
        .select('*, mantenimientos(*), cargas_combustible(*)')
        .eq('establecimiento_id', establecimiento!.id)
        .order('nombre')

      if (cancelled) return
      if (error) {
        console.error('[Maquinaria] Error al cargar:', error.message)
        setLoadingMaq(false)
        return
      }

      const mapped: Maquina[] = (data ?? []).map(m => {
        // Ordenar mantenimientos por fecha DESC para mostrar los más recientes primero
        const mans = ((m.mantenimientos ?? []) as Record<string, unknown>[])
          .sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)))
          .map(man => ({
            id: man.id as string,
            fecha: man.fecha as string,
            tipo: man.tipo as Mantenimiento['tipo'],
            detalle: man.detalle as string,
            horometro: man.horometro != null ? Number(man.horometro) : 0,
            costo: Number(man.costo),
            operario: (man.operario ?? '') as string,
          }))

        // Ordenar cargas por fecha DESC para que el KPI tome las últimas dos cargas correctamente
        const cargas = ((m.cargas_combustible ?? []) as Record<string, unknown>[])
          .sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)))
          .map(c => ({
            fecha: c.fecha as string,
            litros: Number(c.litros),
            horometro: c.horometro != null ? Number(c.horometro) : 0,
            costo: Number(c.costo),
          }))

        return {
          id: m.id as string,
          nombre: m.nombre as string,
          tipo: m.tipo as TipoMaquina,
          marca: (m.marca ?? '') as string,
          modelo: (m.modelo ?? '') as string,
          ano: (m.ano ?? 0) as number,
          patente: m.patente ?? undefined,
          horometro: Number(m.horometro),
          // DB tiene nullable; UI usa 0 para indicar "sin service programado"
          horometro_proximo_service: m.horometro_proximo_service != null
            ? Number(m.horometro_proximo_service) : 0,
          estado: m.estado as EstadoMaquina,
          combustible_actual: m.combustible_actual != null ? Number(m.combustible_actual) : undefined,
          capacidad_tanque: m.capacidad_tanque != null ? Number(m.capacidad_tanque) : undefined,
          consumo_promedio: m.consumo_promedio != null ? Number(m.consumo_promedio) : undefined,
          ultimo_service: m.ultimo_service ?? undefined,
          observaciones: m.observaciones ?? undefined,
          mantenimientos: mans,
          cargas_combustible: cargas,
        }
      })

      setMaquinas(mapped)
      setLoadingMaq(false)
    }

    cargar()
    return () => { cancelled = true }
  }, [establecimiento?.id, refreshKey])

  const loading = loadingEst || loadingMaq

  function handleSuccess(m: Maquina) {
    setMaquinas(prev => [...prev, m].sort((a, b) => a.nombre.localeCompare(b.nombre)))
    setMostrarForm(false)
    setSeleccionada(m)
  }

  const filtradas = maquinas.filter(m => {
    const matchBusqueda = m.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      m.marca.toLowerCase().includes(busqueda.toLowerCase()) ||
      m.modelo.toLowerCase().includes(busqueda.toLowerCase())
    const matchTipo = tipoFiltro === 'Todos' || m.tipo === tipoFiltro
    const status = getServiceStatus(m)
    const matchAlerta = !soloAlertas || status === 'vencido' || status === 'urgente' || m.estado !== 'Operativa'
    return matchBusqueda && matchTipo && matchAlerta
  })

  // KPIs
  const operativas = maquinas.filter(m => m.estado === 'Operativa').length
  const alertasService = maquinas.filter(m => {
    const s = getServiceStatus(m)
    return s === 'vencido' || s === 'urgente'
  }).length
  const horasMes = maquinas.reduce((acc, m) => {
    if (m.cargas_combustible.length < 2) return acc
    const ultima = m.cargas_combustible[0]
    const anteultima = m.cargas_combustible[1]
    return acc + Math.max(0, ultima.horometro - anteultima.horometro)
  }, 0)
  const costoMantenimientos = maquinas.reduce((acc, m) =>
    acc + m.mantenimientos.reduce((sum, x) => sum + x.costo, 0), 0)

  const actions = (
    <div className="flex gap-2">
      <button onClick={() => setMostrarImport(true)} disabled={!establecimiento}
        className="flex items-center gap-1.5 text-xs font-medium border border-borde bg-white text-carbon px-3 py-1.5 rounded-lg hover:bg-tierra transition-colors disabled:opacity-60">
        <Upload size={12}/> Importar Excel
      </button>
      <button
        onClick={() => setMostrarForm(true)}
        className="flex items-center gap-1.5 text-xs font-semibold bg-verde-act text-white px-3 py-1.5 rounded-lg hover:bg-verde transition-colors">
        <Plus size={13}/> Nueva máquina
      </button>
    </div>
  )

  if (loading) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <Topbar title="Maquinaria" actions={actions}/>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gris">Cargando maquinaria...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {mostrarImport && establecimiento && (
        <ImportExcelModal
          entityName="máquinas"
          entityLabel="Maquinaria"
          tableName="maquinas"
          columns={IMPORT_COLUMNS}
          exampleRows={IMPORT_EXAMPLES}
          establecimientoId={establecimiento.id}
          onClose={() => setMostrarImport(false)}
          onSuccess={() => setRefreshKey(k => k + 1)}
        />
      )}
      {mostrarForm && establecimiento && (
        <FormNuevo
          establecimientoId={establecimiento.id}
          onClose={() => setMostrarForm(false)}
          onSuccess={handleSuccess}
        />
      )}
      <Topbar title="Maquinaria" actions={actions}/>
      <div className="flex-1 overflow-y-auto p-4">

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-2.5 mb-4">
          {[
            { l:'Total equipos',       v: maquinas.length.toString(),               s: operativas + ' operativas',             c:'border-t-verde-ac' },
            { l:'Alertas de service',  v: alertasService.toString(),                 s:'requieren atención pronto',              c: alertasService > 0 ? 'border-t-rojo' : 'border-t-verde-ac' },
            { l:'Horas trabajadas',    v: horasMes + ' hs',                          s:'desde última carga combustible',         c:'border-t-azul' },
            { l:'Costo mantenimiento', v:'USD ' + costoMantenimientos.toLocaleString(), s:'acumulado historial',                 c:'border-t-ambar' },
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

        {/* Sin máquinas */}
        {maquinas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Wrench size={40} className="text-borde mb-3"/>
            <p className="text-sm font-medium text-carbon mb-1">No hay máquinas registradas</p>
            <p className="text-xs text-gris">Usá el botón <strong>Nueva máquina</strong> para agregar el primer equipo</p>
          </div>
        ) : (
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
                    const tanquePct = maquina.combustible_actual != null && maquina.capacidad_tanque
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
                          {serviceStatus === 'vencido'    && <span className="chip chip-red">VENCIDO</span>}
                          {serviceStatus === 'urgente'    && <span className="chip chip-red">{serviceLabel}</span>}
                          {serviceStatus === 'proximo'    && <span className="chip chip-amber">{serviceLabel}</span>}
                          {serviceStatus === 'ok'         && <span className="chip chip-green">{serviceLabel}</span>}
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
              {filtradas.length === 0 && maquinas.length > 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Wrench size={32} className="text-borde mb-3"/>
                  <p className="text-sm font-medium text-carbon mb-1">No hay equipos con ese filtro</p>
                  <p className="text-xs text-gris">Cambia los filtros para ver otros equipos</p>
                </div>
              )}
            </div>

            {/* Panel detalle */}
            {seleccionada && (
              <PanelDetalleMaquina maquina={seleccionada} onClose={() => setSeleccionada(null)}/>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
