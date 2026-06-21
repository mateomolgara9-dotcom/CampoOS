'use client'
import { useState, useEffect } from 'react'
import { Search, Plus, Package, AlertTriangle, X, Upload } from 'lucide-react'
import Topbar from '@/components/Topbar'
import { createClient } from '@/lib/supabase'
import { useEstablecimiento } from '@/hooks/useEstablecimiento'
import toast from 'react-hot-toast'
import dynamic from 'next/dynamic'
import type { ColumnDef } from '@/components/ImportExcelModal'
const ImportExcelModal = dynamic(() => import('@/components/ImportExcelModal'), { ssr: false })

const IMPORT_COLUMNS: ColumnDef[] = [
  { key: 'nombre',          header: 'Nombre',               required: true,  type: 'string' },
  { key: 'categoria',       header: 'Categoria',             required: true,  type: 'enum',   enumValues: ['Agroquimico','Semilla','Fertilizante','Veterinario','Herramienta','Combustible','Lubricante','Otro'] },
  { key: 'marca',           header: 'Marca',                required: false, type: 'string' },
  { key: 'unidad',          header: 'Unidad',               required: false, type: 'enum',   enumValues: ['litros','kg','unidades','dosis','bolsas','tn','bidon'] },
  { key: 'stock',           header: 'Stock',                required: true,  type: 'number' },
  { key: 'stock_minimo',    header: 'Stock Minimo',         required: false, type: 'number' },
  { key: 'stock_maximo',    header: 'Stock Maximo',         required: false, type: 'number' },
  { key: 'precio_unitario', header: 'Precio Unitario (USD)',required: false, type: 'number' },
  { key: 'deposito',        header: 'Deposito',             required: false, type: 'string' },
  { key: 'vencimiento',     header: 'Vencimiento (DD/MM/AAAA)', required: false, type: 'date' },
  { key: 'codigo',          header: 'Codigo',               required: false, type: 'string' },
]

const IMPORT_EXAMPLES: unknown[][] = [
  ['Glifosato 48%',  'Agroquimico',  'Atanor',   'litros',   500, 50, 1000, 1.20, 'Galpón principal', '',              'AGR-001'],
  ['Soja DM 4670',   'Semilla',      'Don Mario', 'bolsas',  200, 20,  400, 45.0, 'Silo 2',           '',              'SEM-010'],
  ['Vacuna aftosa',  'Veterinario',  'Biogénesis','dosis',   300, 30,   0,  2.50, 'Heladera',         '31/12/2025',   'VET-003'],
]

// ── Tipos ─────────────────────────────────────────────────────────────────────
type Categoria = 'Agroquimico' | 'Semilla' | 'Fertilizante' | 'Veterinario' | 'Herramienta' | 'Combustible' | 'Lubricante' | 'Otro'
type EstadoStock = 'ok' | 'bajo' | 'critico'

type Producto = {
  id: string
  nombre: string
  categoria: Categoria
  marca: string
  unidad: string
  stock: number
  stock_minimo: number
  stock_maximo: number
  precio_unitario: number
  deposito: string
  vencimiento?: string
  codigo?: string
}

const CATEGORIAS: Categoria[] = ['Agroquimico','Semilla','Fertilizante','Veterinario','Herramienta','Combustible','Lubricante','Otro']
const DEPOSITOS = ['Deposito principal','Silo 1','Silo 2','Deposito vet.','Camara fria','Tanque campo','Taller']

// ── Helpers ────────────────────────────────────────────────────────────────────
function getEstado(p: Producto): EstadoStock {
  if (p.stock <= p.stock_minimo * 0.5) return 'critico'
  if (p.stock <= p.stock_minimo) return 'bajo'
  return 'ok'
}

function getPct(p: Producto) {
  return Math.min(100, Math.round((p.stock / p.stock_maximo) * 100))
}

function getCatColor(cat: string) {
  const map: Record<string, string> = {
    Agroquimico:  'chip chip-amber',
    Semilla:      'chip chip-green',
    Fertilizante: 'chip chip-blue',
    Veterinario:  'chip chip-purple',
    Herramienta:  'chip chip-gray',
    Combustible:  'chip chip-gray',
    Lubricante:   'chip chip-gray',
    Otro:         'chip chip-gray',
  }
  return map[cat] || 'chip chip-gray'
}

function getBarColor(estado: EstadoStock) {
  if (estado === 'critico') return 'bg-rojo'
  if (estado === 'bajo') return 'bg-ambar'
  return 'bg-verde-act'
}

