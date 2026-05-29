'use client'
import { useState } from 'react'
import { Search, Plus, ShoppingCart, X, Calendar, Truck, FileText, Package, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import Topbar from '@/components/Topbar'

// ── Tipos ─────────────────────────────────────────────────────────────────────
type EstadoOC = 'Borrador' | 'Enviada' | 'Confirmada' | 'Recibida' | 'Pagada' | 'Cancelada'
type CategoriaCompra = 'Agroquimico' | 'Semilla' | 'Fertilizante' | 'Combustible' | 'Veterinario' | 'Servicios' | 'Repuestos' | 'Otro'

type ItemCompra = {
  descripcion: string
  cantidad: number
  unidad: string
  precio_unitario: number
}

type Compra = {
  id: string
  numero: string
  fecha: string
  fecha_entrega?: string
  proveedor: string
  categoria: CategoriaCompra
  estado: EstadoOC
  items: ItemCompra[]
  subtotal: number
  iva: number
  total: number
  moneda: 'USD' | 'ARS'
  metodo_pago: 'Transferencia' | 'Cheque' | 'Cuenta corriente' | 'Tarjeta' | 'Forward'
  fecha_pago?: string
  numero_factura?: string
  destino_deposito?: string
  observaciones?: string
}

// ── Datos de ejemplo ──────────────────────────────────────────────────────────
const COMPRAS: Compra[] = [
  {
    id:'1', numero:'OC-2026-0058', fecha:'2026-05-22', fecha_entrega:'2026-05-28',
    proveedor:'Agroquimicos Sur S.R.L.', categoria:'Agroquimico', estado:'Confirmada',
    items:[
      { descripcion:'Glifosato 48%', cantidad:200, unidad:'litros', precio_unitario:4.2 },
      { descripcion:'Atrazina 50%',  cantidad:80,  unidad:'litros', precio_unitario:7.4 },
    ],
    subtotal:1432, iva:300.72, total:1732.72, moneda:'USD',
    metodo_pago:'Transferencia', destino_deposito:'Deposito principal',
  },
  {
    id:'2', numero:'OC-2026-0057', fecha:'2026-05-20',
    proveedor:'Dekalb Semillas (Bayer)', categoria:'Semilla', estado:'Recibida',
    items:[
      { descripcion:'Semilla Maiz DK7500', cantidad:450, unidad:'kg', precio_unitario:8.5 },
    ],
    subtotal:3825, iva:803.25, total:4628.25, moneda:'USD',
    metodo_pago:'Cuenta corriente', destino_deposito:'Silo 1',
    numero_factura:'A-0001-00045892',
  },
  {
    id:'3', numero:'OC-2026-0056', fecha:'2026-05-18', fecha_entrega:'2026-05-25',
    proveedor:'YPF Agro', categoria:'Fertilizante', estado:'Pagada',
    items:[
      { descripcion:'Urea granulada', cantidad:3000, unidad:'kg', precio_unitario:0.85 },
    ],
    subtotal:2550, iva:535.5, total:3085.5, moneda:'USD',
    metodo_pago:'Transferencia', fecha_pago:'2026-05-19',
    destino_deposito:'Silo 2', numero_factura:'A-0042-00128456',
  },
  {
    id:'4', numero:'OC-2026-0055', fecha:'2026-05-15',
    proveedor:'YPF', categoria:'Combustible', estado:'Pagada',
    items:[
      { descripcion:'Gas oil grado 2', cantidad:2500, unidad:'litros', precio_unitario:1.05 },
    ],
    subtotal:2625, iva:551.25, total:3176.25, moneda:'USD',
    metodo_pago:'Transferencia', fecha_pago:'2026-05-15',
    destino_deposito:'Tanque campo',
  },
  {
    id:'5', numero:'OC-2026-0054', fecha:'2026-05-10',
    proveedor:'Don Mario Semillas', categoria:'Semilla', estado:'Enviada',
    fecha_entrega:'2026-05-30',
    items:[
      { descripcion:'Semilla Soja DM4214', cantidad:1500, unidad:'kg', precio_unitario:6.2 },
    ],
    subtotal:9300, iva:1953, total:11253, moneda:'USD',
    metodo_pago:'Forward', destino_deposito:'Silo 1',
    observaciones:'Pago con grano. Entrega para siembra Nov 26',
  },
  {
    id:'6', numero:'OC-2026-0053', fecha:'2026-05-08',
    proveedor:'Coopers / Schering Plough', categoria:'Veterinario', estado:'Recibida',
    items:[
      { descripcion:'Ivermectina 1%',           cantidad:20, unidad:'litros', precio_unitario:28.0 },
      { descripcion:'Vacuna Aftosa bivalente',  cantidad:500,unidad:'dosis',  precio_unitario:1.8 },
    ],
    subtotal:1460, iva:306.6, total:1766.6, moneda:'USD',
    metodo_pago:'Tarjeta', destino_deposito:'Deposito vet.',
    numero_factura:'B-0008-00012547',
  },
  {
    id:'7', numero:'OC-2026-0052', fecha:'2026-05-05',
    proveedor:'Concesionario John Deere', categoria:'Repuestos', estado:'Pagada',
    items:[
      { descripcion:'Filtro aceite motor 6130J',      cantidad:2, unidad:'unidad', precio_unitario:45 },
      { descripcion:'Filtro combustible',              cantidad:3, unidad:'unidad', precio_unitario:32 },
      { descripcion:'Aceite hidraulico 20L',           cantidad:4, unidad:'bidon',  precio_unitario:85 },
    ],
    subtotal:526, iva:110.46, total:636.46, moneda:'USD',
    metodo_pago:'Cheque', fecha_pago:'2026-05-08',
    numero_factura:'A-0012-00034521',
  },
  {
    id:'8', numero:'OC-2026-0051', fecha:'2026-04-30',
    proveedor:'Cosechadora El Pampero', categoria:'Servicios', estado:'Pagada',
    items:[
      { descripcion:'Servicio cosecha Maiz lote El Sauce', cantidad:120, unidad:'ha', precio_unitario:170 },
    ],
    subtotal:20400, iva:4284, total:24684, moneda:'USD',
    metodo_pago:'Transferencia', fecha_pago:'2026-05-02',
    observaciones:'Cosecha 120 ha a USD 170/ha',
  },
  {
    id:'9', numero:'OC-2026-0050', fecha:'2026-05-24',
    proveedor:'Agroquimicos Sur S.R.L.', categoria:'Agroquimico', estado:'Borrador',
    items:[
      { descripcion:'Herbicida 2,4-D Amina', cantidad:100, unidad:'litros', precio_unitario:5.8 },
    ],
    subtotal:580, iva:121.8, total:701.8, moneda:'USD',
    metodo_pago:'Transferencia',
    observaciones:'Pendiente de aprobacion',
  },
]

// ── Helpers ────────────────────────────────────────────────────────────────────
function getEstadoChip(e: EstadoOC) {
  const map: Record<EstadoOC, string> = {
    'Borrador':   'chip chip-gray',
    'Enviada':    'chip chip-blue',
    'Confirmada': 'chip chip-amber',
    'Recibida':   'chip chip-purple',
    'Pagada':     'chip chip-green',
    'Cancelada':  'chip chip-red',
  }
  return map[e]
}

function getEstadoIcon(e: EstadoOC) {
  if (e === 'Pagada')     return <CheckCircle2 size={12}/>
  if (e === 'Recibida')   return <Package size={12}/>
  if (e === 'Confirmada') return <Truck size={12}/>
  if (e === 'Enviada')    return <FileText size={12}/>
  if (e === 'Cancelada')  return <X size={12}/>
  return <Clock size={12}/>
}

function getCategoriaChip(c: CategoriaCompra) {
  const map: Record<CategoriaCompra, string> = {
    'Agroquimico':  'chip chip-amber',
    'Semilla':      'chip chip-green',
    'Fertilizante': 'chip chip-blue',
    'Combustible':  'chip chip-gray',
    'Veterinario':  'chip chip-purple',
    'Servicios':    'chip chip-blue',
    'Repuestos':    'chip chip-gray',
    'Otro':         'chip chip-gray',
  }
  return map[c]
}

function formatDate(d?: string) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function formatUSD(n: number) {
  return 'USD ' + n.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

// ── Panel detalle ──────────────────────────────────────────────────────────────
function PanelDetalleCompra({ compra, onClose }: { compra: Compra, onClose: () => void }) {
  return (
    <div className="bg-white border border-borde rounded-xl overflow-hidden">
      <div className="bg-verde px-4 py-3 flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">{compra.numero}</p>
          <p className="text-xs text-white/60 mt-0.5">{compra.proveedor}</p>
          <div className="flex gap-1.5 mt-1.5 flex-wrap">
            <span className={getCategoriaChip(compra.categoria)}>{compra.categoria}</span>
            <span className={getEstadoChip(compra.estado)}>{compra.estado}</span>
          </div>
        </div>
        <button onClick={onClose} className="text-white/50 hover:text-white"><X size={14}/></button>
      </div>

      <div className="p-4 divide-y divide-borde">
        {/* Total destacado */}
        <div className="pb-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-2">Total de la compra</p>
          <p className="text-3xl font-semibold text-rojo">{formatUSD(compra.total)}</p>
          <p className="text-[11px] text-gris mt-1">IVA incluido</p>
        </div>

        {/* Items */}
        <div className="py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-3">
            Items ({compra.items.length})
          </p>
          <div className="space-y-2">
            {compra.items.map((item, i) => (
              <div key={i} className="bg-tierra rounded-lg p-2.5">
                <p className="text-xs font-semibold text-carbon mb-1">{item.descripcion}</p>
                <div className="flex items-center justify-between text-[11px] text-gris">
                  <span>{item.cantidad.toLocaleString()} {item.unidad} × USD {item.precio_unitario}</span>
                  <span className="font-semibold text-carbon">
                    USD {(item.cantidad * item.precio_unitario).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desglose */}
        <div className="py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-2">Desglose</p>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gris">Subtotal</span>
              <span className="font-medium text-carbon">{formatUSD(compra.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gris">IVA 21%</span>
              <span className="font-medium text-carbon">{formatUSD(compra.iva)}</span>
            </div>
            <div className="border-t border-borde pt-1.5 flex justify-between">
              <span className="text-xs font-semibold text-carbon">Total</span>
              <span className="text-sm font-bold text-rojo">{formatUSD(compra.total)}</span>
            </div>
          </div>
        </div>

        {/* Fechas y pago */}
        <div className="py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-2">Pago y entrega</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-tierra rounded-lg p-2">
              <p className="text-[10px] text-gris mb-0.5">Fecha OC</p>
              <p className="text-xs font-semibold text-carbon">{formatDate(compra.fecha)}</p>
            </div>
            <div className="bg-tierra rounded-lg p-2">
              <p className="text-[10px] text-gris mb-0.5">Entrega</p>
              <p className="text-xs font-semibold text-carbon">{formatDate(compra.fecha_entrega)}</p>
            </div>
            <div className="bg-tierra rounded-lg p-2">
              <p className="text-[10px] text-gris mb-0.5">Método pago</p>
              <p className="text-xs font-semibold text-carbon">{compra.metodo_pago}</p>
            </div>
            <div className="bg-tierra rounded-lg p-2">
              <p className="text-[10px] text-gris mb-0.5">Fecha pago</p>
              <p className="text-xs font-semibold text-carbon">{formatDate(compra.fecha_pago)}</p>
            </div>
          </div>
          {compra.destino_deposito && (
            <div className="mt-2 bg-azul-s rounded-lg p-2">
              <p className="text-[10px] text-azul mb-0.5">Destino</p>
              <p className="text-xs font-semibold text-carbon">{compra.destino_deposito}</p>
            </div>
          )}
          {compra.numero_factura && (
            <div className="mt-2 bg-verde-s rounded-lg p-2">
              <p className="text-[10px] text-verde mb-0.5">Factura</p>
              <p className="text-xs font-mono font-semibold text-carbon">{compra.numero_factura}</p>
            </div>
          )}
        </div>

        {/* Observaciones */}
        {compra.observaciones && (
          <div className="py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-2">Observaciones</p>
            <p className="text-xs text-carbon bg-tierra rounded-lg p-2">{compra.observaciones}</p>
          </div>
        )}

        {/* Acciones */}
        <div className="pt-4 flex flex-col gap-2">
          {compra.estado === 'Borrador' && (
            <button className="w-full text-xs font-semibold bg-verde-act text-white py-2 rounded-lg hover:bg-verde transition-colors">
              Enviar al proveedor
            </button>
          )}
          {compra.estado === 'Confirmada' && (
            <button className="w-full text-xs font-semibold bg-verde-act text-white py-2 rounded-lg hover:bg-verde transition-colors">
              Marcar como recibida
            </button>
          )}
          {compra.estado === 'Recibida' && (
            <button className="w-full text-xs font-semibold bg-verde-act text-white py-2 rounded-lg hover:bg-verde transition-colors">
              Registrar pago
            </button>
          )}
          <button className="w-full text-xs font-medium border border-borde text-carbon py-2 rounded-lg hover:bg-tierra transition-colors">
            Descargar comprobante
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Pagina principal ───────────────────────────────────────────────────────────
export default function Compras() {
  const [busqueda, setBusqueda] = useState('')
  const [catFiltro, setCatFiltro] = useState<string>('Todos')
  const [estadoFiltro, setEstadoFiltro] = useState<string>('Todos')
  const [seleccionada, setSeleccionada] = useState<Compra | null>(null)

  const filtradas = COMPRAS.filter(c => {
    const matchBusqueda = c.numero.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.proveedor.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.items.some(i => i.descripcion.toLowerCase().includes(busqueda.toLowerCase()))
    const matchCat = catFiltro === 'Todos' || c.categoria === catFiltro
    const matchEstado = estadoFiltro === 'Todos' || c.estado === estadoFiltro
    return matchBusqueda && matchCat && matchEstado
  })

  // KPIs
  const totalAcumulado = COMPRAS.filter(c => c.estado !== 'Cancelada' && c.estado !== 'Borrador')
    .reduce((acc, c) => acc + c.total, 0)
  const porPagar = COMPRAS.filter(c => c.estado === 'Recibida' || c.estado === 'Confirmada' || c.estado === 'Enviada')
    .reduce((acc, c) => acc + c.total, 0)
  const ordenesActivas = COMPRAS.filter(c => c.estado === 'Enviada' || c.estado === 'Confirmada').length
  const proveedoresActivos = new Set(COMPRAS.filter(c => c.estado !== 'Cancelada').map(c => c.proveedor)).size

  const actions = (
    <div className="flex gap-2">
      <button className="flex items-center gap-1.5 text-xs font-semibold bg-verde-act text-white px-3 py-1.5 rounded-lg hover:bg-verde transition-colors">
        <Plus size={13}/> Nueva orden de compra
      </button>
    </div>
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Compras" actions={actions}/>
      <div className="flex-1 overflow-y-auto p-4">

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-2.5 mb-4">
          {[
            { l:'Comprado acumulado',  v: formatUSD(totalAcumulado),    s:'todas las ordenes activas',    c:'border-t-rojo' },
            { l:'Por pagar',           v: formatUSD(porPagar),           s:'pendientes de pago',           c: porPagar > 0 ? 'border-t-ambar' : 'border-t-verde-ac' },
            { l:'Ordenes activas',     v: ordenesActivas.toString(),    s:'en proceso o por recibir',    c:'border-t-azul' },
            { l:'Proveedores',         v: proveedoresActivos.toString(), s:'distintos en historial',      c:'border-t-verde-ac' },
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
              placeholder="Buscar OC, proveedor, producto..."
              className="text-xs outline-none bg-transparent flex-1 text-carbon placeholder:text-gris"/>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {(['Todos', 'Agroquimico', 'Semilla', 'Fertilizante', 'Combustible', 'Veterinario', 'Servicios'] as const).map(c => (
              <button key={c}
                onClick={() => setCatFiltro(c)}
                className={"text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium " +
                  (catFiltro === c
                    ? 'bg-verde text-white border-verde'
                    : 'bg-white border-borde text-carbon hover:bg-tierra')}>
                {c}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {(['Todos', 'Pagada', 'Recibida', 'Confirmada', 'Enviada', 'Borrador'] as const).map(e => (
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
            <strong className="text-carbon">{filtradas.length}</strong> ordenes
          </span>
        </div>

        {/* Tabla + Detalle */}
        <div className={"grid gap-3 " + (seleccionada ? 'grid-cols-[1fr_320px]' : 'grid-cols-1')}>

          {/* Tabla */}
          <div className="bg-white border border-borde rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-tierra border-b border-borde">
                  {['OC','Fecha','Proveedor','Categoria','Items','Total','Entrega','Estado'].map(h => (
                    <th key={h} className="text-left px-3 py-2 font-medium text-gris">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-borde">
                {filtradas.map(compra => (
                  <tr key={compra.id}
                    onClick={() => setSeleccionada(seleccionada?.id === compra.id ? null : compra)}
                    className={"cursor-pointer transition-colors hover:bg-tierra/50 " +
                      (seleccionada?.id === compra.id ? 'bg-verde-s' : '')}>
                    <td className="px-3 py-2">
                      <span className="font-mono text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                        {compra.numero}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gris">{formatDate(compra.fecha)}</td>
                    <td className="px-3 py-2 text-carbon font-medium">{compra.proveedor}</td>
                    <td className="px-3 py-2">
                      <span className={getCategoriaChip(compra.categoria)}>{compra.categoria}</span>
                    </td>
                    <td className="px-3 py-2 text-gris">
                      {compra.items.length} {compra.items.length === 1 ? 'item' : 'items'}
                    </td>
                    <td className="px-3 py-2 font-semibold text-carbon whitespace-nowrap">
                      {formatUSD(compra.total)}
                    </td>
                    <td className="px-3 py-2 text-gris">{formatDate(compra.fecha_entrega)}</td>
                    <td className="px-3 py-2">
                      <span className={getEstadoChip(compra.estado) + " flex items-center gap-1 w-fit"}>
                        {getEstadoIcon(compra.estado)} {compra.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtradas.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ShoppingCart size={32} className="text-borde mb-3"/>
                <p className="text-sm font-medium text-carbon mb-1">No hay ordenes de compra</p>
                <p className="text-xs text-gris">Cambia los filtros o crea una nueva orden</p>
              </div>
            )}
          </div>

          {/* Panel detalle */}
          {seleccionada && (
            <PanelDetalleCompra compra={seleccionada} onClose={() => setSeleccionada(null)}/>
          )}
        </div>
      </div>
    </div>
  )
}
