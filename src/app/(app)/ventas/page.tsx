'use client'
import { useState, useEffect } from 'react'
import { Search, Plus, Receipt, TrendingUp, X, FileText, Truck, Wheat } from 'lucide-react'
import Topbar from '@/components/Topbar'
import { createClient } from '@/lib/supabase'
import { useEstablecimiento } from '@/hooks/useEstablecimiento'

// ── Tipos ─────────────────────────────────────────────────────────────────────
type TipoVenta = 'Hacienda' | 'Granos' | 'Servicios'
type EstadoVenta = 'Pendiente' | 'Confirmada' | 'Liquidada' | 'Cancelada'
type MetodoPago = 'Transferencia' | 'Cheque' | 'Efectivo' | 'Forward'

type Venta = {
  id: string
  numero: string
  fecha: string
  tipo: TipoVenta
  cliente: string
  estado: EstadoVenta
  // Hacienda
  categoria?: string
  cabezas?: number
  peso_promedio?: number
  peso_total?: number
  precio_kg?: number
  // Granos
  producto?: string
  toneladas?: number
  precio_tonelada?: number
  lote_origen?: string
  // Comunes
  total: number
  moneda: 'USD' | 'ARS'
  metodo_pago: MetodoPago
  fecha_pago?: string
  comisiones?: number
  flete?: number
  observaciones?: string
  destino?: string
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function getEstadoChip(e: EstadoVenta) {
  const map: Record<EstadoVenta, string> = {
    'Pendiente':  'chip chip-amber',
    'Confirmada': 'chip chip-blue',
    'Liquidada':  'chip chip-green',
    'Cancelada':  'chip chip-red',
  }
  return map[e]
}

function getTipoChip(t: TipoVenta) {
  const map: Record<TipoVenta, string> = {
    'Hacienda':  'chip chip-green',
    'Granos':    'chip chip-amber',
    'Servicios': 'chip chip-blue',
  }
  return map[t]
}

function getTipoIcon(t: TipoVenta) {
  if (t === 'Hacienda') return <Truck size={14}/>
  if (t === 'Granos') return <Wheat size={14}/>
  return <FileText size={14}/>
}

function formatDate(d?: string) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function formatUSD(n: number) {
  return 'USD ' + n.toLocaleString(undefined, { maximumFractionDigits: 0 })
}

function getMesNombre(m: number) {
  return ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][m]
}

function hoy() {
  return new Date().toISOString().split('T')[0]
}

