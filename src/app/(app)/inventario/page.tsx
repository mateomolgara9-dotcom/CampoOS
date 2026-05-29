'use client'
import { useState } from 'react'
import { Search, Plus, Package, AlertTriangle, Filter, X, ChevronDown } from 'lucide-react'
import Topbar from '@/components/Topbar'

// ── Tipos ─────────────────────────────────────────────────────────────────────
type Categoria ='Agroquimico' | 'Semilla' | 'Fertilizante' | 'Veterinario' | 'Herramienta' | 'Combustible' | 'Lubricante' | 'Otro'
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

// ── Datos de ejemplo ──────────────────────────────────────────────────────────
const PRODUCTOS: Producto[] = [
  { id:'1', nombre:'Glifosato 48%',         categoria:'Agroquimico',  marca:'Monsanto',   unidad:'litros',  stock:180,  stock_minimo:50,  stock_maximo:400, precio_unitario:4.2,  deposito:'Deposito principal', vencimiento:'2026-12-01', codigo:'GLI-001' },
  { id:'2', nombre:'2,4-D Amina 72%',        categoria:'Agroquimico',  marca:'Dow',        unidad:'litros',  stock:45,   stock_minimo:40,  stock_maximo:200, precio_unitario:5.8,  deposito:'Deposito principal', vencimiento:'2026-08-15', codigo:'2D4-002' },
  { id:'3', nombre:'Semilla Maiz DK7500',    categoria:'Semilla',      marca:'Dekalb',     unidad:'kg',      stock:850,  stock_minimo:200, stock_maximo:2000,precio_unitario:8.5,  deposito:'Silo 1',             vencimiento:'2026-09-01', codigo:'SEM-003' },
  { id:'4', nombre:'Semilla Soja DM4214',    categoria:'Semilla',      marca:'Don Mario',  unidad:'kg',      stock:1200, stock_minimo:500, stock_maximo:3000,precio_unitario:6.2,  deposito:'Silo 1',             vencimiento:'2026-11-01', codigo:'SEM-004' },
  { id:'5', nombre:'Urea granulada',         categoria:'Fertilizante', marca:'YPF Agro',   unidad:'kg',      stock:2800, stock_minimo:500, stock_maximo:5000,precio_unitario:0.85, deposito:'Silo 2',             codigo:'FER-005' },
  { id:'6', nombre:'Ivermectina 1%',         categoria:'Veterinario',  marca:'Coopers',    unidad:'litros',  stock:8,    stock_minimo:10,  stock_maximo:50,  precio_unitario:28.0, deposito:'Deposito vet.',      vencimiento:'2027-03-01', codigo:'VET-006' },
  { id:'7', nombre:'Vacuna Aftosa bivalente',categoria:'Veterinario',  marca:'Biogenesis', unidad:'dosis',   stock:150,  stock_minimo:200, stock_maximo:600, precio_unitario:1.8,  deposito:'Camara fria',        vencimiento:'2026-07-01', codigo:'VET-007' },
  { id:'8', nombre:'Gas oil',                categoria:'Combustible',  marca:'YPF',        unidad:'litros',  stock:3200, stock_minimo:1000,stock_maximo:8000,precio_unitario:1.05, deposito:'Tanque campo',       codigo:'COM-008' },
  { id:'9', nombre:'Aceite motor 15W40',     categoria:'Lubricante',   marca:'Mobil',      unidad:'litros',  stock:24,   stock_minimo:20,  stock_maximo:100, precio_unitario:12.0, deposito:'Taller',             codigo:'LUB-009' },
  { id:'10',nombre:'Herbicida Atrazina 50%', categoria:'Agroquimico',  marca:'Nufarm',     unidad:'litros',  stock:22,   stock_minimo:30,  stock_maximo:150, precio_unitario:7.4,  deposito:'Deposito principal', vencimiento:'2026-10-01', codigo:'AGR-010' },
]

