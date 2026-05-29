'use client'
import { useState } from 'react'
import { Search, Plus, TrendingUp, TrendingDown, X, Calculator, FileText, ArrowUpRight, ArrowDownRight, DollarSign, Filter, ChevronDown } from 'lucide-react'
import Topbar from '@/components/Topbar'

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
  centro_costo?: string  // Lote o rodeo
  campania?: string
  comprobante?: string
  metodo_pago?: string
  conciliado?: boolean
}

// ── Datos de ejemplo ──────────────────────────────────────────────────────────
const MOVIMIENTOS: Movimiento[] = [
  // Ingresos
  { id:'1',  fecha:'2026-05-18', tipo:'Ingreso', categoria:'Venta hacienda', detalle:'Venta 120 novillos terminados',     contraparte:'Frigorifico Rioplatense', monto:152190, moneda:'USD', centro_costo:'Rodeo invernada',  campania:'2025/26', comprobante:'V-2026-0042', metodo_pago:'Transferencia', conciliado:true },
  { id:'2',  fecha:'2026-05-15', tipo:'Ingreso', categoria:'Venta granos',   detalle:'Venta 380 tn maiz DK7500',           contraparte:'Acopio La Reina',         monto:70300,  moneda:'USD', centro_costo:'El Sauce',          campania:'2025/26', comprobante:'V-2026-0041', metodo_pago:'Transferencia', conciliado:true },
  { id:'3',  fecha:'2026-05-10', tipo:'Ingreso', categoria:'Venta hacienda', detalle:'Venta 18 vacas de descarte',         contraparte:'Carniceria El Tropezon',  monto:16848,  moneda:'USD', centro_costo:'Rodeo cria',        campania:'2025/26', comprobante:'V-2026-0040', metodo_pago:'Cheque',        conciliado:true },
  { id:'4',  fecha:'2026-05-05', tipo:'Ingreso', categoria:'Venta granos',   detalle:'Venta 520 tn soja DM4214 (forward)', contraparte:'Cargill Argentina',       monto:176800, moneda:'USD', centro_costo:'La Lomada',         campania:'2025/26', comprobante:'V-2026-0039', metodo_pago:'Forward',       conciliado:false },
  { id:'5',  fecha:'2026-04-28', tipo:'Ingreso', categoria:'Venta hacienda', detalle:'Venta 85 terneros invernada',        contraparte:'Frigorifico Quickfood',   monto:58480,  moneda:'USD', centro_costo:'Rodeo invernada',  campania:'2025/26', comprobante:'V-2026-0038', metodo_pago:'Transferencia', conciliado:true },
  { id:'6',  fecha:'2026-04-22', tipo:'Ingreso', categoria:'Venta granos',   detalle:'Venta 588 tn trigo Klein Liebre',    contraparte:'ADM Argentina',           monto:126420, moneda:'USD', centro_costo:'Tres Cruces',       campania:'2025/26', comprobante:'V-2026-0037', metodo_pago:'Transferencia', conciliado:true },
  { id:'7',  fecha:'2026-05-20', tipo:'Ingreso', categoria:'Servicios',      detalle:'Servicio cosecha vecino 50 ha maiz', contraparte:'Estancia La Maria',       monto:8500,   moneda:'USD',                                                        comprobante:'V-2026-0035', metodo_pago:'Transferencia', conciliado:true },

  // Egresos - Insumos
  { id:'8',  fecha:'2026-05-22', tipo:'Egreso',  categoria:'Insumos',         detalle:'Glifosato 48% + Atrazina 50%',     contraparte:'Agroquimicos Sur',      monto:1732.72,moneda:'USD',                                  campania:'2025/26', comprobante:'OC-2026-0058', metodo_pago:'Transferencia' },
  { id:'9',  fecha:'2026-05-20', tipo:'Egreso',  categoria:'Insumos',         detalle:'Semilla Maiz DK7500 450 kg',        contraparte:'Dekalb Semillas',        monto:4628.25,moneda:'USD', centro_costo:'San Antonio',       campania:'2026/27', comprobante:'OC-2026-0057', metodo_pago:'Cuenta corriente' },
  { id:'10', fecha:'2026-05-18', tipo:'Egreso',  categoria:'Insumos',         detalle:'Urea granulada 3000 kg',            contraparte:'YPF Agro',                monto:3085.5, moneda:'USD', centro_costo:'El Sauce',          campania:'2025/26', comprobante:'OC-2026-0056', metodo_pago:'Transferencia' },
  { id:'11', fecha:'2026-05-10', tipo:'Egreso',  categoria:'Insumos',         detalle:'Semilla Soja DM4214 1500 kg',       contraparte:'Don Mario Semillas',     monto:11253,  moneda:'USD',                                  campania:'2026/27', comprobante:'OC-2026-0054', metodo_pago:'Forward' },

  // Combustible
  { id:'12', fecha:'2026-05-15', tipo:'Egreso',  categoria:'Combustible',     detalle:'Gas oil 2500 L',                    contraparte:'YPF',                     monto:3176.25,moneda:'USD',                                                        comprobante:'OC-2026-0055', metodo_pago:'Transferencia' },

  // Veterinaria
  { id:'13', fecha:'2026-05-08', tipo:'Egreso',  categoria:'Veterinaria',     detalle:'Ivermectina + Vacuna aftosa',        contraparte:'Coopers / Schering',     monto:1766.6, moneda:'USD',                                                        comprobante:'OC-2026-0053', metodo_pago:'Tarjeta' },

  // Maquinaria
  { id:'14', fecha:'2026-05-05', tipo:'Egreso',  categoria:'Maquinaria',     detalle:'Repuestos service JD 6130J',         contraparte:'Concesionario JD',       monto:636.46, moneda:'USD',                                                        comprobante:'OC-2026-0052', metodo_pago:'Cheque' },

  // Servicios contratistas
  { id:'15', fecha:'2026-04-30', tipo:'Egreso',  categoria:'Servicios profesionales', detalle:'Cosecha 120 ha maiz',         contraparte:'Cosechadora El Pampero', monto:24684,  moneda:'USD', centro_costo:'El Sauce',          campania:'2025/26', comprobante:'OC-2026-0051', metodo_pago:'Transferencia' },

  // Salarios
  { id:'16', fecha:'2026-05-05', tipo:'Egreso',  categoria:'Salarios',        detalle:'Salarios personal mes abril',         contraparte:'Personal en blanco',     monto:3850,   moneda:'USD',                                                                                     metodo_pago:'Transferencia' },
  { id:'17', fecha:'2026-05-05', tipo:'Egreso',  categoria:'Salarios',        detalle:'Jornales contratistas abril',         contraparte:'Personal jornalero',     monto:1200,   moneda:'USD',                                                                                     metodo_pago:'Efectivo' },

  // Servicios profesionales
  { id:'18', fecha:'2026-05-15', tipo:'Egreso',  categoria:'Servicios profesionales', detalle:'Asistencia veterinaria mensual', contraparte:'Dr. Martin Acosta',  monto:600,    moneda:'USD',                                                                                     metodo_pago:'Transferencia' },
  { id:'19', fecha:'2026-05-10', tipo:'Egreso',  categoria:'Servicios profesionales', detalle:'Asesoria agronomica',          contraparte:'Ing. Patricia Mendez',   monto:850,    moneda:'USD',                                                                                     metodo_pago:'Transferencia' },

  // Impuestos
  { id:'20', fecha:'2026-05-10', tipo:'Egreso',  categoria:'Impuestos',       detalle:'IIBB Cordoba abril',                  contraparte:'AFIP / Rentas',          monto:2150,   moneda:'USD',                                                                                     metodo_pago:'Transferencia' },
  { id:'21', fecha:'2026-04-20', tipo:'Egreso',  categoria:'Impuestos',       detalle:'Inmobiliario rural',                  contraparte:'Rentas provincia',       monto:1850,   moneda:'USD',                                                                                     metodo_pago:'Transferencia' },

  // Financiero
  { id:'22', fecha:'2026-05-01', tipo:'Egreso',  categoria:'Financiero',      detalle:'Comision banco + mantenimiento',      contraparte:'Banco Galicia',          monto:185,    moneda:'USD',                                                                                     metodo_pago:'Debito automatico' },
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
  // Agrupar movimientos por centro de costo
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
        {/* Barra apilada */}
        <div className="flex h-3 rounded-full overflow-hidden mb-3">
          {items.map((item, i) => (
            <div key={item.cat}
              className={colores[i % colores.length] + " h-3"}
              style={{ width: ((item.monto / total) * 100) + '%' }}
              title={item.cat + ': ' + formatUSD(item.monto)}/>
          ))}
        </div>

        {/* Lista de categorias */}
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

// ── Pagina principal ───────────────────────────────────────────────────────────
export default function Contabilidad() {
  const [busqueda, setBusqueda] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState<string>('Todos')
  const [catFiltro, setCatFiltro] = useState<string>('Todos')
  const [seleccionado, setSeleccionado] = useState<Movimiento | null>(null)

  const filtrados = MOVIMIENTOS.filter(m => {
    const matchBusqueda = m.detalle.toLowerCase().includes(busqueda.toLowerCase()) ||
      m.contraparte.toLowerCase().includes(busqueda.toLowerCase()) ||
      (m.comprobante || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (m.centro_costo || '').toLowerCase().includes(busqueda.toLowerCase())
    const matchTipo = tipoFiltro === 'Todos' || m.tipo === tipoFiltro
    const matchCat = catFiltro === 'Todos' || m.categoria === catFiltro
    return matchBusqueda && matchTipo && matchCat
  })

  // KPIs
  const ingresos = MOVIMIENTOS.filter(m => m.tipo === 'Ingreso').reduce((acc, m) => acc + m.monto, 0)
  const egresos = MOVIMIENTOS.filter(m => m.tipo === 'Egreso').reduce((acc, m) => acc + m.monto, 0)
  const resultado = ingresos - egresos
  const margen = ingresos > 0 ? (resultado / ingresos) * 100 : 0

  const actions = (
    <div className="flex gap-2">
      <button className="flex items-center gap-1.5 text-xs font-medium border border-borde bg-white text-carbon px-3 py-1.5 rounded-lg hover:bg-tierra transition-colors">
        <FileText size={13}/> Balance
      </button>
      <button className="flex items-center gap-1.5 text-xs font-semibold bg-verde-act text-white px-3 py-1.5 rounded-lg hover:bg-verde transition-colors">
        <Plus size={13}/> Nuevo movimiento
      </button>
    </div>
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Contabilidad" actions={actions}/>
      <div className="flex-1 overflow-y-auto p-4">

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-2.5 mb-4">
          <div className="bg-white border border-borde rounded-xl p-3 border-t-2 border-t-verde-ac">
            <div className="text-[10px] text-gris mb-1 uppercase tracking-wide font-medium flex items-center gap-1">
              <ArrowUpRight size={12} className="text-verde"/> Ingresos totales
            </div>
            <div className="text-xl font-semibold text-verde">{formatUSD(ingresos)}</div>
            <div className="text-[10px] text-gris">campaña 2025/26</div>
          </div>
          <div className="bg-white border border-borde rounded-xl p-3 border-t-2 border-t-rojo">
            <div className="text-[10px] text-gris mb-1 uppercase tracking-wide font-medium flex items-center gap-1">
              <ArrowDownRight size={12} className="text-rojo"/> Egresos totales
            </div>
            <div className="text-xl font-semibold text-rojo">{formatUSD(egresos)}</div>
            <div className="text-[10px] text-gris">campaña 2025/26</div>
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
          <GraficoResultados movimientos={MOVIMIENTOS}/>
          <DistribucionEgresos movimientos={MOVIMIENTOS}/>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <ResultadoPorCentroCosto movimientos={MOVIMIENTOS}/>
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
                <span className="text-sm font-semibold text-azul">{(ingresos / egresos).toFixed(2)}x</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-ambar-s rounded-lg">
                <span className="text-xs text-carbon">Movimientos sin conciliar</span>
                <span className="text-sm font-semibold" style={{color:'#854F0B'}}>
                  {MOVIMIENTOS.filter(m => m.tipo === 'Ingreso' && !m.conciliado).length}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-tierra rounded-lg">
                <span className="text-xs text-carbon">Total movimientos</span>
                <span className="text-sm font-semibold text-carbon">{MOVIMIENTOS.length}</span>
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
                      <td className="px-3 py-2 text-gris">{mov.contraparte}</td>
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
            {filtrados.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calculator size={32} className="text-borde mb-3"/>
                <p className="text-sm font-medium text-carbon mb-1">No hay movimientos</p>
                <p className="text-xs text-gris">Cambia los filtros o registra un nuevo movimiento</p>
              </div>
            )}
          </div>

          {seleccionado && (
            <PanelDetalleMovimiento mov={seleccionado} onClose={() => setSeleccionado(null)}/>
          )}
        </div>
      </div>
    </div>
  )
}