// ── Grafico de ventas mensuales (SVG) ─────────────────────────────────────────
function GraficoMensual({ ventas }: { ventas: Venta[] }) {
  const ahora = new Date()
  const meses: { mes: string, hacienda: number, granos: number, total: number }[] = []

  for (let i = 5; i >= 0; i--) {
    const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1)
    const mesNum = fecha.getMonth()
    const anio = fecha.getFullYear()
    const mesStr = getMesNombre(mesNum)

    const ventasMes = ventas.filter(v => {
      if (v.estado === 'Pendiente' || v.estado === 'Cancelada') return false
      const fv = new Date(v.fecha)
      return fv.getMonth() === mesNum && fv.getFullYear() === anio
    })

    const hacienda = ventasMes.filter(v => v.tipo === 'Hacienda').reduce((acc, v) => acc + v.total, 0)
    const granos = ventasMes.filter(v => v.tipo === 'Granos').reduce((acc, v) => acc + v.total, 0)
    meses.push({ mes: mesStr, hacienda, granos, total: hacienda + granos })
  }

  const maxTotal = Math.max(...meses.map(m => m.total), 1)

  return (
    <div className="bg-white border border-borde rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-borde flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={15} className="text-verde-act"/>
          <h3 className="text-sm font-medium text-carbon">Ventas ultimos 6 meses</h3>
        </div>
        <div className="flex gap-3 text-[10px]">
          <div className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-verde-act"/>
            <span className="text-gris">Hacienda</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-ambar"/>
            <span className="text-gris">Granos</span>
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-end gap-2 h-48">
          {meses.map((m, i) => {
            const altoTotal = m.total > 0 ? (m.total / maxTotal) * 100 : 0
            const altoHacienda = m.total > 0 ? (m.hacienda / m.total) * altoTotal : 0
            const altoGranos = m.total > 0 ? (m.granos / m.total) * altoTotal : 0
            return (
              <div key={i} className="flex-1 flex flex-col items-center">
                <p className="text-[10px] font-semibold text-carbon mb-1">
                  {m.total > 0 ? formatUSD(m.total / 1000) + 'K' : '—'}
                </p>
                <div className="w-full flex flex-col-reverse" style={{ height: '160px' }}>
                  <div
                    className="w-full bg-verde-act rounded-t-sm"
                    style={{ height: altoHacienda + '%' }}
                    title={'Hacienda: ' + formatUSD(m.hacienda)}
                  />
                  <div
                    className="w-full bg-ambar"
                    style={{ height: altoGranos + '%' }}
                    title={'Granos: ' + formatUSD(m.granos)}
                  />
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

// ── Panel detalle venta ────────────────────────────────────────────────────────
function PanelDetalleVenta({ venta, onClose }: { venta: Venta, onClose: () => void }) {
  const subtotal = venta.total
  const totalNeto = subtotal - (venta.comisiones || 0) - (venta.flete || 0)

  return (
    <div className="bg-white border border-borde rounded-xl overflow-hidden">
      <div className="bg-verde px-4 py-3 flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">{venta.numero}</p>
          <p className="text-xs text-white/60 mt-0.5">{venta.cliente}</p>
          <div className="flex gap-1.5 mt-1.5">
            <span className={getTipoChip(venta.tipo)}>{venta.tipo}</span>
            <span className={getEstadoChip(venta.estado)}>{venta.estado}</span>
          </div>
        </div>
        <button onClick={onClose} className="text-white/50 hover:text-white"><X size={14}/></button>
      </div>

      <div className="p-4 divide-y divide-borde">
        {/* Total destacado */}
        <div className="pb-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-2">Total de la venta</p>
          <p className="text-3xl font-semibold text-verde">{formatUSD(venta.total)}</p>
          <p className="text-[11px] text-gris mt-1">Bruto antes de comisiones y flete</p>
        </div>

        {/* Detalle hacienda */}
        {venta.tipo === 'Hacienda' && (
          <div className="py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-2">Detalle hacienda</p>
            <div className="space-y-2">
              <div className="bg-tierra rounded-lg p-2">
                <p className="text-[10px] text-gris">Categoria</p>
                <p className="text-xs font-semibold text-carbon">{venta.categoria}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-tierra rounded-lg p-2">
                  <p className="text-[10px] text-gris">Cabezas</p>
                  <p className="text-sm font-semibold text-carbon">{venta.cabezas}</p>
                </div>
                <div className="bg-tierra rounded-lg p-2">
                  <p className="text-[10px] text-gris">Peso promedio</p>
                  <p className="text-sm font-semibold text-carbon">{venta.peso_promedio} kg</p>
                </div>
              </div>
              <div className="bg-verde-s rounded-lg p-2">
                <p className="text-[10px] text-verde">Peso total / Precio por kg</p>
                <p className="text-sm font-semibold text-verde">
                  {venta.peso_total?.toLocaleString()} kg × USD {venta.precio_kg}/kg
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Detalle granos */}
        {venta.tipo === 'Granos' && (
          <div className="py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-2">Detalle granos</p>
            <div className="space-y-2">
              <div className="bg-tierra rounded-lg p-2">
                <p className="text-[10px] text-gris">Producto</p>
                <p className="text-xs font-semibold text-carbon">{venta.producto}</p>
              </div>
              <div className="bg-tierra rounded-lg p-2">
                <p className="text-[10px] text-gris">Lote de origen</p>
                <p className="text-xs font-semibold text-carbon">{venta.lote_origen}</p>
              </div>
              <div className="bg-verde-s rounded-lg p-2">
                <p className="text-[10px] text-verde">Cantidad / Precio</p>
                <p className="text-sm font-semibold text-verde">
                  {venta.toneladas} tn × USD {venta.precio_tonelada}/tn
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Servicios */}
        {venta.tipo === 'Servicios' && venta.observaciones && (
          <div className="py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-2">Detalle del servicio</p>
            <div className="bg-tierra rounded-lg p-3">
              <p className="text-xs text-carbon">{venta.observaciones}</p>
            </div>
          </div>
        )}

        {/* Liquidacion */}
        <div className="py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-2">Liquidacion</p>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gris">Subtotal bruto</span>
              <span className="font-medium text-carbon">{formatUSD(subtotal)}</span>
            </div>
            {!!venta.comisiones && (
              <div className="flex justify-between">
                <span className="text-gris">Comisiones</span>
                <span className="font-medium text-rojo">−{formatUSD(venta.comisiones)}</span>
              </div>
            )}
            {!!venta.flete && (
              <div className="flex justify-between">
                <span className="text-gris">Flete</span>
                <span className="font-medium text-rojo">−{formatUSD(venta.flete)}</span>
              </div>
            )}
            <div className="border-t border-borde pt-1.5 flex justify-between">
              <span className="text-xs font-semibold text-carbon">Total neto</span>
              <span className="text-sm font-bold text-verde">{formatUSD(totalNeto)}</span>
            </div>
          </div>
        </div>

        {/* Datos de pago */}
        <div className="py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-2">Pago y entrega</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-tierra rounded-lg p-2">
              <p className="text-[10px] text-gris">Metodo</p>
              <p className="text-xs font-semibold text-carbon">{venta.metodo_pago}</p>
            </div>
            <div className="bg-tierra rounded-lg p-2">
              <p className="text-[10px] text-gris">Fecha pago</p>
              <p className="text-xs font-semibold text-carbon">{formatDate(venta.fecha_pago)}</p>
            </div>
          </div>
          {venta.destino && (
            <div className="mt-2 bg-tierra rounded-lg p-2">
              <p className="text-[10px] text-gris">Destino</p>
              <p className="text-xs font-semibold text-carbon">{venta.destino}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Formulario nueva venta ─────────────────────────────────────────────────────
function FormNuevaVenta({
  establecimientoId,
  onClose,
  onSuccess,
}: {
  establecimientoId: string
  onClose: () => void
  onSuccess: (v: Venta) => void
}) {
  const [tipo, setTipo] = useState<TipoVenta>('Hacienda')
  const [cliente, setCliente] = useState('')
  const [fecha, setFecha] = useState(hoy())
  const [estado, setEstado] = useState<EstadoVenta>('Pendiente')
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('Transferencia')
  const [moneda, setMoneda] = useState<'USD' | 'ARS'>('USD')
  const [fechaPago, setFechaPago] = useState('')
  const [destino, setDestino] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [comisiones, setComisiones] = useState('')
  const [flete, setFlete] = useState('')

  // Hacienda
  const [categoria, setCategoria] = useState('')
  const [cabezas, setCabezas] = useState('')
  const [pesoPromedio, setPesoPromedio] = useState('')
  const [precioKg, setPrecioKg] = useState('')

  // Granos
  const [producto, setProducto] = useState('')
  const [toneladas, setToneladas] = useState('')
  const [precioTonelada, setPrecioTonelada] = useState('')
  const [loteOrigen, setLoteOrigen] = useState('')

  // Servicios
  const [totalServicios, setTotalServicios] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function calcTotal(): number {
    if (tipo === 'Hacienda') {
      return (Number(cabezas) || 0) * (Number(pesoPromedio) || 0) * (Number(precioKg) || 0)
    }
    if (tipo === 'Granos') {
      return (Number(toneladas) || 0) * (Number(precioTonelada) || 0)
    }
    return Number(totalServicios) || 0
  }

  const inputCls = 'w-full text-sm border border-borde rounded-lg px-3 py-2 outline-none focus:border-verde focus:ring-1 focus:ring-verde/20 bg-white text-carbon placeholder:text-gris'

  async function handleSave() {
    if (!cliente.trim()) { setError('El cliente es obligatorio.'); return }
    if (tipo === 'Hacienda' && (!categoria.trim() || !cabezas || !pesoPromedio || !precioKg)) {
      setError('Completá todos los campos de hacienda.'); return
    }
    if (tipo === 'Granos' && (!producto.trim() || !toneladas || !precioTonelada)) {
      setError('Completá todos los campos de granos.'); return
    }
    if (tipo === 'Servicios' && !totalServicios) {
      setError('Ingresá el total del servicio.'); return
    }

    setSaving(true)
    setError(null)
    try {
      const supabase = createClient()

      const { count } = await supabase
        .from('ventas')
        .select('*', { count: 'exact', head: true })
        .eq('establecimiento_id', establecimientoId)
      const year = new Date().getFullYear()
      const numero = `V-${year}-${String((count ?? 0) + 1).padStart(4, '0')}`

      const totalCalc = calcTotal()
      const pesoTotal = tipo === 'Hacienda'
        ? (Number(cabezas) || 0) * (Number(pesoPromedio) || 0)
        : undefined

      const id = crypto.randomUUID()
      const row: Record<string, unknown> = {
        id,
        establecimiento_id: establecimientoId,
        numero,
        fecha,
        tipo,
        cliente: cliente.trim(),
        estado,
        total: totalCalc,
        moneda,
        metodo_pago: metodoPago,
        fecha_pago: fechaPago || null,
        destino: destino.trim() || null,
        comisiones: comisiones ? Number(comisiones) : null,
        flete: flete ? Number(flete) : null,
        observaciones: tipo !== 'Hacienda' && tipo !== 'Granos' ? observaciones.trim() || null : observaciones.trim() || null,
      }

      if (tipo === 'Hacienda') {
        row.categoria_hacienda = categoria.trim()
        row.cabezas = Number(cabezas)
        row.peso_promedio = Number(pesoPromedio)
        row.peso_total = pesoTotal ?? null
        row.precio_kg = Number(precioKg)
      } else if (tipo === 'Granos') {
        row.producto_grano = producto.trim()
        row.toneladas = Number(toneladas)
        row.precio_tonelada = Number(precioTonelada)
        row.lote_origen = loteOrigen.trim() || null
      }

      const { error: dbError } = await supabase.from('ventas').insert(row)
      if (dbError) {
        if (dbError.code === '23505') {
          setError(`El número ${numero} ya existe. Intentá de nuevo.`)
        } else {
          setError('Error al guardar la venta: ' + dbError.message)
        }
        return
      }

      const venta: Venta = {
        id,
        numero,
        fecha,
        tipo,
        cliente: cliente.trim(),
        estado,
        total: totalCalc,
        moneda,
        metodo_pago: metodoPago,
        fecha_pago: fechaPago || undefined,
        destino: destino.trim() || undefined,
        observaciones: observaciones.trim() || undefined,
        comisiones: comisiones ? Number(comisiones) : undefined,
        flete: flete ? Number(flete) : undefined,
        ...(tipo === 'Hacienda' && {
          categoria: categoria.trim(),
          cabezas: Number(cabezas),
          peso_promedio: Number(pesoPromedio),
          peso_total: pesoTotal,
          precio_kg: Number(precioKg),
        }),
        ...(tipo === 'Granos' && {
          producto: producto.trim(),
          toneladas: Number(toneladas),
          precio_tonelada: Number(precioTonelada),
          lote_origen: loteOrigen.trim() || undefined,
        }),
      }
      onSuccess(venta)
    } catch (err) {
      setError('Error inesperado.')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const totalCalc = calcTotal()

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="bg-verde px-5 py-4 flex items-center justify-between rounded-t-2xl sticky top-0">
          <div>
            <h2 className="text-sm font-semibold text-white">Nueva venta</h2>
            <p className="text-xs text-white/60 mt-0.5">Completá los datos de la operación</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white"><X size={16}/></button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">{error}</div>
          )}

          {/* Tipo */}
          <div>
            <label className="block text-xs font-medium text-carbon mb-1.5">Tipo de venta *</label>
            <div className="flex gap-2">
              {(['Hacienda', 'Granos', 'Servicios'] as TipoVenta[]).map(t => (
                <button key={t} type="button"
                  onClick={() => setTipo(t)}
                  className={"flex-1 text-xs py-2 rounded-lg border font-medium transition-colors " +
                    (tipo === t ? 'bg-verde text-white border-verde' : 'bg-white border-borde text-carbon hover:bg-tierra')}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Cliente */}
          <div>
            <label className="block text-xs font-medium text-carbon mb-1.5">Cliente *</label>
            <input value={cliente} onChange={e => setCliente(e.target.value)}
              placeholder="Nombre o razón social"
              className={inputCls}/>
          </div>

          {/* Fecha y Estado */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-carbon mb-1.5">Fecha *</label>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={inputCls}/>
            </div>
            <div>
              <label className="block text-xs font-medium text-carbon mb-1.5">Estado *</label>
              <select value={estado} onChange={e => setEstado(e.target.value as EstadoVenta)} className={inputCls}>
                {(['Pendiente','Confirmada','Liquidada','Cancelada'] as EstadoVenta[]).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Hacienda */}
          {tipo === 'Hacienda' && (
            <div className="space-y-3 border border-borde rounded-xl p-3 bg-tierra/40">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gris">Detalle hacienda</p>
              <div>
                <label className="block text-xs font-medium text-carbon mb-1.5">Categoría *</label>
                <input value={categoria} onChange={e => setCategoria(e.target.value)}
                  placeholder="Novillos terminados, Vacas de descarte..."
                  className={inputCls}/>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-carbon mb-1.5">Cabezas *</label>
                  <input type="number" value={cabezas} onChange={e => setCabezas(e.target.value)}
                    min="1" placeholder="0" className={inputCls}/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-carbon mb-1.5">Peso prom. (kg) *</label>
                  <input type="number" value={pesoPromedio} onChange={e => setPesoPromedio(e.target.value)}
                    min="0" placeholder="0" className={inputCls}/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-carbon mb-1.5">Precio/kg *</label>
                  <input type="number" value={precioKg} onChange={e => setPrecioKg(e.target.value)}
                    min="0" step="0.01" placeholder="0.00" className={inputCls}/>
                </div>
              </div>
              {totalCalc > 0 && (
                <div className="bg-verde-s rounded-lg px-3 py-2 text-xs text-verde font-medium">
                  Peso total: {((Number(cabezas)||0) * (Number(pesoPromedio)||0)).toLocaleString()} kg · Total: {formatUSD(totalCalc)}
                </div>
              )}
            </div>
          )}

          {/* Granos */}
          {tipo === 'Granos' && (
            <div className="space-y-3 border border-borde rounded-xl p-3 bg-tierra/40">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gris">Detalle granos</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-carbon mb-1.5">Producto *</label>
                  <input value={producto} onChange={e => setProducto(e.target.value)}
                    placeholder="Soja, Maiz, Trigo..." className={inputCls}/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-carbon mb-1.5">Lote de origen</label>
                  <input value={loteOrigen} onChange={e => setLoteOrigen(e.target.value)}
                    placeholder="Nombre del lote" className={inputCls}/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-carbon mb-1.5">Toneladas *</label>
                  <input type="number" value={toneladas} onChange={e => setToneladas(e.target.value)}
                    min="0" step="0.01" placeholder="0.00" className={inputCls}/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-carbon mb-1.5">Precio/tn *</label>
                  <input type="number" value={precioTonelada} onChange={e => setPrecioTonelada(e.target.value)}
                    min="0" step="0.01" placeholder="0.00" className={inputCls}/>
                </div>
              </div>
              {totalCalc > 0 && (
                <div className="bg-verde-s rounded-lg px-3 py-2 text-xs text-verde font-medium">
                  Total: {formatUSD(totalCalc)}
                </div>
              )}
            </div>
          )}

          {/* Servicios */}
          {tipo === 'Servicios' && (
            <div className="space-y-3 border border-borde rounded-xl p-3 bg-tierra/40">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gris">Detalle servicio</p>
              <div>
                <label className="block text-xs font-medium text-carbon mb-1.5">Total *</label>
                <input type="number" value={totalServicios} onChange={e => setTotalServicios(e.target.value)}
                  min="0" step="0.01" placeholder="0.00" className={inputCls}/>
              </div>
              <div>
                <label className="block text-xs font-medium text-carbon mb-1.5">Descripción</label>
                <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)}
                  placeholder="Describí el servicio prestado"
                  rows={2}
                  className="w-full text-sm border border-borde rounded-lg px-3 py-2 outline-none focus:border-verde focus:ring-1 focus:ring-verde/20 bg-white text-carbon placeholder:text-gris resize-none"/>
              </div>
            </div>
          )}

          {/* Pago */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-carbon mb-1.5">Método de pago *</label>
              <select value={metodoPago} onChange={e => setMetodoPago(e.target.value as MetodoPago)} className={inputCls}>
                {(['Transferencia','Cheque','Efectivo','Forward'] as MetodoPago[]).map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-carbon mb-1.5">Moneda *</label>
              <select value={moneda} onChange={e => setMoneda(e.target.value as 'USD' | 'ARS')} className={inputCls}>
                <option value="USD">USD</option>
                <option value="ARS">ARS</option>
              </select>
            </div>
          </div>

          {/* Opcionales */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-carbon mb-1.5">Fecha de pago</label>
              <input type="date" value={fechaPago} onChange={e => setFechaPago(e.target.value)} className={inputCls}/>
            </div>
            <div>
              <label className="block text-xs font-medium text-carbon mb-1.5">Destino</label>
              <input value={destino} onChange={e => setDestino(e.target.value)}
                placeholder="Ciudad / frigorífico..." className={inputCls}/>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-carbon mb-1.5">Comisiones</label>
              <input type="number" value={comisiones} onChange={e => setComisiones(e.target.value)}
                min="0" step="0.01" placeholder="0.00" className={inputCls}/>
            </div>
            <div>
              <label className="block text-xs font-medium text-carbon mb-1.5">Flete</label>
              <input type="number" value={flete} onChange={e => setFlete(e.target.value)}
                min="0" step="0.01" placeholder="0.00" className={inputCls}/>
            </div>
          </div>

          {tipo !== 'Servicios' && (
            <div>
              <label className="block text-xs font-medium text-carbon mb-1.5">Observaciones</label>
              <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)}
                placeholder="Notas adicionales..."
                rows={2}
                className="w-full text-sm border border-borde rounded-lg px-3 py-2 outline-none focus:border-verde focus:ring-1 focus:ring-verde/20 bg-white text-carbon placeholder:text-gris resize-none"/>
            </div>
          )}
        </div>

        <div className="px-5 pb-5 flex gap-2">
          <button onClick={onClose}
            className="flex-1 text-sm font-medium border border-borde text-carbon py-2.5 rounded-lg hover:bg-tierra transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 text-sm font-semibold bg-verde-act text-white py-2.5 rounded-lg hover:bg-verde transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
            {saving ? 'Guardando...' : 'Guardar venta'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Pagina principal ───────────────────────────────────────────────────────────
export default function Ventas() {
  const { establecimiento } = useEstablecimiento()
  const [ventas, setVentas] = useState<Venta[]>([])
  const [loadingVentas, setLoadingVentas] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState<string>('Todos')
  const [estadoFiltro, setEstadoFiltro] = useState<string>('Todos')
  const [seleccionada, setSeleccionada] = useState<Venta | null>(null)

  useEffect(() => {
    if (!establecimiento?.id) return
    let cancelled = false

    async function cargar() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('ventas')
        .select('*')
        .eq('establecimiento_id', establecimiento!.id)
        .order('fecha', { ascending: false })

      if (cancelled) return
      if (error) {
        console.error('[Ventas] Error al cargar:', error.message)
        setLoadingVentas(false)
        return
      }

      const mapped: Venta[] = (data ?? []).map(v => ({
        id: v.id as string,
        numero: v.numero as string,
        fecha: v.fecha as string,
        tipo: v.tipo as TipoVenta,
        cliente: v.cliente as string,
        estado: v.estado as EstadoVenta,
        total: Number(v.total),
        moneda: v.moneda as 'USD' | 'ARS',
        metodo_pago: v.metodo_pago as MetodoPago,
        fecha_pago: v.fecha_pago ?? undefined,
        destino: v.destino ?? undefined,
        observaciones: v.observaciones ?? undefined,
        comisiones: v.comisiones != null ? Number(v.comisiones) : undefined,
        flete: v.flete != null ? Number(v.flete) : undefined,
        // Hacienda
        categoria: v.categoria_hacienda ?? undefined,
        cabezas: v.cabezas != null ? Number(v.cabezas) : undefined,
        peso_promedio: v.peso_promedio != null ? Number(v.peso_promedio) : undefined,
        peso_total: v.peso_total != null ? Number(v.peso_total) : undefined,
        precio_kg: v.precio_kg != null ? Number(v.precio_kg) : undefined,
        // Granos
        producto: v.producto_grano ?? undefined,
        toneladas: v.toneladas != null ? Number(v.toneladas) : undefined,
        precio_tonelada: v.precio_tonelada != null ? Number(v.precio_tonelada) : undefined,
        lote_origen: v.lote_origen ?? undefined,
      }))

      setVentas(mapped)
      setLoadingVentas(false)
    }

    cargar()
    return () => { cancelled = true }
  }, [establecimiento?.id])

  function handleSuccess(v: Venta) {
    setVentas(prev => [v, ...prev])
    setMostrarForm(false)
    setSeleccionada(v)
  }

  const filtradas = ventas.filter(v => {
    const matchBusqueda = v.numero.toLowerCase().includes(busqueda.toLowerCase()) ||
      v.cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
      (v.producto || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (v.categoria || '').toLowerCase().includes(busqueda.toLowerCase())
    const matchTipo = tipoFiltro === 'Todos' || v.tipo === tipoFiltro
    const matchEstado = estadoFiltro === 'Todos' || v.estado === estadoFiltro
    return matchBusqueda && matchTipo && matchEstado
  })

  // KPIs
  const ventasLiquidadas = ventas.filter(v => v.estado === 'Liquidada')
  const totalAcumulado = ventasLiquidadas.reduce((acc, v) => acc + v.total, 0)
  const pendientes = ventas.filter(v => v.estado === 'Pendiente' || v.estado === 'Confirmada')
  const totalPendiente = pendientes.reduce((acc, v) => acc + v.total, 0)
  const cabezasVendidas = ventasLiquidadas.filter(v => v.tipo === 'Hacienda').reduce((acc, v) => acc + (v.cabezas || 0), 0)
  const tnVendidas = ventasLiquidadas.filter(v => v.tipo === 'Granos').reduce((acc, v) => acc + (v.toneladas || 0), 0)

  const actions = (
    <div className="flex gap-2">
      <button
        onClick={() => setMostrarForm(true)}
        className="flex items-center gap-1.5 text-xs font-semibold bg-verde-act text-white px-3 py-1.5 rounded-lg hover:bg-verde transition-colors">
        <Plus size={13}/> Nueva venta
      </button>
    </div>
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Ventas" actions={actions}/>

      {mostrarForm && establecimiento && (
        <FormNuevaVenta
          establecimientoId={establecimiento.id}
          onClose={() => setMostrarForm(false)}
          onSuccess={handleSuccess}
        />
      )}

      <div className="flex-1 overflow-y-auto p-4">

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-2.5 mb-4">
          {[
            { l:'Vendido acumulado',    v: formatUSD(totalAcumulado),          s:'ventas liquidadas',              c:'border-t-verde-ac' },
            { l:'Por cobrar',           v: formatUSD(totalPendiente),           s: pendientes.length + ' ventas pendientes', c:'border-t-ambar' },
            { l:'Cabezas vendidas',     v: cabezasVendidas.toString(),          s:'en lo que va de la campania',    c:'border-t-azul' },
            { l:'Granos vendidos',      v: tnVendidas.toLocaleString() + ' tn', s:'todas las cosechas',             c:'border-t-azul' },
          ].map(({ l, v, s, c }) => (
            <div key={l} className={"bg-white border border-borde rounded-xl p-3 border-t-2 " + c}>
              <div className="text-[10px] text-gris mb-1 uppercase tracking-wide font-medium">{l}</div>
              <div className="text-xl font-semibold text-carbon">{v}</div>
              <div className="text-[10px] text-gris">{s}</div>
            </div>
          ))}
        </div>

        {/* Grafico + Detalle */}
        <div className={"grid gap-3 mb-4 " + (seleccionada ? 'grid-cols-[1fr_320px]' : 'grid-cols-1')}>
          <GraficoMensual ventas={ventas}/>
          {seleccionada && <PanelDetalleVenta venta={seleccionada} onClose={() => setSeleccionada(null)}/>}
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <div className="flex items-center gap-2 bg-white border border-borde rounded-lg px-3 py-1.5 flex-1 max-w-xs">
            <Search size={13} className="text-gris flex-shrink-0"/>
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar cliente, numero, producto..."
              className="text-xs outline-none bg-transparent flex-1 text-carbon placeholder:text-gris"/>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {(['Todos', 'Hacienda', 'Granos', 'Servicios'] as const).map(t => (
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
          <div className="flex gap-1.5 flex-wrap">
            {(['Todos', 'Liquidada', 'Pendiente', 'Confirmada'] as const).map(e => (
              <button key={e}
                onClick={() => setEstadoFiltro(e)}
                className={"text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium " +
                  (estadoFiltro === e
                    ? 'bg-ambar text-white border-ambar'
                    : 'bg-white border-borde text-carbon hover:bg-tierra')}>
                {e}
              </button>
            ))}
          </div>
          <span className="ml-auto text-xs text-gris bg-tierra border border-borde px-3 py-1.5 rounded-lg">
            <strong className="text-carbon">{filtradas.length}</strong> ventas
          </span>
        </div>

        {/* Tabla */}
        <div className="bg-white border border-borde rounded-xl overflow-hidden">
          {loadingVentas ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-gris">Cargando ventas...</p>
            </div>
          ) : (
            <>
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-tierra border-b border-borde">
                    {['Comprobante','Fecha','Tipo','Cliente','Detalle','Total','Pago','Estado'].map(h => (
                      <th key={h} className="text-left px-3 py-2 font-medium text-gris">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-borde">
                  {filtradas.map(venta => (
                    <tr key={venta.id}
                      onClick={() => setSeleccionada(seleccionada?.id === venta.id ? null : venta)}
                      className={"cursor-pointer transition-colors hover:bg-tierra/50 " +
                        (seleccionada?.id === venta.id ? 'bg-verde-s' : '')}>
                      <td className="px-3 py-2">
                        <span className="font-mono text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                          {venta.numero}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gris">{formatDate(venta.fecha)}</td>
                      <td className="px-3 py-2">
                        <span className="flex items-center gap-1.5 text-carbon">
                          {getTipoIcon(venta.tipo)}
                          <span className={getTipoChip(venta.tipo)}>{venta.tipo}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2 text-carbon font-medium">{venta.cliente}</td>
                      <td className="px-3 py-2 text-gris">
                        {venta.tipo === 'Hacienda' && (venta.cabezas + ' ' + (venta.categoria?.toLowerCase() || ''))}
                        {venta.tipo === 'Granos' && (venta.toneladas + ' tn ' + venta.producto)}
                        {venta.tipo === 'Servicios' && ((venta.observaciones?.substring(0, 35) ?? '') + (venta.observaciones && venta.observaciones.length > 35 ? '...' : ''))}
                      </td>
                      <td className="px-3 py-2 font-semibold text-carbon">{formatUSD(venta.total)}</td>
                      <td className="px-3 py-2 text-gris">{venta.metodo_pago}</td>
                      <td className="px-3 py-2">
                        <span className={getEstadoChip(venta.estado)}>{venta.estado}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {ventas.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Receipt size={32} className="text-borde mb-3"/>
                  <p className="text-sm font-medium text-carbon mb-1">Todavía no hay ventas registradas</p>
                  <p className="text-xs text-gris">Registrá tu primera venta con el botón "Nueva venta"</p>
                </div>
              )}
              {ventas.length > 0 && filtradas.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Receipt size={32} className="text-borde mb-3"/>
                  <p className="text-sm font-medium text-carbon mb-1">Sin resultados</p>
                  <p className="text-xs text-gris">Cambiá los filtros para ver otras ventas</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
