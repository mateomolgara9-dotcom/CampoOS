'use client'
import { useState } from 'react'
import { Search, Plus, Receipt, TrendingUp, Calendar, X, FileText, Truck, Wheat, DollarSign } from 'lucide-react'
import Topbar from '@/components/Topbar'

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

// ── Datos de ejemplo ──────────────────────────────────────────────────────────
const VENTAS: Venta[] = [
  {
    id:'1', numero:'V-2026-0042', fecha:'2026-05-18', tipo:'Hacienda',
    cliente:'Frigorifico Rioplatense S.A.', estado:'Liquidada',
    categoria:'Novillos terminados', cabezas:120, peso_promedio:445, peso_total:53400,
    precio_kg:2.85, total:152190, moneda:'USD', metodo_pago:'Transferencia',
    fecha_pago:'2026-05-22', comisiones:4565, flete:2800,
    destino:'Frigorifico Pilar, Buenos Aires',
  },
  {
    id:'2', numero:'V-2026-0041', fecha:'2026-05-15', tipo:'Granos',
    cliente:'Acopio La Reina S.R.L.', estado:'Liquidada',
    producto:'Maiz', toneladas:380, precio_tonelada:185, lote_origen:'El Sauce',
    total:70300, moneda:'USD', metodo_pago:'Transferencia',
    fecha_pago:'2026-05-20', comisiones:2110, flete:3800,
    destino:'Acopio Villa Maria',
  },
  {
    id:'3', numero:'V-2026-0040', fecha:'2026-05-10', tipo:'Hacienda',
    cliente:'Carniceria El Tropezon', estado:'Liquidada',
    categoria:'Vacas de descarte', cabezas:18, peso_promedio:480, peso_total:8640,
    precio_kg:1.95, total:16848, moneda:'USD', metodo_pago:'Cheque',
    fecha_pago:'2026-05-15', flete:450,
    destino:'Cordoba Capital',
  },
  {
    id:'4', numero:'V-2026-0039', fecha:'2026-05-05', tipo:'Granos',
    cliente:'Cargill Argentina S.A.', estado:'Confirmada',
    producto:'Soja', toneladas:520, precio_tonelada:340, lote_origen:'La Lomada',
    total:176800, moneda:'USD', metodo_pago:'Forward',
    fecha_pago:'2026-06-15', comisiones:5304, flete:4200,
    destino:'Puerto Rosario',
  },
  {
    id:'5', numero:'V-2026-0038', fecha:'2026-04-28', tipo:'Hacienda',
    cliente:'Frigorifico Quickfood', estado:'Liquidada',
    categoria:'Terneros invernada', cabezas:85, peso_promedio:215, peso_total:18275,
    precio_kg:3.20, total:58480, moneda:'USD', metodo_pago:'Transferencia',
    fecha_pago:'2026-05-02', comisiones:1755, flete:1900,
    destino:'San Jorge, Santa Fe',
  },
  {
    id:'6', numero:'V-2026-0037', fecha:'2026-04-22', tipo:'Granos',
    cliente:'ADM Argentina', estado:'Liquidada',
    producto:'Trigo', toneladas:588, precio_tonelada:215, lote_origen:'Tres Cruces',
    total:126420, moneda:'USD', metodo_pago:'Transferencia',
    fecha_pago:'2026-04-28', comisiones:3793, flete:5200,
    destino:'Puerto Bahia Blanca',
  },
  {
    id:'7', numero:'V-2026-0036', fecha:'2026-05-25', tipo:'Hacienda',
    cliente:'Mercado de Liniers', estado:'Pendiente',
    categoria:'Novillos terminados', cabezas:64, peso_promedio:432, peso_total:27648,
    precio_kg:2.92, total:80733, moneda:'USD', metodo_pago:'Transferencia',
    destino:'Mercado de Liniers, CABA',
  },
  {
    id:'8', numero:'V-2026-0035', fecha:'2026-05-20', tipo:'Servicios',
    cliente:'Vecino — Estancia La Maria', estado:'Liquidada',
    total:8500, moneda:'USD', metodo_pago:'Transferencia',
    fecha_pago:'2026-05-22',
    observaciones:'Servicio de cosecha — 50 ha de maiz a USD 170/ha',
  },
]

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

