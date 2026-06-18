'use client'
import { useState, useEffect } from 'react'
import { Search, Plus, TrendingUp, TrendingDown, X, Calculator, FileText, ArrowUpRight, ArrowDownRight, DollarSign, Filter, ChevronDown } from 'lucide-react'
import Topbar from '@/components/Topbar'
import { createClient } from '@/lib/supabase'
import { useEstablecimiento } from '@/hooks/useEstablecimiento'

// ── Tipos ─────────────────────────────────────────────────────────────────────
type TipoMovimiento = 'Ingreso' | 'Egreso'
type CategoriaContable = 'Venta hacienda' | 'Venta granos' | 'Servicios' |
                          'Insumos' | 'Combustible' | 'Salarios' | 'Servicios profesionales' |
                          'Maquinaria' | 'Veterinaria' | 'Impuestos' | 'Financiero' | 'Otros'

type Movimiento = {
  id: string
  fecha: string
  tipo: TipoMovimiento
  categoria: CategoriaContable
  detalle: string
  contraparte: string
  monto: number
  moneda: 'USD' | 'ARS'
  centro_costo?: string
  campania?: string
  comprobante?: string
  metodo_pago?: string
  conciliado?: boolean
}

const CATEGORIAS_INGRESO: CategoriaContable[] = [
  'Venta hacienda', 'Venta granos', 'Servicios', 'Otros',
]
const CATEGORIAS_EGRESO: CategoriaContable[] = [
  'Insumos', 'Combustible', 'Salarios', 'Servicios profesionales',
  'Maquinaria', 'Veterinaria', 'Impuestos', 'Financiero', 'Otros',
]

// ── Helpers ────────────────────────────────────────────────────────────────────
function getCatColor(c: CategoriaContable): { chip: string, color: string } {
  if (c.startsWith('Venta')) return { chip: 'chip chip-green', color: '#27500A' }
  if (c === 'Servicios') return { chip: 'chip chip-green', color: '#27500A' }
  if (c === 'Insumos') return { chip: 'chip chip-amber', color: '#854F0B' }
  if (c === 'Combustible') return { chip: 'chip chip-gray', color: '#5F5E5A' }
  if (c === 'Salarios') return { chip: 'chip chip-blue', color: '#185FA5' }
  if (c === 'Servicios profesionales') return { chip: 'chip chip-purple', color: '#3C3489' }
  if (c === 'Maquinaria') return { chip: 'chip chip-gray', color: '#5F5E5A' }
  if (c === 'Veterinaria') return { chip: 'chip chip-purple', color: '#3C3489' }
  if (c === 'Impuestos') return { chip: 'chip chip-red', color: '#791F1F' }
  if (c === 'Financiero') return { chip: 'chip chip-amber', color: '#854F0B' }
  return { chip: 'chip chip-gray', color: '#5F5E5A' }
}

function formatDate(d: string) {
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function formatUSD(n: number, dec = 0) {
  return 'USD ' + n.toLocaleString(undefined, { maximumFractionDigits: dec })
}

function getMesNombre(m: number) {
  return ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][m]
}

function hoy() {
  return new Date().toISOString().split('T')[0]
}