function formatDate(d?: string) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function isVencProximo(d?: string) {
  if (!d) return false
  const hoy = new Date()
  const venc = new Date(d)
  const diff = (venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
  return diff < 60
}

// ── Formulario nuevo producto ──────────────────────────────────────────────────
function FormNuevo({
  establecimientoId,
  onClose,
  onSuccess,
}: {
  establecimientoId: string
  onClose: () => void
  onSuccess: (p: Producto) => void
}) {
  const [form, setForm] = useState({
    nombre: '', categoria: 'Agroquimico' as Categoria, marca: '',
    unidad: 'litros', stock: '', stock_minimo: '', stock_maximo: '',
    precio_unitario: '', deposito: 'Deposito principal', vencimiento: '', codigo: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!form.nombre.trim() || !form.stock) return
    setSaving(true)
    setError(null)
    try {
      const supabase = createClient()
      const id = crypto.randomUUID()
      const { error: dbError } = await supabase
        .from('productos_inventario')
        .insert({
          id,
          establecimiento_id: establecimientoId,
          nombre: form.nombre.trim(),
          categoria: form.categoria,
          marca: form.marca.trim() || null,
          unidad: form.unidad,
          stock: Number(form.stock),
          stock_minimo: Number(form.stock_minimo) || 0,
          stock_maximo: Number(form.stock_maximo) || null,
          precio_unitario: Number(form.precio_unitario) || null,
          deposito: form.deposito || null,
          vencimiento: form.vencimiento || null,
          codigo: form.codigo.trim() || null,
        })

      if (dbError) {
        console.error('[Inventario] Error al guardar:', dbError.message, dbError.code)
        setError('No se pudo guardar el producto. Intentá de nuevo.')
        return
      }

      onSuccess({
        id,
        nombre: form.nombre.trim(),
        categoria: form.categoria,
        marca: form.marca.trim(),
        unidad: form.unidad,
        stock: Number(form.stock),
        stock_minimo: Number(form.stock_minimo) || 0,
        stock_maximo: Number(form.stock_maximo) || 9999,
        precio_unitario: Number(form.precio_unitario) || 0,
        deposito: form.deposito,
        vencimiento: form.vencimiento || undefined,
        codigo: form.codigo.trim() || undefined,
      })
    } catch (err) {
      console.error('[Inventario] Error inesperado:', err)
      setError('Error inesperado. Intentá de nuevo.')
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
            <p className="text-sm font-semibold text-white">Nuevo producto</p>
            <p className="text-xs text-white/60 mt-0.5">Completá los datos del insumo</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <X size={18}/>
          </button>
        </div>
        <div className="p-5 grid grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto">
          {error && (
            <div role="alert" className="col-span-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <div className="col-span-2">
            <label className={lbl}>Nombre del producto *</label>
            <input className={inp} placeholder="ej. Glifosato 48%" value={form.nombre}
              onChange={e => setForm({...form, nombre: e.target.value})}/>
          </div>
          <div>
            <label className={lbl}>Categoria *</label>
            <select className={inp} value={form.categoria}
              onChange={e => setForm({...form, categoria: e.target.value as Categoria})}>
              {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Marca</label>
            <input className={inp} placeholder="ej. Monsanto" value={form.marca}
              onChange={e => setForm({...form, marca: e.target.value})}/>
          </div>
          <div>
            <label className={lbl}>Stock actual *</label>
            <input className={inp} type="number" placeholder="0" value={form.stock}
              onChange={e => setForm({...form, stock: e.target.value})}/>
          </div>
          <div>
            <label className={lbl}>Unidad</label>
            <select className={inp} value={form.unidad}
              onChange={e => setForm({...form, unidad: e.target.value})}>
              {['litros','kg','unidades','dosis','bolsas','tn','bidon'].map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Stock minimo</label>
            <input className={inp} type="number" placeholder="0" value={form.stock_minimo}
              onChange={e => setForm({...form, stock_minimo: e.target.value})}/>
          </div>
          <div>
            <label className={lbl}>Stock maximo</label>
            <input className={inp} type="number" placeholder="0" value={form.stock_maximo}
              onChange={e => setForm({...form, stock_maximo: e.target.value})}/>
          </div>
          <div>
            <label className={lbl}>Precio unitario (USD)</label>
            <input className={inp} type="number" step="0.01" placeholder="0.00" value={form.precio_unitario}
              onChange={e => setForm({...form, precio_unitario: e.target.value})}/>
          </div>
          <div>
            <label className={lbl}>Deposito</label>
            <select className={inp} value={form.deposito}
              onChange={e => setForm({...form, deposito: e.target.value})}>
              {DEPOSITOS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Vencimiento</label>
            <input className={inp} type="date" value={form.vencimiento}
              onChange={e => setForm({...form, vencimiento: e.target.value})}/>
          </div>
          <div>
            <label className={lbl}>Codigo interno</label>
            <input className={inp} placeholder="ej. GLI-001" value={form.codigo}
              onChange={e => setForm({...form, codigo: e.target.value})}/>
          </div>
        </div>
        <div className="px-5 py-4 border-t border-borde flex justify-end gap-2">
          <button onClick={onClose} disabled={saving}
            className="text-xs font-medium px-4 py-2 rounded-lg border border-borde text-carbon hover:bg-tierra transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving}
            className="text-xs font-semibold px-4 py-2 rounded-lg bg-verde-act text-white hover:bg-verde transition-colors disabled:opacity-60">
            {saving ? 'Guardando...' : 'Guardar producto'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Panel detalle ──────────────────────────────────────────────────────────────
function PanelDetalle({ prod, onClose }: { prod: Producto, onClose: () => void }) {
  const estado = getEstado(prod)
  const pct = getPct(prod)
  const barColor = getBarColor(estado)
  const vencProx = isVencProximo(prod.vencimiento)

  return (
    <div className="bg-white border border-borde rounded-xl overflow-hidden">
      <div className="bg-verde px-4 py-3 flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-white">{prod.nombre}</p>
          <p className="text-xs text-white/60 mt-0.5">{prod.marca || 'Sin marca'} · {prod.codigo || 'Sin codigo'}</p>
          <span className="mt-1.5 inline-block chip" style={{background:'rgba(255,255,255,.15)',color:'#fff'}}>
            {prod.categoria}
          </span>
        </div>
        <button onClick={onClose} className="text-white/50 hover:text-white mt-0.5"><X size={14}/></button>
      </div>
      <div className="p-4 divide-y divide-borde">

        {/* Stock visual */}
        <div className="pb-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-3">Stock actual</p>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-3xl font-semibold text-carbon">{prod.stock.toLocaleString()}</span>
            <span className="text-sm text-gris mb-1">{prod.unidad}</span>
          </div>
          <div className="w-full bg-tierra rounded-full h-2 mb-2">
            <div className={"h-2 rounded-full transition-all " + barColor} style={{width: pct + '%'}}/>
          </div>
          <div className="flex justify-between text-[10px] text-gris">
            <span>Min: {prod.stock_minimo} {prod.unidad}</span>
            <span>{pct}% del maximo</span>
            <span>Max: {prod.stock_maximo} {prod.unidad}</span>
          </div>
          {estado === 'critico' && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-rojo font-medium bg-rojo-s px-3 py-1.5 rounded-lg">
              <AlertTriangle size={12}/> Stock critico — reabastecimiento urgente
            </div>
          )}
          {estado === 'bajo' && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-ambar font-medium bg-ambar-s px-3 py-1.5 rounded-lg">
              <AlertTriangle size={12}/> Stock bajo — considerar reabastecimiento
            </div>
          )}
        </div>

        {/* Datos */}
        <div className="py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-2">Informacion</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              ['Deposito', prod.deposito || '—'],
              ['Precio unit.', prod.precio_unitario ? 'USD ' + prod.precio_unitario : '—'],
              ['Valor total', prod.precio_unitario ? 'USD ' + (prod.stock * prod.precio_unitario).toLocaleString(undefined, {maximumFractionDigits:0}) : '—'],
              ['Vencimiento', formatDate(prod.vencimiento)],
            ].map(([l, v]) => (
              <div key={l} className="bg-tierra rounded-lg p-2">
                <p className="text-[10px] text-gris mb-0.5">{l}</p>
                <p className={"text-xs font-semibold " + (l === 'Vencimiento' && vencProx ? 'text-ambar' : 'text-carbon')}>{v}</p>
              </div>
            ))}
          </div>
          {vencProx && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-ambar font-medium bg-ambar-s px-3 py-1.5 rounded-lg">
              <AlertTriangle size={12}/> Vencimiento proximo — menos de 60 dias
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="pt-4 flex flex-col gap-2">
          <button className="w-full text-xs font-semibold bg-verde-act text-white py-2 rounded-lg hover:bg-verde transition-colors">
            Registrar movimiento
          </button>
          <button className="w-full text-xs font-medium border border-borde text-carbon py-2 rounded-lg hover:bg-tierra transition-colors">
            Ver historial de movimientos
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Pagina principal ───────────────────────────────────────────────────────────
export default function Inventario() {
  const { establecimiento, loading: loadingEst } = useEstablecimiento()
  const [productos, setProductos] = useState<Producto[]>([])
  const [loadingProd, setLoadingProd] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [catFiltro, setCatFiltro] = useState<string>('Todos')
  const [soloAlertas, setSoloAlertas] = useState(false)
  const [seleccionado, setSeleccionado] = useState<Producto | null>(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [mostrarImport, setMostrarImport] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!establecimiento?.id) return

    let cancelled = false
    async function cargar() {
      setLoadingProd(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from('productos_inventario')
        .select('*')
        .eq('establecimiento_id', establecimiento!.id)
        .order('nombre')

      if (cancelled) return
      if (error) {
        console.error('[Inventario] Error al cargar:', error.message)
        setLoadingProd(false)
        return
      }

      const mapped: Producto[] = (data ?? []).map(p => ({
        id: p.id as string,
        nombre: p.nombre as string,
        categoria: p.categoria as Categoria,
        marca: (p.marca ?? '') as string,
        unidad: p.unidad as string,
        stock: Number(p.stock),
        stock_minimo: Number(p.stock_minimo),
        stock_maximo: p.stock_maximo != null ? Number(p.stock_maximo) : 9999,
        precio_unitario: p.precio_unitario != null ? Number(p.precio_unitario) : 0,
        deposito: (p.deposito ?? '') as string,
        vencimiento: p.vencimiento ?? undefined,
        codigo: p.codigo ?? undefined,
      }))

      setProductos(mapped)
      setLoadingProd(false)
    }

    cargar()
    return () => { cancelled = true }
  }, [establecimiento?.id, refreshKey])

  const loading = loadingEst || loadingProd

  function handleSuccess(p: Producto) {
    setProductos(prev => [...prev, p].sort((a, b) => a.nombre.localeCompare(b.nombre)))
    setMostrarForm(false)
    setSeleccionado(p)
  }

  const filtrados = productos.filter(p => {
    const matchBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.marca.toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.codigo || '').toLowerCase().includes(busqueda.toLowerCase())
    const matchCat = catFiltro === 'Todos' || p.categoria === catFiltro
    const matchAlerta = !soloAlertas || getEstado(p) !== 'ok'
    return matchBusqueda && matchCat && matchAlerta
  })

  const alertas = productos.filter(p => getEstado(p) !== 'ok').length
  const valorTotal = productos.reduce((acc, p) => acc + p.stock * p.precio_unitario, 0)
  const vencProximos = productos.filter(p => isVencProximo(p.vencimiento)).length

  const actions = (
    <div className="flex gap-2">
      <button onClick={() => setMostrarImport(true)} disabled={!establecimiento}
        className="flex items-center gap-1.5 text-xs font-medium border border-borde bg-white text-carbon px-3 py-1.5 rounded-lg hover:bg-tierra transition-colors disabled:opacity-60">
        <Upload size={12}/> Importar Excel
      </button>
      <button
        onClick={() => setMostrarForm(true)}
        className="flex items-center gap-1.5 text-xs font-semibold bg-verde-act text-white px-3 py-1.5 rounded-lg hover:bg-verde transition-colors">
        <Plus size={13}/> Nuevo producto
      </button>
    </div>
  )

  if (loading) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <Topbar title="Inventario" actions={actions}/>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gris">Cargando inventario...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {mostrarImport && establecimiento && (
        <ImportExcelModal
          entityName="productos"
          entityLabel="Inventario"
          tableName="productos_inventario"
          columns={IMPORT_COLUMNS}
          exampleRows={IMPORT_EXAMPLES}
          establecimientoId={establecimiento.id}
          transformRow={(data) => ({
            stock_minimo:    data.stock_minimo    ?? 0,
            unidad:          data.unidad          ?? 'unidades',
            stock_maximo:    data.stock_maximo    || null,
          })}
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
      <Topbar title="Inventario" actions={actions}/>
      <div className="flex-1 overflow-y-auto p-4">

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-2.5 mb-4">
          {[
            { l:'Total productos',   v: productos.length.toString(), s:'en todos los depositos',    c:'border-t-verde-ac' },
            { l:'Alertas de stock',  v: alertas.toString(),          s:'requieren atencion',         c: alertas > 0 ? 'border-t-rojo' : 'border-t-verde-ac' },
            { l:'Venc. proximos',    v: vencProximos.toString(),     s:'menos de 60 dias',           c: vencProximos > 0 ? 'border-t-ambar' : 'border-t-verde-ac' },
            { l:'Valor total stock', v:'USD ' + Math.round(valorTotal).toLocaleString(), s:'valuacion al costo', c:'border-t-azul' },
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
              placeholder="Buscar producto, marca, codigo..."
              className="text-xs outline-none bg-transparent flex-1 text-carbon placeholder:text-gris"/>
          </div>

          <div className="flex gap-1.5 flex-wrap">
            {['Todos', 'Agroquimico', 'Semilla', 'Fertilizante', 'Veterinario', 'Combustible'].map(cat => (
              <button key={cat}
                onClick={() => setCatFiltro(cat)}
                className={"text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium " +
                  (catFiltro === cat
                    ? 'bg-verde text-white border-verde'
                    : 'bg-white border-borde text-carbon hover:bg-tierra')}>
                {cat}
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
            <strong className="text-carbon">{filtrados.length}</strong> productos
          </span>
        </div>

        {/* Sin productos */}
        {productos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Package size={40} className="text-borde mb-3"/>
            <p className="text-sm font-medium text-carbon mb-1">No hay productos en el inventario</p>
            <p className="text-xs text-gris">Usá el botón <strong>Nuevo producto</strong> para registrar el primer insumo</p>
          </div>
        ) : (
          <div className={"grid gap-3 " + (seleccionado ? 'grid-cols-[1fr_300px]' : 'grid-cols-1')}>

            {/* Tabla */}
            <div className="bg-white border border-borde rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-tierra border-b border-borde">
                    {['Producto','Categoria','Deposito','Stock','Nivel','Precio unit.','Vencimiento','Estado'].map(h => (
                      <th key={h} className="text-left px-3 py-2 font-medium text-gris whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-borde">
                  {filtrados.map(prod => {
                    const estado = getEstado(prod)
                    const pct = getPct(prod)
                    const barColor = getBarColor(estado)
                    const vencProx = isVencProximo(prod.vencimiento)
                    return (
                      <tr key={prod.id}
                        onClick={() => setSeleccionado(seleccionado?.id === prod.id ? null : prod)}
                        className={"cursor-pointer transition-colors hover:bg-tierra/50 " +
                          (seleccionado?.id === prod.id ? 'bg-verde-s' : '')}>
                        <td className="px-3 py-2">
                          <p className="font-medium text-carbon">{prod.nombre}</p>
                          <p className="text-[10px] text-gris">{prod.marca} {prod.codigo ? '· ' + prod.codigo : ''}</p>
                        </td>
                        <td className="px-3 py-2">
                          <span className={getCatColor(prod.categoria)}>{prod.categoria}</span>
                        </td>
                        <td className="px-3 py-2 text-gris">{prod.deposito || '—'}</td>
                        <td className="px-3 py-2 font-medium text-carbon whitespace-nowrap">
                          {prod.stock.toLocaleString()} {prod.unidad}
                        </td>
                        <td className="px-3 py-2 min-w-[80px]">
                          <div className="w-full bg-tierra rounded-full h-1.5">
                            <div className={"h-1.5 rounded-full " + barColor} style={{width: pct + '%'}}/>
                          </div>
                          <p className="text-[10px] text-gris mt-0.5">{pct}%</p>
                        </td>
                        <td className="px-3 py-2 text-carbon">
                          {prod.precio_unitario ? 'USD ' + prod.precio_unitario : '—'}
                        </td>
                        <td className={"px-3 py-2 " + (vencProx ? 'text-ambar font-medium' : 'text-gris')}>
                          {formatDate(prod.vencimiento)}
                          {vencProx && <span className="ml-1">⚠</span>}
                        </td>
                        <td className="px-3 py-2">
                          {estado === 'critico' && <span className="chip chip-red">Critico</span>}
                          {estado === 'bajo'    && <span className="chip chip-amber">Bajo</span>}
                          {estado === 'ok'      && <span className="chip chip-green">OK</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {filtrados.length === 0 && productos.length > 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Package size={32} className="text-borde mb-3"/>
                  <p className="text-sm font-medium text-carbon mb-1">No hay productos con ese filtro</p>
                  <p className="text-xs text-gris">Cambia los filtros para ver otros productos</p>
                </div>
              )}
            </div>

            {/* Panel detalle */}
            {seleccionado && (
              <PanelDetalle prod={seleccionado} onClose={() => setSeleccionado(null)}/>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
