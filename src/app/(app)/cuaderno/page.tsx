'use client'
import { useState, useEffect } from 'react'
import {
  Plus, X, Trash2, Pencil, User, FileText, Calendar,
  Sprout, ClipboardList, FileDown,
} from 'lucide-react'
import Topbar from '@/components/Topbar'
import SelectorContacto from '@/components/SelectorContacto'
import { createClient } from '@/lib/supabase'
import { useEstablecimiento } from '@/hooks/useEstablecimiento'
import toast from 'react-hot-toast'

// ── Tipos ───────────────────────────────────────────────────────────────────
type Campania = {
  id: string
  nombre: string
  cultivo: string | null
  variedad: string | null
  superficie: number | null
  lote_id: string | null
  estado: string
}
type ProductoLabor = { id?: string; producto: string; cantidad: string; unidad: string }
type Labor = {
  id: string
  fecha: string
  tipo: string | null
  comprobante: string | null
  responsable: string | null
  estado_fenologico: string | null
  observaciones: string | null
  analisis: string | null
  recomendaciones: string | null
  proxima_visita: string | null
  productos: ProductoLabor[]
}

const ACCIONES = ['Barbecho', 'Presiembra', 'Siembra', 'Pre-emergente', 'Post-emergente',
  'Bioestimulante', 'Fungicida', 'Fertilización', 'Pulverización', 'Monitoreo', 'Resiembra', 'Cosecha', 'Análisis']
const UNIDADES = ['lt', 'kg', 'cc', 'gr', 'dosis', 'bolsas', 'sem/ha']

const inp = 'w-full border border-borde rounded-lg px-3 py-2 text-xs outline-none focus:border-verde-act bg-white'
const lbl = 'text-xs text-gris block mb-1'

function esCosecha(tipo?: string | null) {
  return (tipo ?? '').toLowerCase().includes('cosecha')
}