const CATEGORIAS: Categoria[] = ['Agroquimico','Semilla','Fertilizante','Veterinario','Herramienta','Combustible','Otro']
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
function FormNuevo({ onClose, onSave }: { onClose: () => void, onSave: (p: Producto) => void }) {
  const [form, setForm] = useState({
    nombre: '', categoria: 'Agroquimico' as Categoria, marca: '',
    unidad: 'litros', stock: '', stock_minimo: '', stock_maximo: '',
    precio_unitario: '', deposito: 'Deposito principal', vencimiento: '', codigo: ''
  })

  function handleSave() {
    if (!form.nombre || !form.stock) return
    const nuevo: Producto = {
      id: Date.now().toString(),
      nombre: form.nombre, categoria: form.categoria, marca: form.marca,
      unidad: form.unidad, stock: Number(form.stock),
      stock_minimo: Number(form.stock_minimo) || 0,
      stock_maximo: Number(form.stock_maximo) || 9999,
      precio_unitario: Number(form.precio_unitario) || 0,
      deposito: form.deposito,
      vencimiento: form.vencimiento || undefined,
      codigo: form.codigo || undefined,
    }
    onSave(nuevo)
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
              {['litros','kg','unidades','dosis','bolsas','tn'].map(u => <option key={u}>{u}</option>)}
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
          <button onClick={onClose}
            className="text-xs font-medium px-4 py-2 rounded-lg border border-borde text-carbon hover:bg-tierra transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave}
            className="text-xs font-semibold px-4 py-2 rounded-lg bg-verde-act text-white hover:bg-verde transition-colors">
            Guardar producto
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
          <p className="text-xs text-white/60 mt-0.5">{prod.marca} · {prod.codigo || 'Sin codigo'}</p>
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
              ['Deposito', prod.deposito],
              ['Precio unit.', 'USD ' + prod.precio_unitario],
              ['Valor total', 'USD ' + (prod.stock * prod.precio_unitario).toLocaleString(undefined, {maximumFractionDigits:0})],
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
  const [productos, setProductos] = useState<Producto[]>(PRODUCTOS)
  const [busqueda, setBusqueda] = useState('')
  const [catFiltro, setCatFiltro] = useState<string>('Todos')
  const [soloAlertas, setSoloAlertas] = useState(false)
  const [seleccionado, setSeleccionado] = useState<Producto | null>(null)
  const [mostrarForm, setMostrarForm] = useState(false)

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

  function handleSave(p: Producto) {
    setProductos(prev => [...prev, p])
    setMostrarForm(false)
    setSeleccionado(p)
  }

  const actions = (
    <div className="flex gap-2">
      <button
        onClick={() => setMostrarForm(true)}
        className="flex items-center gap-1.5 text-xs font-semibold bg-verde-act text-white px-3 py-1.5 rounded-lg hover:bg-verde transition-colors">
        <Plus size={13}/> Nuevo producto
      </button>
    </div>
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {mostrarForm && <FormNuevo onClose={() => setMostrarForm(false)} onSave={handleSave}/>}
      <Topbar title="Inventario" actions={actions}/>
      <div className="flex-1 overflow-y-auto p-4">

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-2.5 mb-4">
          {[
            { l:'Total productos',    v: productos.length.toString(), s:'en todos los depositos',    c:'border-t-verde-ac' },
            { l:'Alertas de stock',   v: alertas.toString(),          s:'requieren atencion',         c: alertas > 0 ? 'border-t-rojo' : 'border-t-verde-ac' },
            { l:'Venc. proximos',     v: vencProximos.toString(),     s:'menos de 60 dias',           c: vencProximos > 0 ? 'border-t-ambar' : 'border-t-verde-ac' },
            { l:'Valor total stock',  v:'USD ' + Math.round(valorTotal).toLocaleString(), s:'valuacion al costo', c:'border-t-azul' },
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

          {/* Categorias */}
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

        {/* Tabla + panel */}
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
                      <td className="px-3 py-2 text-gris">{prod.deposito}</td>
                      <td className="px-3 py-2 font-medium text-carbon whitespace-nowrap">
                        {prod.stock.toLocaleString()} {prod.unidad}
                      </td>
                      <td className="px-3 py-2 min-w-[80px]">
                        <div className="w-full bg-tierra rounded-full h-1.5">
                          <div className={"h-1.5 rounded-full " + barColor} style={{width: pct + '%'}}/>
                        </div>
                        <p className="text-[10px] text-gris mt-0.5">{pct}%</p>
                      </td>
                      <td className="px-3 py-2 text-carbon">USD {prod.precio_unitario}</td>
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
            {filtrados.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Package size={32} className="text-borde mb-3"/>
                <p className="text-sm font-medium text-carbon mb-1">No hay productos</p>
                <p className="text-xs text-gris">Cambia los filtros o agrega un nuevo producto</p>
              </div>
            )}
          </div>

          {/* Panel detalle */}
          {seleccionado && (
            <PanelDetalle prod={seleccionado} onClose={() => setSeleccionado(null)}/>
          )}
        </div>
      </div>
    </div>
  )
}