// ── Grafico de ventas mensuales (SVG) ─────────────────────────────────────────
function GraficoMensual({ ventas }: { ventas: Venta[] }) {
  // Agrupar por mes (últimos 6 meses)
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

        {/* Liquidación */}
        <div className="py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-2">Liquidacion</p>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gris">Subtotal bruto</span>
              <span className="font-medium text-carbon">{formatUSD(subtotal)}</span>
            </div>
            {venta.comisiones && (
              <div className="flex justify-between">
                <span className="text-gris">Comisiones</span>
                <span className="font-medium text-rojo">−{formatUSD(venta.comisiones)}</span>
              </div>
            )}
            {venta.flete && (
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

        {/* Acciones */}
        <div className="pt-4 flex flex-col gap-2">
          <button className="w-full text-xs font-semibold bg-verde-act text-white py-2 rounded-lg hover:bg-verde transition-colors">
            Ver liquidacion completa
          </button>
          <button className="w-full text-xs font-medium border border-borde text-carbon py-2 rounded-lg hover:bg-tierra transition-colors">
            Descargar comprobante
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Pagina principal ───────────────────────────────────────────────────────────
export default function Ventas() {
  const [busqueda, setBusqueda] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState<string>('Todos')
  const [estadoFiltro, setEstadoFiltro] = useState<string>('Todos')
  const [seleccionada, setSeleccionada] = useState<Venta | null>(null)

  const filtradas = VENTAS.filter(v => {
    const matchBusqueda = v.numero.toLowerCase().includes(busqueda.toLowerCase()) ||
      v.cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
      (v.producto || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (v.categoria || '').toLowerCase().includes(busqueda.toLowerCase())
    const matchTipo = tipoFiltro === 'Todos' || v.tipo === tipoFiltro
    const matchEstado = estadoFiltro === 'Todos' || v.estado === estadoFiltro
    return matchBusqueda && matchTipo && matchEstado
  })

  // KPIs
  const ventasLiquidadas = VENTAS.filter(v => v.estado === 'Liquidada')
  const totalAcumulado = ventasLiquidadas.reduce((acc, v) => acc + v.total, 0)
  const pendientes = VENTAS.filter(v => v.estado === 'Pendiente' || v.estado === 'Confirmada')
  const totalPendiente = pendientes.reduce((acc, v) => acc + v.total, 0)
  const cabezasVendidas = ventasLiquidadas.filter(v => v.tipo === 'Hacienda').reduce((acc, v) => acc + (v.cabezas || 0), 0)
  const tnVendidas = ventasLiquidadas.filter(v => v.tipo === 'Granos').reduce((acc, v) => acc + (v.toneladas || 0), 0)

  const actions = (
    <div className="flex gap-2">
      <button className="flex items-center gap-1.5 text-xs font-semibold bg-verde-act text-white px-3 py-1.5 rounded-lg hover:bg-verde transition-colors">
        <Plus size={13}/> Nueva venta
      </button>
    </div>
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Ventas" actions={actions}/>
      <div className="flex-1 overflow-y-auto p-4">

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-2.5 mb-4">
          {[
            { l:'Vendido acumulado',    v: formatUSD(totalAcumulado),     s:'ventas liquidadas',         c:'border-t-verde-ac' },
            { l:'Por cobrar',           v: formatUSD(totalPendiente),     s: pendientes.length + ' ventas pendientes', c:'border-t-ambar' },
            { l:'Cabezas vendidas',     v: cabezasVendidas.toString(),    s:'en lo que va de la campania', c:'border-t-azul' },
            { l:'Granos vendidos',      v: tnVendidas.toLocaleString() + ' tn', s:'todas las cosechas',  c:'border-t-azul' },
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
          <GraficoMensual ventas={VENTAS}/>
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
                    {venta.tipo === 'Servicios' && (venta.observaciones?.substring(0, 35) + '...')}
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
          {filtradas.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Receipt size={32} className="text-borde mb-3"/>
              <p className="text-sm font-medium text-carbon mb-1">No hay ventas</p>
              <p className="text-xs text-gris">Cambia los filtros o registra una nueva venta</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