// ── Grafico de resultados mensuales ───────────────────────────────────────────
function GraficoResultados({ movimientos }: { movimientos: Movimiento[] }) {
  const ahora = new Date()
  const meses: { mes: string, ingresos: number, egresos: number, resultado: number }[] = []

  for (let i = 5; i >= 0; i--) {
    const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1)
    const mesNum = fecha.getMonth()
    const anio = fecha.getFullYear()
    const mesStr = getMesNombre(mesNum)

    const movsMes = movimientos.filter(m => {
      const fm = new Date(m.fecha)
      return fm.getMonth() === mesNum && fm.getFullYear() === anio
    })

    const ingresos = movsMes.filter(m => m.tipo === 'Ingreso').reduce((acc, m) => acc + m.monto, 0)
    const egresos = movsMes.filter(m => m.tipo === 'Egreso').reduce((acc, m) => acc + m.monto, 0)
    meses.push({ mes: mesStr, ingresos, egresos, resultado: ingresos - egresos })
  }

  const maxValor = Math.max(...meses.flatMap(m => [m.ingresos, m.egresos]), 1)

  return (
    <div className="bg-white border border-borde rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-borde flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={15} className="text-verde-act"/>
          <h3 className="text-sm font-medium text-carbon">Ingresos vs Egresos — ultimos 6 meses</h3>
        </div>
        <div className="flex gap-3 text-[10px]">
          <div className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-verde-act"/>
            <span className="text-gris">Ingresos</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-rojo"/>
            <span className="text-gris">Egresos</span>
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-end gap-2 h-48">
          {meses.map((m, i) => {
            const altoIngresos = (m.ingresos / maxValor) * 100
            const altoEgresos = (m.egresos / maxValor) * 100
            return (
              <div key={i} className="flex-1 flex flex-col items-center">
                <p className={"text-[10px] font-semibold mb-1 " + (m.resultado >= 0 ? 'text-verde' : 'text-rojo')}>
                  {m.resultado !== 0 ? formatUSD(Math.abs(m.resultado) / 1000, 0) + 'K' : '—'}
                </p>
                <div className="w-full flex gap-1 items-end" style={{ height: '160px' }}>
                  <div className="flex-1 flex flex-col-reverse">
                    <div className="w-full bg-verde-act rounded-t-sm transition-all"
                      style={{ height: altoIngresos + '%' }}
                      title={'Ingresos: ' + formatUSD(m.ingresos)}/>
                  </div>
                  <div className="flex-1 flex flex-col-reverse">
                    <div className="w-full bg-rojo rounded-t-sm transition-all"
                      style={{ height: altoEgresos + '%' }}
                      title={'Egresos: ' + formatUSD(m.egresos)}/>
                  </div>
                </div>
                <p className="text-[10px] text-gris mt-2">{m.mes}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Resultado por centro de costo ─────────────────────────────────────────────
function ResultadoPorCentroCosto({ movimientos }: { movimientos: Movimiento[] }) {
  const centros: Record<string, { ingresos: number, egresos: number }> = {}

  movimientos.forEach(m => {
    if (!m.centro_costo) return
    if (!centros[m.centro_costo]) centros[m.centro_costo] = { ingresos: 0, egresos: 0 }
    if (m.tipo === 'Ingreso') centros[m.centro_costo].ingresos += m.monto
    else centros[m.centro_costo].egresos += m.monto
  })

  const items = Object.entries(centros)
    .map(([nombre, datos]) => ({ nombre, ...datos, resultado: datos.ingresos - datos.egresos }))
    .sort((a, b) => b.resultado - a.resultado)

  const maxAbs = Math.max(...items.map(i => Math.abs(i.resultado)), 1)

  return (
    <div className="bg-white border border-borde rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-borde flex items-center gap-2">
        <Filter size={15} className="text-verde-act"/>
        <h3 className="text-sm font-medium text-carbon">Resultado por centro de costo</h3>
      </div>
      <div className="p-4 space-y-3">
        {items.length === 0 && (
          <p className="text-xs text-gris text-center py-4">Sin datos de centro de costo</p>
        )}
        {items.map(item => {
          const positivo = item.resultado >= 0
          const ancho = (Math.abs(item.resultado) / maxAbs) * 100
          return (
            <div key={item.nombre}>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-medium text-carbon">{item.nombre}</span>
                <span className={"text-xs font-semibold " + (positivo ? 'text-verde' : 'text-rojo')}>
                  {positivo ? '+' : '−'}{formatUSD(Math.abs(item.resultado))}
                </span>
              </div>
              <div className="w-full bg-tierra rounded-full h-1.5">
                <div className={"h-1.5 rounded-full " + (positivo ? 'bg-verde-act' : 'bg-rojo')}
                  style={{ width: ancho + '%' }}/>
              </div>
              <div className="flex justify-between text-[10px] text-gris mt-1">
                <span>Ing: {formatUSD(item.ingresos, 0)}</span>
                <span>Egr: {formatUSD(item.egresos, 0)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Distribucion de egresos por categoria ────────────────────────────────────
function DistribucionEgresos({ movimientos }: { movimientos: Movimiento[] }) {
  const categorias: Record<string, number> = {}
  movimientos.filter(m => m.tipo === 'Egreso').forEach(m => {
    categorias[m.categoria] = (categorias[m.categoria] || 0) + m.monto
  })

  const items = Object.entries(categorias)
    .map(([cat, monto]) => ({ cat, monto }))
    .sort((a, b) => b.monto - a.monto)

  const total = items.reduce((acc, i) => acc + i.monto, 0)
  const colores = ['bg-rojo', 'bg-ambar', 'bg-azul', 'bg-verde-act', 'bg-purple-500', 'bg-pink-500', 'bg-gray-400', 'bg-yellow-500']

  return (
    <div className="bg-white border border-borde rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-borde flex items-center gap-2">
        <Calculator size={15} className="text-verde-act"/>
        <h3 className="text-sm font-medium text-carbon">Distribucion de egresos</h3>
      </div>
      <div className="p-4">
        {items.length === 0 ? (
          <p className="text-xs text-gris text-center py-4">Sin egresos registrados</p>
        ) : (
          <>
            <div className="flex h-3 rounded-full overflow-hidden mb-3">
              {items.map((item, i) => (
                <div key={item.cat}
                  className={colores[i % colores.length] + " h-3"}
                  style={{ width: ((item.monto / total) * 100) + '%' }}
                  title={item.cat + ': ' + formatUSD(item.monto)}/>
              ))}
            </div>
            <div className="space-y-2">
              {items.map((item, i) => {
                const pct = (item.monto / total) * 100
                return (
                  <div key={item.cat} className="flex items-center gap-2">
                    <span className={"inline-block w-2.5 h-2.5 rounded-sm " + colores[i % colores.length]}/>
                    <span className="text-xs text-carbon flex-1 truncate">{item.cat}</span>
                    <span className="text-[10px] text-gris">{pct.toFixed(1)}%</span>
                    <span className="text-xs font-semibold text-carbon w-20 text-right">
                      {formatUSD(item.monto, 0)}
                    </span>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Panel detalle ──────────────────────────────────────────────────────────────
function PanelDetalleMovimiento({ mov, onClose }: { mov: Movimiento, onClose: () => void }) {
  const isIngreso = mov.tipo === 'Ingreso'
  const colors = getCatColor(mov.categoria)

  return (
    <div className="bg-white border border-borde rounded-xl overflow-hidden">
      <div className="bg-verde px-4 py-3 flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">{mov.detalle}</p>
          <p className="text-xs text-white/60 mt-0.5">{mov.contraparte}</p>
          <div className="flex gap-1.5 mt-1.5 flex-wrap">
            <span className={isIngreso ? 'chip chip-green' : 'chip chip-red'}>
              {isIngreso ? '↑ Ingreso' : '↓ Egreso'}
            </span>
            <span className={colors.chip}>{mov.categoria}</span>
            {mov.conciliado && <span className="chip chip-blue">✓ Conciliado</span>}
          </div>
        </div>
        <button onClick={onClose} className="text-white/50 hover:text-white"><X size={14}/></button>
      </div>

      <div className="p-4 divide-y divide-borde">
        {/* Monto destacado */}
        <div className="pb-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-2">Monto</p>
          <p className={"text-3xl font-semibold " + (isIngreso ? 'text-verde' : 'text-rojo')}>
            {isIngreso ? '+' : '−'}{formatUSD(mov.monto, 2)}
          </p>
        </div>

        {/* Datos */}
        <div className="py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-2">Detalle</p>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-tierra rounded-lg p-2">
                <p className="text-[10px] text-gris">Fecha</p>
                <p className="text-xs font-semibold text-carbon">{formatDate(mov.fecha)}</p>
              </div>
              <div className="bg-tierra rounded-lg p-2">
                <p className="text-[10px] text-gris">Pago</p>
                <p className="text-xs font-semibold text-carbon">{mov.metodo_pago || '—'}</p>
              </div>
            </div>
            {mov.comprobante && (
              <div className="bg-azul-s rounded-lg p-2">
                <p className="text-[10px] text-azul">Comprobante</p>
                <p className="text-xs font-mono font-semibold text-carbon">{mov.comprobante}</p>
              </div>
            )}
            {mov.centro_costo && (
              <div className="bg-verde-s rounded-lg p-2">
                <p className="text-[10px] text-verde">Centro de costo</p>
                <p className="text-xs font-semibold text-carbon">{mov.centro_costo}</p>
              </div>
            )}
            {mov.campania && (
              <div className="bg-ambar-s rounded-lg p-2">
                <p className="text-[10px]" style={{color:'#854F0B'}}>Campaña</p>
                <p className="text-xs font-semibold text-carbon">{mov.campania}</p>
              </div>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="pt-4 flex flex-col gap-2">
          {!mov.conciliado && (
            <button className="w-full text-xs font-semibold bg-verde-act text-white py-2 rounded-lg hover:bg-verde transition-colors">
              Marcar como conciliado
            </button>
          )}
          <button className="w-full text-xs font-medium border border-borde text-carbon py-2 rounded-lg hover:bg-tierra transition-colors">
            Ver comprobante
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Formulario nuevo movimiento ───────────────────────────────────────────────
function FormNuevoMovimiento({
  establecimientoId,
  onClose,
  onSuccess,
}: {
  establecimientoId: string
  onClose: () => void
  onSuccess: (m: Movimiento) => void
}) {
  const [tipo, setTipo] = useState<TipoMovimiento>('Egreso')
  const [fecha, setFecha] = useState(hoy())
  const [categoria, setCategoria] = useState<CategoriaContable>('Insumos')
  const [detalle, setDetalle] = useState('')
  const [monto, setMonto] = useState('')
  const [moneda, setMoneda] = useState<'USD' | 'ARS'>('USD')
  const [contraparte, setContraparte] = useState('')
  const [metodoPago, setMetodoPago] = useState('')
  const [comprobante, setComprobante] = useState('')
  const [centroCosto, setCentroCosto] = useState('')
  const [campania, setCampania] = useState('')
  const [conciliado, setConciliado] = useState(false)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inputCls = 'w-full text-sm border border-borde rounded-lg px-3 py-2 outline-none focus:border-verde focus:ring-1 focus:ring-verde/20 bg-white text-carbon placeholder:text-gris'

  const categoriasDisponibles = tipo === 'Ingreso' ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO

  // Resetear categoría cuando cambia el tipo para no enviar valor inválido
  function handleTipoChange(t: TipoMovimiento) {
    setTipo(t)
    setCategoria(t === 'Ingreso' ? 'Venta hacienda' : 'Insumos')
  }

  async function handleSave() {
    if (!detalle.trim()) { setError('El detalle es obligatorio.'); return }
    if (!monto || Number(monto) <= 0) { setError('El monto debe ser mayor a cero.'); return }

    setSaving(true)
    setError(null)
    try {
      const supabase = createClient()
      const id = crypto.randomUUID()

      const { error: dbError } = await supabase.from('movimientos_contables').insert({
        id,
        establecimiento_id: establecimientoId,
        fecha,
        tipo,
        categoria,
        detalle: detalle.trim(),
        contraparte: contraparte.trim() || null,
        monto: Number(monto),
        moneda,
        metodo_pago: metodoPago.trim() || null,
        comprobante: comprobante.trim() || null,
        centro_costo: centroCosto.trim() || null,
        campania: campania.trim() || null,
        conciliado,
      })

      if (dbError) {
        setError('Error al guardar: ' + dbError.message)
        return
      }

      const mov: Movimiento = {
        id,
        fecha,
        tipo,
        categoria,
        detalle: detalle.trim(),
        contraparte: contraparte.trim(),
        monto: Number(monto),
        moneda,
        metodo_pago: metodoPago.trim() || undefined,
        comprobante: comprobante.trim() || undefined,
        centro_costo: centroCosto.trim() || undefined,
        campania: campania.trim() || undefined,
        conciliado,
      }
      onSuccess(mov)
    } catch (err) {
      setError('Error inesperado.')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="bg-verde px-5 py-4 flex items-center justify-between rounded-t-2xl sticky top-0">
          <div>
            <h2 className="text-sm font-semibold text-white">Nuevo movimiento</h2>
            <p className="text-xs text-white/60 mt-0.5">Registrá un ingreso o egreso</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white"><X size={16}/></button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">{error}</div>
          )}

          {/* Tipo */}
          <div>
            <label className="block text-xs font-medium text-carbon mb-1.5">Tipo *</label>
            <div className="flex gap-2">
              {(['Ingreso', 'Egreso'] as TipoMovimiento[]).map(t => (
                <button key={t} type="button"
                  onClick={() => handleTipoChange(t)}
                  className={"flex-1 text-xs py-2 rounded-lg border font-medium transition-colors " +
                    (tipo === t
                      ? (t === 'Ingreso' ? 'bg-verde text-white border-verde' : 'bg-rojo text-white border-rojo')
                      : 'bg-white border-borde text-carbon hover:bg-tierra')}>
                  {t === 'Ingreso' ? '↑ Ingreso' : '↓ Egreso'}
                </button>
              ))}
            </div>
          </div>

          {/* Fecha y Categoría */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-carbon mb-1.5">Fecha *</label>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={inputCls}/>
            </div>
            <div>
              <label className="block text-xs font-medium text-carbon mb-1.5">Categoría *</label>
              <select value={categoria} onChange={e => setCategoria(e.target.value as CategoriaContable)} className={inputCls}>
                {categoriasDisponibles.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Detalle */}
          <div>
            <label className="block text-xs font-medium text-carbon mb-1.5">Detalle *</label>
            <input value={detalle} onChange={e => setDetalle(e.target.value)}
              placeholder="Describí el movimiento"
              className={inputCls}/>
          </div>

          {/* Monto y Moneda */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-carbon mb-1.5">Monto *</label>
              <input type="number" value={monto} onChange={e => setMonto(e.target.value)}
                min="0" step="0.01" placeholder="0.00" className={inputCls}/>
            </div>
            <div>
              <label className="block text-xs font-medium text-carbon mb-1.5">Moneda *</label>
              <select value={moneda} onChange={e => setMoneda(e.target.value as 'USD' | 'ARS')} className={inputCls}>
                <option value="USD">USD</option>
                <option value="ARS">ARS</option>
              </select>
            </div>
          </div>

          {/* Contraparte y Método de pago */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-carbon mb-1.5">Contraparte</label>
              <input value={contraparte} onChange={e => setContraparte(e.target.value)}
                placeholder="Cliente o proveedor" className={inputCls}/>
            </div>
            <div>
              <label className="block text-xs font-medium text-carbon mb-1.5">Método de pago</label>
              <input value={metodoPago} onChange={e => setMetodoPago(e.target.value)}
                placeholder="Transferencia, Cheque..." className={inputCls}/>
            </div>
          </div>

          {/* Comprobante y Centro de costo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-carbon mb-1.5">Comprobante</label>
              <input value={comprobante} onChange={e => setComprobante(e.target.value)}
                placeholder="V-2026-0001" className={inputCls}/>
            </div>
            <div>
              <label className="block text-xs font-medium text-carbon mb-1.5">Centro de costo</label>
              <input value={centroCosto} onChange={e => setCentroCosto(e.target.value)}
                placeholder="Lote o rodeo" className={inputCls}/>
            </div>
          </div>

          {/* Campaña y Conciliado */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-carbon mb-1.5">Campaña</label>
              <input value={campania} onChange={e => setCampania(e.target.value)}
                placeholder="2025/26" className={inputCls}/>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={conciliado} onChange={e => setConciliado(e.target.checked)}
                  className="w-4 h-4 accent-verde rounded"/>
                <span className="text-sm text-carbon">Ya conciliado</span>
              </label>
            </div>
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-2">
          <button onClick={onClose}
            className="flex-1 text-sm font-medium border border-borde text-carbon py-2.5 rounded-lg hover:bg-tierra transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 text-sm font-semibold bg-verde-act text-white py-2.5 rounded-lg hover:bg-verde transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
            {saving ? 'Guardando...' : 'Guardar movimiento'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Pagina principal ───────────────────────────────────────────────────────────
export default function Contabilidad() {
  const { establecimiento } = useEstablecimiento()
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [loadingMovs, setLoadingMovs] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState<string>('Todos')
  const [catFiltro] = useState<string>('Todos')
  const [seleccionado, setSeleccionado] = useState<Movimiento | null>(null)

  useEffect(() => {
    if (!establecimiento?.id) return
    let cancelled = false

    async function cargar() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('movimientos_contables')
        .select('*')
        .eq('establecimiento_id', establecimiento!.id)
        .order('fecha', { ascending: false })

      if (cancelled) return
      if (error) {
        console.error('[Contabilidad] Error al cargar:', error.message)
        setLoadingMovs(false)
        return
      }

      const mapped: Movimiento[] = (data ?? []).map(m => ({
        id: m.id as string,
        fecha: m.fecha as string,
        tipo: m.tipo as TipoMovimiento,
        categoria: m.categoria as CategoriaContable,
        detalle: m.detalle as string,
        contraparte: (m.contraparte ?? '') as string,
        monto: Number(m.monto),
        moneda: m.moneda as 'USD' | 'ARS',
        centro_costo: m.centro_costo ?? undefined,
        campania: m.campania ?? undefined,
        comprobante: m.comprobante ?? undefined,
        metodo_pago: m.metodo_pago ?? undefined,
        conciliado: m.conciliado as boolean,
      }))

      setMovimientos(mapped)
      setLoadingMovs(false)
    }

    cargar()
    return () => { cancelled = true }
  }, [establecimiento?.id])

  function handleSuccess(m: Movimiento) {
    setMovimientos(prev => [m, ...prev])
    setMostrarForm(false)
    setSeleccionado(m)
  }

  const filtrados = movimientos.filter(m => {
    const matchBusqueda = m.detalle.toLowerCase().includes(busqueda.toLowerCase()) ||
      m.contraparte.toLowerCase().includes(busqueda.toLowerCase()) ||
      (m.comprobante || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (m.centro_costo || '').toLowerCase().includes(busqueda.toLowerCase())
    const matchTipo = tipoFiltro === 'Todos' || m.tipo === tipoFiltro
    const matchCat = catFiltro === 'Todos' || m.categoria === catFiltro
    return matchBusqueda && matchTipo && matchCat
  })

  // KPIs
  const ingresos = movimientos.filter(m => m.tipo === 'Ingreso').reduce((acc, m) => acc + m.monto, 0)
  const egresos = movimientos.filter(m => m.tipo === 'Egreso').reduce((acc, m) => acc + m.monto, 0)
  const resultado = ingresos - egresos
  const margen = ingresos > 0 ? (resultado / ingresos) * 100 : 0

  const actions = (
    <div className="flex gap-2">
      <button className="flex items-center gap-1.5 text-xs font-medium border border-borde bg-white text-carbon px-3 py-1.5 rounded-lg hover:bg-tierra transition-colors">
        <FileText size={13}/> Balance
      </button>
      <button
        onClick={() => setMostrarForm(true)}
        className="flex items-center gap-1.5 text-xs font-semibold bg-verde-act text-white px-3 py-1.5 rounded-lg hover:bg-verde transition-colors">
        <Plus size={13}/> Nuevo movimiento
      </button>
    </div>
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Contabilidad" actions={actions}/>

      {mostrarForm && establecimiento && (
        <FormNuevoMovimiento
          establecimientoId={establecimiento.id}
          onClose={() => setMostrarForm(false)}
          onSuccess={handleSuccess}
        />
      )}

      <div className="flex-1 overflow-y-auto p-4">

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-2.5 mb-4">
          <div className="bg-white border border-borde rounded-xl p-3 border-t-2 border-t-verde-ac">
            <div className="text-[10px] text-gris mb-1 uppercase tracking-wide font-medium flex items-center gap-1">
              <ArrowUpRight size={12} className="text-verde"/> Ingresos totales
            </div>
            <div className="text-xl font-semibold text-verde">{formatUSD(ingresos)}</div>
            <div className="text-[10px] text-gris">todos los registros</div>
          </div>
          <div className="bg-white border border-borde rounded-xl p-3 border-t-2 border-t-rojo">
            <div className="text-[10px] text-gris mb-1 uppercase tracking-wide font-medium flex items-center gap-1">
              <ArrowDownRight size={12} className="text-rojo"/> Egresos totales
            </div>
            <div className="text-xl font-semibold text-rojo">{formatUSD(egresos)}</div>
            <div className="text-[10px] text-gris">todos los registros</div>
          </div>
          <div className={"bg-white border border-borde rounded-xl p-3 border-t-2 " +
            (resultado >= 0 ? 'border-t-verde-ac' : 'border-t-rojo')}>
            <div className="text-[10px] text-gris mb-1 uppercase tracking-wide font-medium">Resultado neto</div>
            <div className={"text-xl font-semibold " + (resultado >= 0 ? 'text-verde' : 'text-rojo')}>
              {resultado >= 0 ? '+' : '−'}{formatUSD(Math.abs(resultado))}
            </div>
            <div className="text-[10px] text-gris">ingresos − egresos</div>
          </div>
          <div className="bg-white border border-borde rounded-xl p-3 border-t-2 border-t-azul">
            <div className="text-[10px] text-gris mb-1 uppercase tracking-wide font-medium">Margen</div>
            <div className="text-xl font-semibold text-azul">{margen.toFixed(1)}%</div>
            <div className="text-[10px] text-gris">sobre ingresos</div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <GraficoResultados movimientos={movimientos}/>
          <DistribucionEgresos movimientos={movimientos}/>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <ResultadoPorCentroCosto movimientos={movimientos}/>
          <div className="bg-white border border-borde rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-borde flex items-center gap-2">
              <DollarSign size={15} className="text-verde-act"/>
              <h3 className="text-sm font-medium text-carbon">Resumen ejecutivo</h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between p-2 bg-verde-s rounded-lg">
                <span className="text-xs text-carbon">Margen de operacion</span>
                <span className="text-sm font-semibold text-verde">{margen.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-azul-s rounded-lg">
                <span className="text-xs text-carbon">Ratio ingresos/egresos</span>
                <span className="text-sm font-semibold text-azul">
                  {egresos > 0 ? (ingresos / egresos).toFixed(2) : '—'}x
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-ambar-s rounded-lg">
                <span className="text-xs text-carbon">Movimientos sin conciliar</span>
                <span className="text-sm font-semibold" style={{color:'#854F0B'}}>
                  {movimientos.filter(m => m.tipo === 'Ingreso' && !m.conciliado).length}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-tierra rounded-lg">
                <span className="text-xs text-carbon">Total movimientos</span>
                <span className="text-sm font-semibold text-carbon">{movimientos.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <div className="flex items-center gap-2 bg-white border border-borde rounded-lg px-3 py-1.5 flex-1 max-w-xs">
            <Search size={13} className="text-gris flex-shrink-0"/>
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar movimiento, contraparte..."
              className="text-xs outline-none bg-transparent flex-1 text-carbon placeholder:text-gris"/>
          </div>
          <div className="flex gap-1.5">
            {(['Todos', 'Ingreso', 'Egreso'] as const).map(t => (
              <button key={t}
                onClick={() => setTipoFiltro(t)}
                className={"text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium " +
                  (tipoFiltro === t
                    ? (t === 'Ingreso' ? 'bg-verde text-white border-verde' :
                       t === 'Egreso' ? 'bg-rojo text-white border-rojo' :
                       'bg-verde text-white border-verde')
                    : 'bg-white border-borde text-carbon hover:bg-tierra')}>
                {t}
              </button>
            ))}
          </div>
          <span className="ml-auto text-xs text-gris bg-tierra border border-borde px-3 py-1.5 rounded-lg">
            <strong className="text-carbon">{filtrados.length}</strong> movimientos
          </span>
        </div>

        {/* Tabla + Detalle */}
        {loadingMovs ? (
          <div className="bg-white border border-borde rounded-xl flex items-center justify-center py-12">
            <p className="text-sm text-gris">Cargando movimientos...</p>
          </div>
        ) : (
          <div className={"grid gap-3 " + (seleccionado ? 'grid-cols-[1fr_320px]' : 'grid-cols-1')}>
            <div className="bg-white border border-borde rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-tierra border-b border-borde">
                    {['Fecha','Tipo','Detalle','Categoria','Contraparte','Centro costo','Monto','Estado'].map(h => (
                      <th key={h} className="text-left px-3 py-2 font-medium text-gris">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-borde">
                  {filtrados.map(mov => {
                    const colors = getCatColor(mov.categoria)
                    const isIngreso = mov.tipo === 'Ingreso'
                    return (
                      <tr key={mov.id}
                        onClick={() => setSeleccionado(seleccionado?.id === mov.id ? null : mov)}
                        className={"cursor-pointer transition-colors hover:bg-tierra/50 " +
                          (seleccionado?.id === mov.id ? 'bg-verde-s' : '')}>
                        <td className="px-3 py-2 text-gris whitespace-nowrap">{formatDate(mov.fecha)}</td>
                        <td className="px-3 py-2">
                          {isIngreso ? (
                            <ArrowUpRight size={14} className="text-verde"/>
                          ) : (
                            <ArrowDownRight size={14} className="text-rojo"/>
                          )}
                        </td>
                        <td className="px-3 py-2 text-carbon font-medium max-w-xs truncate">{mov.detalle}</td>
                        <td className="px-3 py-2">
                          <span className={colors.chip}>{mov.categoria}</span>
                        </td>
                        <td className="px-3 py-2 text-gris">{mov.contraparte || '—'}</td>
                        <td className="px-3 py-2 text-gris text-[11px]">{mov.centro_costo || '—'}</td>
                        <td className={"px-3 py-2 font-semibold whitespace-nowrap " + (isIngreso ? 'text-verde' : 'text-rojo')}>
                          {isIngreso ? '+' : '−'}{formatUSD(mov.monto, 0)}
                        </td>
                        <td className="px-3 py-2">
                          {mov.conciliado ? (
                            <span className="chip chip-green">✓</span>
                          ) : (
                            <span className="chip chip-gray">Pendiente</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {movimientos.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Calculator size={32} className="text-borde mb-3"/>
                  <p className="text-sm font-medium text-carbon mb-1">Todavía no hay movimientos registrados</p>
                  <p className="text-xs text-gris">Registrá tu primer movimiento con el botón "Nuevo movimiento"</p>
                </div>
              )}
              {movimientos.length > 0 && filtrados.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Calculator size={32} className="text-borde mb-3"/>
                  <p className="text-sm font-medium text-carbon mb-1">Sin resultados</p>
                  <p className="text-xs text-gris">Cambiá los filtros para ver otros movimientos</p>
                </div>
              )}
            </div>

            {seleccionado && (
              <PanelDetalleMovimiento mov={seleccionado} onClose={() => setSeleccionado(null)}/>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