// ── Form campaña ─────────────────────────────────────────────────────────────
function FormCampania({ estId, userId, onClose, onSaved }: {
  estId: string
  userId: string | null
  onClose: () => void
  onSaved: () => void
}) {
  const [nombre,   setNombre]   = useState('')
  const [cultivo,  setCultivo]  = useState('')
  const [variedad, setVariedad] = useState('')
  const [saving,   setSaving]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) { toast.error('Poné un nombre de campaña (ej: 2024-2025)'); return }
    setSaving(true)
    try {
      const supabase = createClient()
      const id = crypto.randomUUID()
      const { error } = await supabase.from('campanias').insert({
        id,
        establecimiento_id: estId,
        asesor_id:  userId,
        nombre:     nombre.trim(),
        cultivo:    cultivo.trim()  || null,
        variedad:   variedad.trim() || null,
      })
      if (error) throw error
      toast.success('Campaña creada')
      onSaved()
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? 'error desconocido'
      console.error('[Campaña] Error al guardar:', err)
      toast.error(`No se pudo crear la campaña: ${msg}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-borde">
          <h2 className="text-sm font-semibold text-carbon">Nueva campaña</h2>
          <button onClick={onClose} className="text-gris hover:text-carbon"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className={lbl}>Nombre *</label>
            <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: 2024-2025" className={inp} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Cultivo</label>
              <input value={cultivo} onChange={e => setCultivo(e.target.value)} placeholder="Ej: Soja" className={inp} />
            </div>
            <div>
              <label className={lbl}>Variedad</label>
              <input value={variedad} onChange={e => setVariedad(e.target.value)} placeholder="Ej: DM 4670" className={inp} />
            </div>
          </div>
          <p className="text-[11px] text-gris">La superficie se toma del campo. Acá cargás el cultivo y la variedad de esta campaña.</p>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-borde text-carbon text-xs font-medium py-2 rounded-lg hover:bg-tierra transition-colors">Cancelar</button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-verde-act text-white text-xs font-semibold py-2 rounded-lg hover:bg-verde transition-colors disabled:opacity-60">
              {saving ? 'Guardando...' : 'Crear campaña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Form labor ───────────────────────────────────────────────────────────────
function FormLabor({ estId, userId, campaniaId, loteId, editar, onClose, onSaved }: {
  estId: string
  userId: string | null
  campaniaId: string
  loteId: string | null
  editar?: Labor
  onClose: () => void
  onSaved: () => void
}) {
  const [fecha,       setFecha]       = useState(editar?.fecha ?? new Date().toISOString().slice(0, 10))
  const [tipo,        setTipo]        = useState(editar?.tipo ?? '')
  const [comprobante, setComprobante] = useState(editar?.comprobante ?? '')
  const [responsable, setResponsable] = useState(editar?.responsable ?? '')
  const [estadoFeno,  setEstadoFeno]  = useState(editar?.estado_fenologico ?? '')
  const [observ,      setObserv]      = useState(editar?.observaciones ?? '')
  const [analisis,    setAnalisis]    = useState(editar?.analisis ?? '')
  const [recom,       setRecom]       = useState(editar?.recomendaciones ?? '')
  const [proxima,     setProxima]     = useState(editar?.proxima_visita ?? '')
  const [productos,   setProductos]   = useState<ProductoLabor[]>(
    editar?.productos.length ? editar.productos.map(p => ({ ...p })) : [{ producto: '', cantidad: '', unidad: '' }]
  )
  const [saving,      setSaving]      = useState(false)

  function setProd(i: number, campo: keyof ProductoLabor, val: string) {
    setProductos(prev => prev.map((p, idx) => idx === i ? { ...p, [campo]: val } : p))
  }
  function addProd() { setProductos(prev => [...prev, { producto: '', cantidad: '', unidad: '' }]) }
  function delProd(i: number) { setProductos(prev => prev.filter((_, idx) => idx !== i)) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fecha) { toast.error('La fecha es obligatoria'); return }
    setSaving(true)
    try {
      const supabase = createClient()
      const campos = {
        fecha,
        tipo:              tipo.trim()        || null,
        comprobante:       comprobante.trim() || null,
        responsable:       responsable.trim() || null,
        estado_fenologico: estadoFeno.trim()  || null,
        observaciones:     observ.trim()      || null,
        analisis:          analisis.trim()    || null,
        recomendaciones:   recom.trim()       || null,
        proxima_visita:    proxima            || null,
      }
      const laborId = editar?.id ?? crypto.randomUUID()

      if (editar) {
        const { error } = await supabase.from('visitas_campo').update(campos).eq('id', laborId)
        if (error) throw error
        await supabase.from('visita_productos').delete().eq('visita_id', laborId)
      } else {
        const { error } = await supabase.from('visitas_campo').insert({
          id: laborId,
          establecimiento_id: estId,
          asesor_id: userId,
          campania_id: campaniaId,
          lote_id: loteId,
          ...campos,
        })
        if (error) throw error
      }

      const rows = productos
        .filter(p => p.producto.trim())
        .map((p, i) => ({
          id: crypto.randomUUID(),
          visita_id: laborId,
          producto: p.producto.trim(),
          cantidad: p.cantidad ? Number(p.cantidad) : null,
          unidad:   p.unidad.trim() || null,
          orden: i,
        }))
      if (rows.length) {
        const { error: pErr } = await supabase.from('visita_productos').insert(rows)
        if (pErr) throw pErr
      }

      toast.success(editar ? 'Labor actualizada' : 'Labor registrada')
      onSaved()
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? 'error desconocido'
      console.error('[Labor] Error al guardar:', err)
      toast.error(`No se pudo guardar la labor: ${msg}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-borde sticky top-0 bg-white z-10">
          <h2 className="text-sm font-semibold text-carbon">{editar ? 'Editar labor' : 'Nueva labor'}</h2>
          <button onClick={onClose} className="text-gris hover:text-carbon"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Fecha *</label>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={inp} />
            </div>
            <div>
              <label className={lbl}>Acción / labor</label>
              <input list="acciones-list" value={tipo} onChange={e => setTipo(e.target.value)} placeholder="Ej: Siembra" className={inp} />
              <datalist id="acciones-list">{ACCIONES.map(a => <option key={a} value={a} />)}</datalist>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Comprobante</label>
              <input value={comprobante} onChange={e => setComprobante(e.target.value)} placeholder="N° remito" className={inp} />
            </div>
            <div>
              <label className={lbl}>Responsable</label>
              <SelectorContacto establecimientoId={estId} tipo="Contratista" valor={responsable}
                onChange={setResponsable} placeholder="Elegí o registrá" className={inp} />
            </div>
          </div>

          {/* Productos */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-gris">Productos aplicados</label>
              <button type="button" onClick={addProd} className="flex items-center gap-1 text-[11px] font-medium text-verde-act hover:text-verde">
                <Plus size={12} /> Agregar
              </button>
            </div>
            <div className="space-y-2">
              {productos.map((p, i) => (
                <div key={i} className="grid grid-cols-[1fr_4.5rem_4.5rem_auto] gap-2 items-center">
                  <input value={p.producto} onChange={e => setProd(i, 'producto', e.target.value)} placeholder="Producto" className={inp} />
                  <input type="number" min="0" step="0.01" value={p.cantidad} onChange={e => setProd(i, 'cantidad', e.target.value)} placeholder="Cant." className={inp} />
                  <input list="unidades-list" value={p.unidad} onChange={e => setProd(i, 'unidad', e.target.value)} placeholder="Un." className={inp} />
                  <button type="button" onClick={() => delProd(i)} className="text-gris hover:text-rojo"><Trash2 size={14} /></button>
                </div>
              ))}
              <datalist id="unidades-list">{UNIDADES.map(u => <option key={u} value={u} />)}</datalist>
            </div>
          </div>

          <div>
            <label className={lbl}>Estado fenológico</label>
            <input value={estadoFeno} onChange={e => setEstadoFeno(e.target.value)} placeholder="Ej: V4, R1..." className={inp} />
          </div>
          <div>
            <label className={lbl}>Observaciones</label>
            <textarea value={observ} onChange={e => setObserv(e.target.value)} rows={2} className={inp} />
          </div>
          <div>
            <label className={lbl}>Análisis</label>
            <textarea value={analisis} onChange={e => setAnalisis(e.target.value)} rows={2} className={inp} />
          </div>
          <div>
            <label className={lbl}>Recomendaciones</label>
            <textarea value={recom} onChange={e => setRecom(e.target.value)} rows={2} className={inp} />
          </div>

          <div>
            <label className={lbl}>Próxima visita</label>
            <input type="date" value={proxima} onChange={e => setProxima(e.target.value)} className={inp} />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-borde text-carbon text-xs font-medium py-2 rounded-lg hover:bg-tierra transition-colors">Cancelar</button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-verde-act text-white text-xs font-semibold py-2 rounded-lg hover:bg-verde transition-colors disabled:opacity-60">
              {saving ? 'Guardando...' : 'Guardar labor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Timeline ─────────────────────────────────────────────────────────────────
function TimelineLabor({ labor, onEdit, onDelete }: { labor: Labor; onEdit: () => void; onDelete: () => void }) {
  const cosecha = esCosecha(labor.tipo)
  return (
    <div className="flex gap-3">
      <div className="w-12 text-right text-[10px] text-gris pt-0.5 leading-tight flex-shrink-0">
        {labor.fecha ? (<>{labor.fecha.slice(8, 10)}<br />{labor.fecha.slice(5, 7)}/{labor.fecha.slice(2, 4)}</>) : '—'}
      </div>
      <div className="relative w-4 flex-shrink-0">
        <div className="absolute left-[7px] top-1.5 bottom-0 w-0.5 bg-borde" />
        <div className={'absolute left-[3px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white ' + (cosecha ? 'bg-ambar' : 'bg-verde-act')} />
      </div>
      <div className="flex-1 min-w-0 pb-5 group">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={'text-[11px] font-semibold px-2 py-0.5 rounded-full ' + (cosecha ? 'chip chip-amber' : 'chip chip-green')}>
            {labor.tipo || 'Labor'}
          </span>
          {labor.comprobante && <span className="text-[10px] text-gris">Comp. {labor.comprobante}</span>}
          <div className="ml-auto flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={onEdit} className="text-gris hover:text-carbon" title="Editar"><Pencil size={13} /></button>
            <button onClick={onDelete} className="text-gris hover:text-rojo" title="Eliminar"><Trash2 size={13} /></button>
          </div>
        </div>
        {labor.productos.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {labor.productos.map((p, i) => (
              <span key={i} className="text-[11px] border border-borde rounded-md px-1.5 py-0.5 text-gris">
                {p.producto}{p.cantidad ? ` · ${p.cantidad}${p.unidad || ''}` : ''}
              </span>
            ))}
          </div>
        )}
        {labor.estado_fenologico && <p className="text-[11px] text-gris mt-1.5"><Sprout size={11} className="inline -mt-0.5 mr-1 text-verde-act" />{labor.estado_fenologico}</p>}
        {labor.observaciones && <p className="text-[11px] text-carbon mt-1">{labor.observaciones}</p>}
        {labor.recomendaciones && <p className="text-[11px] text-azul mt-1 bg-azul-s px-2 py-1 rounded-lg">Rec: {labor.recomendaciones}</p>}
        {labor.responsable && <p className="text-[10px] text-gris mt-1.5"><User size={11} className="inline -mt-0.5 mr-1" />{labor.responsable}</p>}
      </div>
    </div>
  )
}

// ── Página principal ─────────────────────────────────────────────────────────
export default function CuadernoPage() {
  const { establecimiento, productorActivo, perfil, userId, loading: loadingEst } = useEstablecimiento()
  const [campanias, setCampanias] = useState<Campania[]>([])
  const [campaniaSel, setCampaniaSel] = useState<string>('')
  const [labores, setLabores] = useState<Labor[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [loadingLabores, setLoadingLabores] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [formCampania, setFormCampania] = useState(false)
  const [formLabor, setFormLabor] = useState<{ editar?: Labor } | null>(null)

  const estId = establecimiento?.id

  // Cargar campañas del campo activo
  useEffect(() => {
    if (!estId) return
    let cancelled = false
    async function cargar() {
      setLoadingData(true)
      const supabase = createClient()
      const { data: camps } = await supabase.from('campanias')
        .select('id, nombre, cultivo, variedad, superficie, lote_id, estado')
        .eq('establecimiento_id', estId!).order('nombre', { ascending: false })
      if (cancelled) return
      const cs: Campania[] = (camps ?? []).map(c => ({
        id: c.id, nombre: c.nombre, cultivo: c.cultivo, variedad: c.variedad,
        superficie: c.superficie != null ? Number(c.superficie) : null, lote_id: c.lote_id, estado: c.estado,
      }))
      setCampanias(cs)
      setCampaniaSel(prev => (cs.some(c => c.id === prev) ? prev : (cs[0]?.id ?? '')))
      setLoadingData(false)
    }
    cargar()
    return () => { cancelled = true }
  }, [estId, refreshKey])

  // Cargar labores de la campaña seleccionada
  useEffect(() => {
    if (!campaniaSel) { setLabores([]); return }
    let cancelled = false
    async function cargar() {
      setLoadingLabores(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from('visitas_campo')
        .select('*, visita_productos(*)')
        .eq('campania_id', campaniaSel)
        .order('fecha', { ascending: false })
      if (cancelled) return
      if (error) { console.error('[Cuaderno] labores:', error.message); setLoadingLabores(false); return }
      const mapped: Labor[] = (data ?? []).map(l => ({
        id: l.id, fecha: l.fecha, tipo: l.tipo, comprobante: l.comprobante, responsable: l.responsable,
        estado_fenologico: l.estado_fenologico, observaciones: l.observaciones, analisis: l.analisis,
        recomendaciones: l.recomendaciones, proxima_visita: l.proxima_visita,
        productos: ((l.visita_productos ?? []) as Record<string, unknown>[])
          .sort((a, b) => Number(a.orden ?? 0) - Number(b.orden ?? 0))
          .map(p => ({ id: p.id as string, producto: p.producto as string, cantidad: p.cantidad != null ? String(p.cantidad) : '', unidad: (p.unidad ?? '') as string })),
      }))
      setLabores(mapped)
      setLoadingLabores(false)
    }
    cargar()
    return () => { cancelled = true }
  }, [campaniaSel, refreshKey])

  const campaniaObj = campanias.find(c => c.id === campaniaSel) ?? null

  async function eliminarLabor(id: string) {
    if (!confirm('¿Eliminar esta labor?')) return
    const supabase = createClient()
    const { error } = await supabase.from('visitas_campo').delete().eq('id', id)
    if (error) { toast.error('No se pudo eliminar'); return }
    toast.success('Labor eliminada')
    setRefreshKey(k => k + 1)
  }

  async function generarInforme() {
    if (!campaniaObj) return
    const fmt = (d: string | null) => { if (!d) return '—'; const [y, m, day] = d.split('-'); return `${day}/${m}/${y}` }
    try {
      const { descargarInforme } = await import('@/components/InformePDF')
      await descargarInforme({
        asesor:     perfil?.nombre_completo ?? '—',
        productor:  productorActivo?.nombre ?? establecimiento?.nombre ?? '—',
        campo:      establecimiento?.nombre ?? '—',
        campania:   campaniaObj.nombre,
        cultivo:    campaniaObj.cultivo ?? '—',
        superficie: establecimiento?.superficie ? `${establecimiento.superficie} ha` : '—',
        emitido:    new Date().toLocaleDateString('es-AR'),
        labores: labores.map(l => ({
          fecha:           fmt(l.fecha),
          tipo:            l.tipo ?? 'Labor',
          responsable:     l.responsable ?? '',
          comprobante:     l.comprobante ?? '',
          productos:       l.productos.map(p => p.producto + (p.cantidad ? ` (${p.cantidad}${p.unidad || ''})` : '')).join(', '),
          estadoFeno:      l.estado_fenologico ?? '',
          observaciones:   l.observaciones ?? '',
          recomendaciones: l.recomendaciones ?? '',
        })),
      })
    } catch (err) {
      console.error('[Informe] Error:', err)
      toast.error('No se pudo generar el informe')
    }
  }

  const loading = loadingEst || loadingData

  const actions = campaniaObj && (
    <div className="flex gap-2">
      <button onClick={generarInforme}
        className="flex items-center gap-1.5 text-xs font-medium border border-borde bg-white text-carbon px-2.5 sm:px-3 py-1.5 rounded-lg hover:bg-tierra transition-colors">
        <FileDown size={13} /> <span className="hidden sm:inline">Generar informe</span>
      </button>
      <button onClick={() => setFormLabor({})}
        className="flex items-center gap-1.5 text-xs font-semibold bg-verde-act text-white px-2.5 sm:px-3 py-1.5 rounded-lg hover:bg-verde transition-colors">
        <Plus size={13} /> <span className="hidden sm:inline">Nueva labor</span>
      </button>
    </div>
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {formCampania && estId && (
        <FormCampania estId={estId} userId={userId}
          onClose={() => setFormCampania(false)}
          onSaved={() => { setFormCampania(false); setRefreshKey(k => k + 1) }} />
      )}
      {formLabor && estId && campaniaObj && (
        <FormLabor estId={estId} userId={userId} campaniaId={campaniaObj.id} loteId={campaniaObj.lote_id}
          editar={formLabor.editar}
          onClose={() => setFormLabor(null)}
          onSaved={() => { setFormLabor(null); setRefreshKey(k => k + 1) }} />
      )}

      <Topbar title="Cuaderno de campo" actions={actions} />

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <p className="text-sm text-gris">Cargando...</p>
        ) : !estId ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ClipboardList size={40} className="text-borde mb-3" />
            <p className="text-sm font-medium text-carbon mb-1">Elegí un campo</p>
            <p className="text-xs text-gris">Usá el selector de arriba a la izquierda para elegir el campo del productor.</p>
          </div>
        ) : (
          <>
            {/* Selector de campaña */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <div className="flex items-center gap-2 bg-white border border-borde rounded-lg px-3 py-1.5">
                <Calendar size={13} className="text-verde-act" />
                <select value={campaniaSel} onChange={e => setCampaniaSel(e.target.value)}
                  className="text-xs outline-none bg-transparent text-carbon font-medium">
                  {campanias.length === 0 && <option value="">Sin campañas</option>}
                  {campanias.map(c => <option key={c.id} value={c.id}>{c.nombre}{c.cultivo ? ` · ${c.cultivo}` : ''}</option>)}
                </select>
              </div>
              <button onClick={() => setFormCampania(true)}
                className="flex items-center gap-1.5 text-xs font-medium border border-borde bg-white text-carbon px-3 py-1.5 rounded-lg hover:bg-tierra transition-colors">
                <Plus size={12} /> Nueva campaña
              </button>
              {productorActivo && (
                <span className="ml-auto text-xs text-gris bg-tierra border border-borde px-3 py-1.5 rounded-lg">
                  {productorActivo.nombre} · {establecimiento?.nombre}
                </span>
              )}
            </div>

            {campanias.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Sprout size={40} className="text-borde mb-3" />
                <p className="text-sm font-medium text-carbon mb-1">Todavía no hay campañas en este campo</p>
                <p className="text-xs text-gris mb-4">Creá la primera campaña (ej: 2024-2025 · Soja) para empezar la bitácora.</p>
                <button onClick={() => setFormCampania(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold bg-verde-act text-white px-4 py-2 rounded-lg hover:bg-verde transition-colors">
                  <Plus size={13} /> Nueva campaña
                </button>
              </div>
            ) : campaniaObj && (
              <>
                {/* KPIs campaña */}
                <div className="grid grid-cols-3 gap-2.5 mb-4">
                  <div className="bg-white border border-borde rounded-xl p-3">
                    <div className="text-[10px] text-gris uppercase tracking-wide font-medium mb-1">Cultivo</div>
                    <div className="text-base font-semibold text-carbon">{campaniaObj.cultivo || '—'}</div>
                    <div className="text-[10px] text-gris">{campaniaObj.variedad || ''}</div>
                  </div>
                  <div className="bg-white border border-borde rounded-xl p-3">
                    <div className="text-[10px] text-gris uppercase tracking-wide font-medium mb-1">Superficie</div>
                    <div className="text-base font-semibold text-carbon">{establecimiento?.superficie ? `${establecimiento.superficie} ha` : '—'}</div>
                  </div>
                  <div className="bg-white border border-borde rounded-xl p-3">
                    <div className="text-[10px] text-gris uppercase tracking-wide font-medium mb-1">Labores</div>
                    <div className="text-base font-semibold text-carbon">{labores.length}</div>
                  </div>
                </div>

                {/* Bitácora */}
                <div className="bg-white border border-borde rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-borde flex items-center gap-2">
                    <ClipboardList size={15} className="text-verde-act" />
                    <h3 className="text-sm font-medium text-carbon">Bitácora de labores</h3>
                  </div>
                  <div className="p-4">
                    {loadingLabores ? (
                      <p className="text-xs text-gris">Cargando labores...</p>
                    ) : labores.length === 0 ? (
                      <div className="text-center py-10">
                        <FileText size={32} className="text-borde mx-auto mb-2" />
                        <p className="text-sm text-carbon mb-1">Sin labores todavía</p>
                        <p className="text-xs text-gris mb-3">Registrá la primera labor de esta campaña.</p>
                        <button onClick={() => setFormLabor({})}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold bg-verde-act text-white px-4 py-2 rounded-lg hover:bg-verde transition-colors">
                          <Plus size={13} /> Nueva labor
                        </button>
                      </div>
                    ) : (
                      <div>
                        {labores.map(l => (
                          <TimelineLabor key={l.id} labor={l}
                            onEdit={() => setFormLabor({ editar: l })}
                            onDelete={() => eliminarLabor(l.id)} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
