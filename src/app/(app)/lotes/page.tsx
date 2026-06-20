'use client'
import { useState, useEffect } from 'react'
import { Search, Plus, Map as MapIcon, Sprout, Calendar, X, TrendingUp, Layers } from 'lucide-react'
import Topbar from '@/components/Topbar'
import { createClient } from '@/lib/supabase'
import { useEstablecimiento } from '@/hooks/useEstablecimiento'
import toast from 'react-hot-toast'

// ── Tipos ─────────────────────────────────────────────────────────────────────
type EstadoLote = 'Sembrado' | 'Barbecho' | 'Cosechado' | 'Con hacienda' | 'En preparacion'
type TipoUso = 'Agricola' | 'Ganadero' | 'Mixto'

type Labor = {
  id: string
  fecha: string
  tipo: 'Siembra' | 'Fertilizacion' | 'Aplicacion' | 'Cosecha' | 'Pulverizacion' | 'Labranza'
  detalle: string
  operario?: string
  cantidad?: string
}

type Lote = {
  id: string
  nombre: string
  superficie: number
  uso: TipoUso
  estado: EstadoLote
  cultivo_actual?: string
  variedad?: string
  fecha_siembra?: string
  fecha_cosecha_estim?: string
  rendimiento_estim?: number
  rendimiento_real?: number
  hacienda_actual?: number
  pos_x: number
  pos_y: number
  ancho: number
  alto: number
  labores: Labor[]
  observaciones?: string
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function getEstadoColor(estado: EstadoLote) {
  const map: Record<EstadoLote, { bg: string, fill: string, chip: string, border: string }> = {
    'Sembrado':       { bg:'bg-verde-act',    fill:'#2D9E4E',    chip:'chip chip-green',  border:'border-verde-act' },
    'Cosechado':      { bg:'bg-ambar',        fill:'#EF9F27',    chip:'chip chip-amber',  border:'border-ambar' },
    'Barbecho':       { bg:'bg-yellow-600',   fill:'#A88321',    chip:'chip chip-gray',   border:'border-yellow-600' },
    'Con hacienda':   { bg:'bg-azul',         fill:'#185FA5',    chip:'chip chip-blue',   border:'border-azul' },
    'En preparacion': { bg:'bg-gray-400',     fill:'#9CA3AF',    chip:'chip chip-gray',   border:'border-gray-400' },
  }
  return map[estado]
}

function formatDate(d?: string) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function getDiasHastaCosecha(d?: string) {
  if (!d) return null
  const hoy = new Date()
  const cosecha = new Date(d)
  return Math.ceil((cosecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
}

// ── Posiciones automáticas en el mapa SVG (viewBox 120×90) ───────────────────
const POSICIONES_AUTO = [
  { pos_x:  2, pos_y:  2, ancho: 16, alto: 12 },
  { pos_x: 20, pos_y:  2, ancho: 16, alto: 12 },
  { pos_x: 42, pos_y:  2, ancho: 16, alto: 12 },
  { pos_x: 60, pos_y:  2, ancho: 16, alto: 12 },
  { pos_x: 80, pos_y:  2, ancho: 18, alto: 12 },
  { pos_x: 99, pos_y:  2, ancho: 18, alto: 12 },
  { pos_x:  2, pos_y: 34, ancho: 16, alto: 22 },
  { pos_x: 20, pos_y: 34, ancho: 16, alto: 22 },
  { pos_x: 42, pos_y: 34, ancho: 16, alto: 22 },
  { pos_x: 60, pos_y: 34, ancho: 16, alto: 22 },
  { pos_x: 80, pos_y: 34, ancho: 16, alto: 22 },
  { pos_x: 99, pos_y: 34, ancho: 18, alto: 22 },
]

// ── Formulario nuevo lote ─────────────────────────────────────────────────────
function FormNuevoLote({
  establecimientoId, lotesExistentes, onClose, onSuccess,
}: {
  establecimientoId: string
  lotesExistentes: number
  onClose: () => void
  onSuccess: (l: Lote) => void
}) {
  const pos = POSICIONES_AUTO[lotesExistentes % POSICIONES_AUTO.length]

  const [nombre,       setNombre]       = useState('')
  const [superficie,   setSuperficie]   = useState('')
  const [uso,          setUso]          = useState<TipoUso>('Agricola')
  const [estado,       setEstado]       = useState<EstadoLote>('Barbecho')
  const [cultivo,      setCultivo]      = useState('')
  const [variedad,     setVariedad]     = useState('')
  const [fechaSiembra, setFechaSiembra] = useState('')
  const [posX,         setPosX]         = useState(String(pos.pos_x))
  const [posY,         setPosY]         = useState(String(pos.pos_y))
  const [ancho,        setAncho]        = useState(String(pos.ancho))
  const [alto,         setAlto]         = useState(String(pos.alto))
  const [saving,       setSaving]       = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) { toast.error('El nombre del lote es obligatorio'); return }
    const sup = Number(superficie)
    if (!superficie || isNaN(sup) || sup <= 0) { toast.error('La superficie debe ser un número positivo'); return }

    setSaving(true)
    try {
      const supabase = createClient()
      const id = crypto.randomUUID()
      const { error: err } = await supabase.from('lotes').insert({
        id,
        establecimiento_id: establecimientoId,
        nombre:          nombre.trim(),
        superficie:      sup,
        uso,
        estado,
        cultivo_actual:  cultivo.trim()  || null,
        variedad:        variedad.trim() || null,
        fecha_siembra:   fechaSiembra    || null,
        pos_x:  Number(posX)  || pos.pos_x,
        pos_y:  Number(posY)  || pos.pos_y,
        ancho:  Number(ancho) || pos.ancho,
        alto:   Number(alto)  || pos.alto,
      })
      if (err) throw err
      toast.success('Lote guardado correctamente')
      onSuccess({
        id,
        nombre:          nombre.trim(),
        superficie:      sup,
        uso,
        estado,
        cultivo_actual:  cultivo.trim()  || undefined,
        variedad:        variedad.trim() || undefined,
        fecha_siembra:   fechaSiembra    || undefined,
        pos_x:  Number(posX)  || pos.pos_x,
        pos_y:  Number(posY)  || pos.pos_y,
        ancho:  Number(ancho) || pos.ancho,
        alto:   Number(alto)  || pos.alto,
        labores: [],
      })
    } catch (err) {
      console.error('[Lotes] Error al guardar:', err)
      toast.error('No se pudo guardar el lote. Verificá tu conexión e intentá de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const inp = 'w-full border border-borde rounded-lg px-3 py-2 text-xs outline-none focus:border-verde-act bg-white'
  const lbl = 'text-xs text-gris block mb-1'

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-borde sticky top-0 bg-white z-10">
          <h2 className="text-sm font-semibold text-carbon">Nuevo lote</h2>
          <button onClick={onClose} className="text-gris hover:text-carbon"><X size={16}/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-5">

          {/* Datos básicos */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-3">Datos básicos</p>
            <div className="space-y-3">
              <div>
                <label className={lbl}>Nombre *</label>
                <input value={nombre} onChange={e => setNombre(e.target.value)}
                  placeholder="Ej: Lote 1 Norte" className={inp}/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Superficie (ha) *</label>
                  <input type="number" min="0.1" step="0.1" value={superficie}
                    onChange={e => setSuperficie(e.target.value)}
                    placeholder="Ej: 120" className={inp}/>
                </div>
                <div>
                  <label className={lbl}>Uso</label>
                  <select value={uso} onChange={e => setUso(e.target.value as TipoUso)} className={inp}>
                    <option>Agricola</option>
                    <option>Ganadero</option>
                    <option>Mixto</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={lbl}>Estado</label>
                <select value={estado} onChange={e => setEstado(e.target.value as EstadoLote)} className={inp}>
                  <option>Sembrado</option>
                  <option>Barbecho</option>
                  <option>Cosechado</option>
                  <option>Con hacienda</option>
                  <option>En preparacion</option>
                </select>
              </div>
            </div>
          </div>

          {/* Cultivo (solo si aplica) */}
          {(estado === 'Sembrado' || estado === 'Cosechado') && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-3">Cultivo</p>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Cultivo actual</label>
                    <input value={cultivo} onChange={e => setCultivo(e.target.value)}
                      placeholder="Ej: Maíz, Soja, Trigo" className={inp}/>
                  </div>
                  <div>
                    <label className={lbl}>Variedad</label>
                    <input value={variedad} onChange={e => setVariedad(e.target.value)}
                      placeholder="Ej: DK7500" className={inp}/>
                  </div>
                </div>
                <div>
                  <label className={lbl}>Fecha de siembra</label>
                  <input type="date" value={fechaSiembra} onChange={e => setFechaSiembra(e.target.value)} className={inp}/>
                </div>
              </div>
            </div>
          )}

          {/* Posición en mapa */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-1">Posición en mapa</p>
            <p className="text-[10px] text-gris mb-3">Calculada automáticamente. Podés ajustarla (viewport 120×90).</p>
            <div className="grid grid-cols-4 gap-2">
              {([
                { label: 'Pos X', val: posX, set: setPosX },
                { label: 'Pos Y', val: posY, set: setPosY },
                { label: 'Ancho', val: ancho, set: setAncho },
                { label: 'Alto',  val: alto,  set: setAlto  },
              ] as const).map(({ label, val, set }) => (
                <div key={label}>
                  <label className={lbl}>{label}</label>
                  <input type="number" min="1" value={val}
                    onChange={e => (set as (v: string) => void)(e.target.value)}
                    className={inp}/>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-borde text-carbon text-xs font-medium py-2 rounded-lg hover:bg-tierra transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-verde-act text-white text-xs font-semibold py-2 rounded-lg hover:bg-verde transition-colors disabled:opacity-60">
              {saving ? 'Guardando...' : 'Guardar lote'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Mapa de lotes (SVG) ────────────────────────────────────────────────────────
function MapaLotes({ lotes, seleccionado, onSelect }: {
  lotes: Lote[], seleccionado: Lote | null, onSelect: (l: Lote) => void
}) {
  return (
    <div className="bg-white border border-borde rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-borde flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapIcon size={15} className="text-verde-act"/>
          <h3 className="text-sm font-medium text-carbon">Mapa del campo</h3>
        </div>
        <div className="flex gap-3 text-[10px]">
          {(['Sembrado', 'Cosechado', 'Barbecho', 'Con hacienda', 'En preparacion'] as EstadoLote[]).map(e => (
            <div key={e} className="flex items-center gap-1">
              <span className={"inline-block w-2.5 h-2.5 rounded-sm " + getEstadoColor(e).bg}/>
              <span className="text-gris">{e}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative bg-tierra" style={{ paddingTop: '60%' }}>
        <svg
          viewBox="0 0 120 90"
          className="absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Fondo con grilla sutil */}
          <defs>
            <pattern id="grid" width="6" height="6" patternUnits="userSpaceOnUse">
              <path d="M 6 0 L 0 0 0 6" fill="none" stroke="#E5E0D2" strokeWidth="0.3"/>
            </pattern>
          </defs>
          <rect width="120" height="90" fill="url(#grid)"/>

          {/* Caminos rurales */}
          <path d="M 0 32 L 120 32" stroke="#D3D1C7" strokeWidth="0.6" strokeDasharray="1.5 1.5" opacity="0.7"/>
          <path d="M 40 0 L 40 90" stroke="#D3D1C7" strokeWidth="0.6" strokeDasharray="1.5 1.5" opacity="0.7"/>
          <path d="M 78 0 L 78 90" stroke="#D3D1C7" strokeWidth="0.6" strokeDasharray="1.5 1.5" opacity="0.7"/>

          {/* Lotes */}
          {lotes.map(lote => {
            const colors = getEstadoColor(lote.estado)
            const isSelected = seleccionado?.id === lote.id
            return (
              <g key={lote.id} onClick={() => onSelect(lote)} style={{ cursor: 'pointer' }}>
                <rect
                  x={lote.pos_x}
                  y={lote.pos_y}
                  width={lote.ancho}
                  height={lote.alto}
                  fill={colors.fill}
                  fillOpacity={isSelected ? 0.85 : 0.65}
                  stroke={isSelected ? '#1A5C2A' : '#FFFFFF'}
                  strokeWidth={isSelected ? 1.2 : 0.6}
                  rx="1"
                  className="transition-all hover:opacity-90"
                />
                <text
                  x={lote.pos_x + lote.ancho / 2}
                  y={lote.pos_y + lote.alto / 2 - 1}
                  textAnchor="middle"
                  fill="white"
                  fontSize="2.4"
                  fontWeight="600"
                  style={{ pointerEvents: 'none' }}
                >
                  {lote.nombre}
                </text>
                <text
                  x={lote.pos_x + lote.ancho / 2}
                  y={lote.pos_y + lote.alto / 2 + 2}
                  textAnchor="middle"
                  fill="white"
                  fontSize="1.8"
                  opacity="0.9"
                  style={{ pointerEvents: 'none' }}
                >
                  {lote.superficie} ha
                </text>
                {lote.cultivo_actual && (
                  <text
                    x={lote.pos_x + lote.ancho / 2}
                    y={lote.pos_y + lote.alto / 2 + 4.5}
                    textAnchor="middle"
                    fill="white"
                    fontSize="1.6"
                    opacity="0.85"
                    style={{ pointerEvents: 'none' }}
                  >
                    {lote.cultivo_actual}
                  </text>
                )}
              </g>
            )
          })}

          {/* Brujula */}
          <g transform="translate(110, 8)">
            <circle cx="0" cy="0" r="4" fill="white" stroke="#D3D1C7" strokeWidth="0.3"/>
            <text x="0" y="-1.5" textAnchor="middle" fontSize="2" fill="#5F5E5A" fontWeight="600">N</text>
            <path d="M 0 -2.5 L -0.8 1 L 0 0.3 L 0.8 1 Z" fill="#1A5C2A"/>
          </g>

          {/* Escala */}
          <g transform="translate(4, 84)">
            <line x1="0" y1="0" x2="10" y2="0" stroke="#5F5E5A" strokeWidth="0.4"/>
            <line x1="0" y1="-1" x2="0" y2="1" stroke="#5F5E5A" strokeWidth="0.4"/>
            <line x1="10" y1="-1" x2="10" y2="1" stroke="#5F5E5A" strokeWidth="0.4"/>
            <text x="5" y="3.5" textAnchor="middle" fontSize="2" fill="#5F5E5A">500 m</text>
          </g>
        </svg>
      </div>
    </div>
  )
}

// ── Panel detalle ──────────────────────────────────────────────────────────────
function PanelDetalleLote({ lote, onClose }: { lote: Lote, onClose: () => void }) {
  const dias = getDiasHastaCosecha(lote.fecha_cosecha_estim)
  const colors = getEstadoColor(lote.estado)

  return (
    <div className="bg-white border border-borde rounded-xl overflow-hidden">
      <div className="bg-verde px-4 py-3 flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">{lote.nombre}</p>
          <p className="text-xs text-white/60 mt-0.5">{lote.superficie} ha · Uso {lote.uso.toLowerCase()}</p>
          <span className={"mt-1.5 inline-block " + colors.chip}>{lote.estado}</span>
        </div>
        <button onClick={onClose} className="text-white/50 hover:text-white"><X size={14}/></button>
      </div>

      <div className="p-4 divide-y divide-borde">
        {/* Cultivo actual */}
        {lote.cultivo_actual && (
          <div className="pb-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-2">Cultivo actual</p>
            <div className="flex items-center gap-2 mb-2">
              <Sprout size={18} className="text-verde-act"/>
              <div>
                <p className="text-sm font-semibold text-carbon">{lote.cultivo_actual}</p>
                <p className="text-[11px] text-gris">{lote.variedad}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="bg-tierra rounded-lg p-2">
                <p className="text-[10px] text-gris mb-0.5">Siembra</p>
                <p className="text-xs font-semibold text-carbon">{formatDate(lote.fecha_siembra)}</p>
              </div>
              <div className="bg-tierra rounded-lg p-2">
                <p className="text-[10px] text-gris mb-0.5">Cosecha estim.</p>
                <p className="text-xs font-semibold text-carbon">{formatDate(lote.fecha_cosecha_estim)}</p>
              </div>
            </div>
            {dias !== null && dias > 0 && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-azul font-medium bg-azul-s px-3 py-1.5 rounded-lg">
                <Calendar size={12}/> Faltan {dias} dias para la cosecha
              </div>
            )}
            {lote.rendimiento_estim && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-verde font-medium bg-verde-s px-3 py-1.5 rounded-lg">
                <TrendingUp size={12}/> Rendimiento estimado: {lote.rendimiento_estim} tn/ha
              </div>
            )}
          </div>
        )}

        {/* Hacienda */}
        {lote.estado === 'Con hacienda' && (
          <div className="pb-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-2">Hacienda en el lote</p>
            <div className="bg-azul-s rounded-lg p-3">
              <div className="flex items-end gap-1.5 mb-1">
                <span className="text-2xl font-semibold text-azul">{lote.hacienda_actual}</span>
                <span className="text-sm text-gris mb-1">animales</span>
              </div>
              <p className="text-[11px] text-gris">
                Carga: {((lote.hacienda_actual || 0) / lote.superficie).toFixed(2)} animales/ha
              </p>
            </div>
          </div>
        )}

        {/* Cosecha hecha */}
        {lote.estado === 'Cosechado' && lote.rendimiento_real && (
          <div className="pb-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-2">Resultado de cosecha</p>
            <div className="bg-ambar-s rounded-lg p-3">
              <div className="flex items-end gap-1.5 mb-1">
                <span className="text-2xl font-semibold" style={{color:'#854F0B'}}>{lote.rendimiento_real}</span>
                <span className="text-sm text-gris mb-1">tn/ha</span>
              </div>
              <p className="text-[11px] text-gris">
                Total cosechado: {(lote.rendimiento_real * lote.superficie).toFixed(0)} tn
              </p>
            </div>
          </div>
        )}

        {/* Labores recientes */}
        <div className="py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-3">
            Labores ({lote.labores.length})
          </p>
          {lote.labores.length === 0 ? (
            <p className="text-xs text-gris italic">Sin labores registradas todavia.</p>
          ) : (
            <div className="space-y-2">
              {lote.labores.slice(-4).reverse().map(l => (
                <div key={l.id} className="flex gap-2 items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-verde-act mt-1.5 flex-shrink-0"/>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className="text-[11px] font-semibold text-carbon">{l.tipo}</p>
                      <span className="text-[10px] text-gris">· {formatDate(l.fecha)}</span>
                    </div>
                    <p className="text-[11px] text-gris">{l.detalle}</p>
                    {l.cantidad && <p className="text-[10px] text-verde mt-0.5">{l.cantidad}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="pt-4 flex flex-col gap-2">
          <button className="w-full text-xs font-semibold bg-verde-act text-white py-2 rounded-lg hover:bg-verde transition-colors">
            Registrar nueva labor
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
export default function Lotes() {
  const { establecimiento, loading: loadingEst } = useEstablecimiento()
  const [lotes, setLotes] = useState<Lote[]>([])
  const [loadingLotes, setLoadingLotes] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState<string>('Todos')
  const [seleccionado, setSeleccionado] = useState<Lote | null>(null)
  const [mostrarForm, setMostrarForm] = useState(false)

  useEffect(() => {
    if (!establecimiento?.id) return

    let cancelled = false
    async function cargar() {
      setLoadingLotes(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from('lotes')
        .select('*, labores(*)')
        .eq('establecimiento_id', establecimiento!.id)
        .order('nombre')

      if (cancelled) return
      if (error) {
        console.error('[Lotes] Error al cargar:', error.message)
        setLoadingLotes(false)
        return
      }

      // PostgREST devuelve NUMERIC como string — normalizar a number
      const mapped: Lote[] = (data ?? []).map(l => ({
        id: l.id as string,
        nombre: l.nombre as string,
        superficie: Number(l.superficie),
        uso: l.uso as TipoUso,
        estado: l.estado as EstadoLote,
        cultivo_actual: l.cultivo_actual ?? undefined,
        variedad: l.variedad ?? undefined,
        fecha_siembra: l.fecha_siembra ?? undefined,
        fecha_cosecha_estim: l.fecha_cosecha_estim ?? undefined,
        rendimiento_estim: l.rendimiento_estim != null ? Number(l.rendimiento_estim) : undefined,
        rendimiento_real: l.rendimiento_real != null ? Number(l.rendimiento_real) : undefined,
        hacienda_actual: l.hacienda_actual ?? undefined,
        pos_x: Number(l.pos_x),
        pos_y: Number(l.pos_y),
        ancho: Number(l.ancho),
        alto: Number(l.alto),
        observaciones: l.observaciones ?? undefined,
        labores: (l.labores ?? []).map((lab: Record<string, unknown>) => ({
          id: lab.id as string,
          fecha: lab.fecha as string,
          tipo: lab.tipo as Labor['tipo'],
          detalle: lab.detalle as string,
          operario: (lab.operario ?? undefined) as string | undefined,
          cantidad: (lab.cantidad ?? undefined) as string | undefined,
        })),
      }))

      setLotes(mapped)
      if (mapped.length > 0) setSeleccionado(mapped[0])
      setLoadingLotes(false)
    }

    cargar()
    return () => { cancelled = true }
  }, [establecimiento?.id])

  const loading = loadingEst || loadingLotes

  const filtrados = lotes.filter(l => {
    const matchBusqueda = l.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (l.cultivo_actual || '').toLowerCase().includes(busqueda.toLowerCase())
    const matchEstado = estadoFiltro === 'Todos' || l.estado === estadoFiltro
    return matchBusqueda && matchEstado
  })

  // KPIs
  const totalHa = lotes.reduce((acc, l) => acc + l.superficie, 0)
  const sembrados = lotes.filter(l => l.estado === 'Sembrado').length
  const haSembradas = lotes.filter(l => l.estado === 'Sembrado').reduce((acc, l) => acc + l.superficie, 0)
  const conHacienda = lotes.filter(l => l.estado === 'Con hacienda').reduce((acc, l) => acc + (l.hacienda_actual || 0), 0)
  const lotesConRend = lotes.filter(l => l.rendimiento_estim)
  const rendProm = lotesConRend.length
    ? (lotesConRend.reduce((acc, l) => acc + (l.rendimiento_estim || 0), 0) / lotesConRend.length).toFixed(1)
    : '—'

  function handleSuccess(nuevo: Lote) {
    setLotes(prev => [...prev, nuevo].sort((a, b) => a.nombre.localeCompare(b.nombre)))
    setSeleccionado(nuevo)
    setMostrarForm(false)
  }

  const actions = (
    <div className="flex gap-2">
      <button
        onClick={() => setMostrarForm(true)}
        disabled={!establecimiento}
        className="flex items-center gap-1.5 text-xs font-semibold bg-verde-act text-white px-3 py-1.5 rounded-lg hover:bg-verde transition-colors disabled:opacity-60">
        <Plus size={13}/> Nuevo lote
      </button>
    </div>
  )

  if (loading) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <Topbar title="Lotes y Cultivos" actions={actions}/>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gris">Cargando lotes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {mostrarForm && establecimiento && (
        <FormNuevoLote
          establecimientoId={establecimiento.id}
          lotesExistentes={lotes.length}
          onClose={() => setMostrarForm(false)}
          onSuccess={handleSuccess}
        />
      )}
      <Topbar title="Lotes y Cultivos" actions={actions}/>
      <div className="flex-1 overflow-y-auto p-4">

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-2.5 mb-4">
          {[
            { l:'Lotes totales',     v: lotes.length.toString(),     s: totalHa + ' ha en total',     c:'border-t-verde-ac' },
            { l:'Lotes sembrados',   v: sembrados.toString(),         s: haSembradas + ' ha activas',  c:'border-t-verde-ac' },
            { l:'Hacienda en lotes', v: conHacienda.toString(),       s:'animales en pastoreo',        c:'border-t-azul' },
            { l:'Rend. estimado',    v: rendProm === '—' ? '—' : rendProm + ' tn/ha', s:'promedio de la campania', c:'border-t-ambar' },
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
              placeholder="Buscar lote o cultivo..."
              className="text-xs outline-none bg-transparent flex-1 text-carbon placeholder:text-gris"/>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {(['Todos', 'Sembrado', 'Cosechado', 'Barbecho', 'Con hacienda'] as const).map(estado => (
              <button key={estado}
                onClick={() => setEstadoFiltro(estado)}
                className={"text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium " +
                  (estadoFiltro === estado
                    ? 'bg-verde text-white border-verde'
                    : 'bg-white border-borde text-carbon hover:bg-tierra')}>
                {estado}
              </button>
            ))}
          </div>
          <span className="ml-auto text-xs text-gris bg-tierra border border-borde px-3 py-1.5 rounded-lg">
            <strong className="text-carbon">{filtrados.length}</strong> lotes
          </span>
        </div>

        {/* Sin lotes */}
        {lotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <MapIcon size={40} className="text-borde mb-3"/>
            <p className="text-sm font-medium text-carbon mb-1">No hay lotes cargados</p>
            <p className="text-xs text-gris mb-4">Usá el botón <strong>Nuevo lote</strong> para agregar el primer lote del establecimiento</p>
            <button onClick={() => setMostrarForm(true)}
              className="flex items-center gap-1.5 text-xs font-semibold bg-verde-act text-white px-4 py-2 rounded-lg hover:bg-verde transition-colors">
              <Plus size={13}/> Nuevo lote
            </button>
          </div>
        ) : (
          <>
            {/* Mapa + Detalle */}
            <div className="grid grid-cols-[1fr_320px] gap-3 mb-4">
              <MapaLotes lotes={filtrados} seleccionado={seleccionado} onSelect={setSeleccionado}/>
              {seleccionado && <PanelDetalleLote lote={seleccionado} onClose={() => setSeleccionado(null)}/>}
            </div>

            {/* Tabla de lotes */}
            <div className="bg-white border border-borde rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-borde flex items-center gap-2">
                <Layers size={15} className="text-verde-act"/>
                <h3 className="text-sm font-medium text-carbon">Listado de lotes</h3>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-tierra border-b border-borde">
                    {['Lote','Superficie','Estado','Cultivo','Variedad','Siembra','Rend.','Labores'].map(h => (
                      <th key={h} className="text-left px-3 py-2 font-medium text-gris">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-borde">
                  {filtrados.map(lote => {
                    const colors = getEstadoColor(lote.estado)
                    return (
                      <tr key={lote.id}
                        onClick={() => setSeleccionado(lote)}
                        className={"cursor-pointer transition-colors hover:bg-tierra/50 " +
                          (seleccionado?.id === lote.id ? 'bg-verde-s' : '')}>
                        <td className="px-3 py-2">
                          <p className="font-medium text-carbon">{lote.nombre}</p>
                          <p className="text-[10px] text-gris">Uso {lote.uso.toLowerCase()}</p>
                        </td>
                        <td className="px-3 py-2 font-medium text-carbon">{lote.superficie} ha</td>
                        <td className="px-3 py-2"><span className={colors.chip}>{lote.estado}</span></td>
                        <td className="px-3 py-2 text-carbon">{lote.cultivo_actual || '—'}</td>
                        <td className="px-3 py-2 text-gris">{lote.variedad || '—'}</td>
                        <td className="px-3 py-2 text-gris">{formatDate(lote.fecha_siembra)}</td>
                        <td className="px-3 py-2 text-carbon">
                          {lote.rendimiento_real
                            ? <span className="text-ambar font-semibold">{lote.rendimiento_real} tn/ha</span>
                            : lote.rendimiento_estim
                              ? <span className="text-verde">~{lote.rendimiento_estim} tn/ha</span>
                              : <span className="text-gris">—</span>}
                        </td>
                        <td className="px-3 py-2 text-gris">{lote.labores.length}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {filtrados.length === 0 && lotes.length > 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MapIcon size={32} className="text-borde mb-3"/>
                  <p className="text-sm font-medium text-carbon mb-1">No hay lotes con ese filtro</p>
                  <p className="text-xs text-gris">Cambia los filtros para ver otros lotes</p>
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  )
}
