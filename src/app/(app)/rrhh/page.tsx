'use client'
import { useState } from 'react'
import { Search, Plus, Users, X, Calendar, Phone, Mail, MapPin, FileText, AlertTriangle, DollarSign, Clock, Briefcase, Award } from 'lucide-react'
import Topbar from '@/components/Topbar'

// ── Tipos ─────────────────────────────────────────────────────────────────────
type TipoEmpleado = 'En blanco' | 'Jornalero' | 'Contratista' | 'Eventual'
type Cargo = 'Encargado' | 'Tractorista' | 'Peon general' | 'Veterinario' | 'Mecanico' | 'Ordenador' | 'Capataz' | 'Otro'
type EstadoEmpleado = 'Activo' | 'Licencia' | 'Vacaciones' | 'Inactivo'

type Liquidacion = {
  id: string
  mes: string
  ano: number
  bruto: number
  descuentos: number
  neto: number
  estado: 'Pagada' | 'Pendiente'
}

type Empleado = {
  id: string
  nombre: string
  dni: string
  cuil?: string
  fecha_nacimiento?: string
  fecha_ingreso: string
  cargo: Cargo
  tipo: TipoEmpleado
  estado: EstadoEmpleado
  // Contacto
  telefono?: string
  email?: string
  direccion?: string
  ciudad?: string
  // Trabajo
  sueldo_basico?: number
  jornal_diario?: number
  dias_trabajados_mes?: number
  // Documentos
  obra_social?: string
  art?: string
  art_vencimiento?: string
  // Liquidaciones
  liquidaciones: Liquidacion[]
  observaciones?: string
}

// ── Datos de ejemplo ──────────────────────────────────────────────────────────
const EMPLEADOS: Empleado[] = [
  {
    id:'e1', nombre:'Miguel Ruiz', dni:'27.458.963', cuil:'20-27458963-4',
    fecha_nacimiento:'1979-03-15', fecha_ingreso:'2018-04-10',
    cargo:'Encargado', tipo:'En blanco', estado:'Activo',
    telefono:'+54 351 5847-321', email:'mruiz.encargado@gmail.com',
    direccion:'Casa del campo - Sector vivienda', ciudad:'Villa Maria, Cordoba',
    sueldo_basico:1800, dias_trabajados_mes:30,
    obra_social:'OSPRERA', art:'Provincia ART', art_vencimiento:'2026-11-30',
    liquidaciones:[
      { id:'l1', mes:'Abril',  ano:2026, bruto:1800, descuentos:540, neto:1260, estado:'Pagada' },
      { id:'l2', mes:'Marzo',  ano:2026, bruto:1800, descuentos:540, neto:1260, estado:'Pagada' },
      { id:'l3', mes:'Febrero',ano:2026, bruto:1800, descuentos:540, neto:1260, estado:'Pagada' },
    ],
  },
  {
    id:'e2', nombre:'Carlos Diaz', dni:'32.145.678', cuil:'20-32145678-2',
    fecha_nacimiento:'1985-07-22', fecha_ingreso:'2020-09-15',
    cargo:'Tractorista', tipo:'En blanco', estado:'Activo',
    telefono:'+54 351 5678-432', email:'cdiaz.tractor@gmail.com',
    ciudad:'Villa Nueva, Cordoba',
    sueldo_basico:1200, dias_trabajados_mes:26,
    obra_social:'OSPRERA', art:'Provincia ART', art_vencimiento:'2026-11-30',
    liquidaciones:[
      { id:'l4', mes:'Abril', ano:2026, bruto:1200, descuentos:360, neto:840, estado:'Pagada' },
      { id:'l5', mes:'Marzo', ano:2026, bruto:1200, descuentos:360, neto:840, estado:'Pagada' },
    ],
  },
  {
    id:'e3', nombre:'Juan Garcia', dni:'30.987.654', cuil:'20-30987654-1',
    fecha_nacimiento:'1982-11-05', fecha_ingreso:'2019-06-01',
    cargo:'Peon general', tipo:'En blanco', estado:'Activo',
    telefono:'+54 351 4321-987',
    ciudad:'Villa Maria, Cordoba',
    sueldo_basico:850, dias_trabajados_mes:26,
    obra_social:'OSPRERA', art:'Provincia ART', art_vencimiento:'2026-11-30',
    liquidaciones:[
      { id:'l6', mes:'Abril', ano:2026, bruto:850, descuentos:255, neto:595, estado:'Pagada' },
    ],
  },
  {
    id:'e4', nombre:'Sergio Vivas', dni:'25.789.456',
    fecha_ingreso:'2024-04-01',
    cargo:'Otro', tipo:'Contratista', estado:'Activo',
    telefono:'+54 353 4789-456',
    ciudad:'Villa Nueva, Cordoba',
    liquidaciones:[
      { id:'l7', mes:'Abril', ano:2026, bruto:24684, descuentos:0, neto:24684, estado:'Pagada' },
    ],
    observaciones:'Contratista de cosecha — facturacion por servicios prestados',
  },
  {
    id:'e5', nombre:'Roberto Suarez', dni:'35.214.789',
    fecha_ingreso:'2024-09-15',
    cargo:'Peon general', tipo:'Jornalero', estado:'Activo',
    telefono:'+54 351 6987-321',
    ciudad:'Villa Maria, Cordoba',
    jornal_diario:35, dias_trabajados_mes:18,
    liquidaciones:[
      { id:'l8', mes:'Abril', ano:2026, bruto:630, descuentos:0, neto:630, estado:'Pagada' },
      { id:'l9', mes:'Marzo', ano:2026, bruto:560, descuentos:0, neto:560, estado:'Pagada' },
    ],
    observaciones:'Jornalero — pago semanal en efectivo',
  },
  {
    id:'e6', nombre:'Dr. Martin Acosta', dni:'28.457.896', cuil:'20-28457896-5',
    fecha_ingreso:'2022-01-10',
    cargo:'Veterinario', tipo:'Contratista', estado:'Activo',
    telefono:'+54 351 5847-321', email:'mvet.acosta@gmail.com',
    ciudad:'Villa Maria, Cordoba',
    liquidaciones:[
      { id:'l10', mes:'Abril', ano:2026, bruto:600, descuentos:0, neto:600, estado:'Pagada' },
      { id:'l11', mes:'Marzo', ano:2026, bruto:600, descuentos:0, neto:600, estado:'Pagada' },
    ],
    observaciones:'Asistencia veterinaria mensual — factura B',
  },
  {
    id:'e7', nombre:'Maria Fernandez', dni:'33.987.123', cuil:'27-33987123-4',
    fecha_nacimiento:'1988-05-12', fecha_ingreso:'2023-03-20',
    cargo:'Otro', tipo:'En blanco', estado:'Licencia',
    telefono:'+54 351 4567-890', email:'mfernandez@gmail.com',
    ciudad:'Villa Maria, Cordoba',
    sueldo_basico:900, dias_trabajados_mes:0,
    obra_social:'OSPRERA', art:'Provincia ART', art_vencimiento:'2026-11-30',
    liquidaciones:[],
    observaciones:'Licencia por maternidad hasta agosto 2026',
  },
  {
    id:'e8', nombre:'Andres Romero', dni:'40.789.321',
    fecha_ingreso:'2025-11-01',
    cargo:'Peon general', tipo:'Eventual', estado:'Activo',
    telefono:'+54 351 7894-561',
    jornal_diario:35, dias_trabajados_mes:8,
    liquidaciones:[
      { id:'l12', mes:'Abril', ano:2026, bruto:280, descuentos:0, neto:280, estado:'Pagada' },
    ],
    observaciones:'Eventual para epoca de siembra y cosecha',
  },
]

// ── Helpers ────────────────────────────────────────────────────────────────────
function getTipoChip(t: TipoEmpleado) {
  const map: Record<TipoEmpleado, string> = {
    'En blanco':   'chip chip-green',
    'Jornalero':   'chip chip-amber',
    'Contratista': 'chip chip-blue',
    'Eventual':    'chip chip-gray',
  }
  return map[t]
}

function getEstadoChip(e: EstadoEmpleado) {
  if (e === 'Activo') return 'chip chip-green'
  if (e === 'Licencia') return 'chip chip-purple'
  if (e === 'Vacaciones') return 'chip chip-blue'
  return 'chip chip-gray'
}

function formatDate(d?: string) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function formatUSD(n: number) {
  return 'USD ' + n.toLocaleString(undefined, { maximumFractionDigits: 0 })
}

function diasHasta(d?: string) {
  if (!d) return null
  const hoy = new Date()
  const venc = new Date(d)
  return Math.ceil((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
}

function getAntiguedad(fecha: string) {
  const hoy = new Date()
  const ingreso = new Date(fecha)
  const anios = Math.floor((hoy.getTime() - ingreso.getTime()) / (1000 * 60 * 60 * 24 * 365))
  if (anios === 0) {
    const meses = Math.floor((hoy.getTime() - ingreso.getTime()) / (1000 * 60 * 60 * 24 * 30))
    return meses + (meses === 1 ? ' mes' : ' meses')
  }
  return anios + (anios === 1 ? ' año' : ' años')
}

function getIniciales(nombre: string) {
  return nombre.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

// ── Panel detalle empleado ────────────────────────────────────────────────────
function PanelDetalleEmpleado({ e, onClose }: { e: Empleado, onClose: () => void }) {
  const artDias = diasHasta(e.art_vencimiento)
  const totalLiquidado = e.liquidaciones.reduce((acc, l) => acc + l.neto, 0)

  return (
    <div className="bg-white border border-borde rounded-xl overflow-hidden">
      <div className="bg-verde px-4 py-3 flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-verde-act flex items-center justify-center flex-shrink-0">
          <span className="text-white font-semibold text-sm">{getIniciales(e.nombre)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">{e.nombre}</p>
          <p className="text-[11px] text-white/60 mt-0.5">{e.cargo} · DNI {e.dni}</p>
          <div className="flex gap-1.5 mt-1.5 flex-wrap">
            <span className={getTipoChip(e.tipo)}>{e.tipo}</span>
            <span className={getEstadoChip(e.estado)}>{e.estado}</span>
          </div>
        </div>
        <button onClick={onClose} className="text-white/50 hover:text-white"><X size={14}/></button>
      </div>

      <div className="p-4 divide-y divide-borde">
        {/* Antigüedad y liquidado */}
        <div className="pb-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-2">Datos laborales</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-verde-s rounded-lg p-2">
              <p className="text-[10px] text-verde">Antigüedad</p>
              <p className="text-sm font-semibold text-carbon">{getAntiguedad(e.fecha_ingreso)}</p>
              <p className="text-[10px] text-gris">desde {formatDate(e.fecha_ingreso)}</p>
            </div>
            <div className="bg-tierra rounded-lg p-2">
              <p className="text-[10px] text-gris">Total liquidado</p>
              <p className="text-sm font-semibold text-carbon">{formatUSD(totalLiquidado)}</p>
              <p className="text-[10px] text-gris">historial reciente</p>
            </div>
          </div>
        </div>

        {/* Remuneración */}
        {(e.sueldo_basico || e.jornal_diario) && (
          <div className="py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-2">Remuneración</p>
            {e.sueldo_basico && (
              <div className="bg-verde-s rounded-lg p-2 mb-2">
                <p className="text-[10px] text-verde">Sueldo básico mensual</p>
                <p className="text-lg font-semibold text-verde">{formatUSD(e.sueldo_basico)}</p>
              </div>
            )}
            {e.jornal_diario && (
              <div className="bg-ambar-s rounded-lg p-2 mb-2">
                <p className="text-[10px]" style={{color:'#854F0B'}}>Jornal diario</p>
                <p className="text-lg font-semibold" style={{color:'#854F0B'}}>{formatUSD(e.jornal_diario)}</p>
                {e.dias_trabajados_mes !== undefined && (
                  <p className="text-[10px] text-gris">
                    {e.dias_trabajados_mes} días el mes pasado = {formatUSD(e.dias_trabajados_mes * e.jornal_diario)}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Contacto */}
        <div className="py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-2">Contacto</p>
          <div className="space-y-2">
            {e.telefono && (
              <div className="flex items-start gap-2">
                <Phone size={12} className="text-gris mt-0.5 flex-shrink-0"/>
                <div>
                  <p className="text-[10px] text-gris">Teléfono</p>
                  <p className="text-xs font-medium text-carbon">{e.telefono}</p>
                </div>
              </div>
            )}
            {e.email && (
              <div className="flex items-start gap-2">
                <Mail size={12} className="text-gris mt-0.5 flex-shrink-0"/>
                <div>
                  <p className="text-[10px] text-gris">Email</p>
                  <p className="text-xs font-medium text-carbon break-all">{e.email}</p>
                </div>
              </div>
            )}
            {(e.direccion || e.ciudad) && (
              <div className="flex items-start gap-2">
                <MapPin size={12} className="text-gris mt-0.5 flex-shrink-0"/>
                <div>
                  <p className="text-[10px] text-gris">Domicilio</p>
                  <p className="text-xs font-medium text-carbon">
                    {[e.direccion, e.ciudad].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>
            )}
            {e.cuil && (
              <div className="flex items-start gap-2">
                <FileText size={12} className="text-gris mt-0.5 flex-shrink-0"/>
                <div>
                  <p className="text-[10px] text-gris">CUIL</p>
                  <p className="text-xs font-mono font-medium text-carbon">{e.cuil}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cobertura */}
        {(e.obra_social || e.art) && (
          <div className="py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-2">Cobertura social</p>
            <div className="space-y-2">
              {e.obra_social && (
                <div className="bg-tierra rounded-lg p-2">
                  <p className="text-[10px] text-gris">Obra social</p>
                  <p className="text-xs font-semibold text-carbon">{e.obra_social}</p>
                </div>
              )}
              {e.art && (
                <div className={"rounded-lg p-2 " +
                  (artDias !== null && artDias < 30 ? 'bg-rojo-s' : 'bg-tierra')}>
                  <p className={"text-[10px] " + (artDias !== null && artDias < 30 ? 'text-rojo' : 'text-gris')}>
                    ART
                  </p>
                  <p className="text-xs font-semibold text-carbon">{e.art}</p>
                  <p className={"text-[10px] mt-0.5 " + (artDias !== null && artDias < 30 ? 'text-rojo' : 'text-gris')}>
                    Vence: {formatDate(e.art_vencimiento)}
                    {artDias !== null && artDias < 30 && ' ⚠ Próximo a vencer'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Liquidaciones recientes */}
        {e.liquidaciones.length > 0 && (
          <div className="py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-2">
              Últimas liquidaciones
            </p>
            <div className="space-y-1.5">
              {e.liquidaciones.slice(0, 3).map(l => (
                <div key={l.id} className="bg-tierra rounded-lg p-2 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-carbon">{l.mes} {l.ano}</p>
                    <p className="text-[10px] text-gris">
                      Bruto {formatUSD(l.bruto)} {l.descuentos > 0 ? '· Desc ' + formatUSD(l.descuentos) : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-verde">{formatUSD(l.neto)}</p>
                    <p className="text-[10px] text-gris">{l.estado}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Observaciones */}
        {e.observaciones && (
          <div className="py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-2">Observaciones</p>
            <p className="text-xs text-carbon bg-tierra rounded-lg p-2">{e.observaciones}</p>
          </div>
        )}

        <div className="pt-4 flex flex-col gap-2">
          <button className="w-full text-xs font-semibold bg-verde-act text-white py-2 rounded-lg hover:bg-verde transition-colors">
            Nueva liquidación
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
export default function RRHH() {
  const [busqueda, setBusqueda] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState<string>('Todos')
  const [estadoFiltro, setEstadoFiltro] = useState<string>('Todos')
  const [seleccionado, setSeleccionado] = useState<Empleado | null>(null)

  const filtrados = EMPLEADOS.filter(emp => {
    const matchBusqueda = emp.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      emp.dni.includes(busqueda) ||
      emp.cargo.toLowerCase().includes(busqueda.toLowerCase())
    const matchTipo = tipoFiltro === 'Todos' || emp.tipo === tipoFiltro
    const matchEstado = estadoFiltro === 'Todos' || emp.estado === estadoFiltro
    return matchBusqueda && matchTipo && matchEstado
  })

  // KPIs
  const totalEmpleados = EMPLEADOS.length
  const enBlanco = EMPLEADOS.filter(e => e.tipo === 'En blanco' && e.estado === 'Activo').length
  const jornaleros = EMPLEADOS.filter(e => (e.tipo === 'Jornalero' || e.tipo === 'Eventual') && e.estado === 'Activo').length

  // Total liquidado mes pasado
  const totalMes = EMPLEADOS.reduce((acc, e) => {
    const ultLiq = e.liquidaciones[0]
    return acc + (ultLiq ? ultLiq.neto : 0)
  }, 0)

  // Alertas ART
  const alertasART = EMPLEADOS.filter(e => {
    const d = diasHasta(e.art_vencimiento)
    return d !== null && d < 30
  }).length

  const actions = (
    <div className="flex gap-2">
      <button className="flex items-center gap-1.5 text-xs font-medium border border-borde bg-white text-carbon px-3 py-1.5 rounded-lg hover:bg-tierra transition-colors">
        <FileText size={13}/> Liquidaciones del mes
      </button>
      <button className="flex items-center gap-1.5 text-xs font-semibold bg-verde-act text-white px-3 py-1.5 rounded-lg hover:bg-verde transition-colors">
        <Plus size={13}/> Nuevo empleado
      </button>
    </div>
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Recursos Humanos" actions={actions}/>
      <div className="flex-1 overflow-y-auto p-4">

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-2.5 mb-4">
          <div className="bg-white border border-borde rounded-xl p-3 border-t-2 border-t-verde-ac">
            <div className="text-[10px] text-gris mb-1 uppercase tracking-wide font-medium">Total personal</div>
            <div className="text-xl font-semibold text-carbon">{totalEmpleados}</div>
            <div className="text-[10px] text-gris">{enBlanco} en blanco · {jornaleros} jornaleros</div>
          </div>
          <div className="bg-white border border-borde rounded-xl p-3 border-t-2 border-t-verde-ac">
            <div className="text-[10px] text-gris mb-1 uppercase tracking-wide font-medium">Empleados activos</div>
            <div className="text-xl font-semibold text-verde">
              {EMPLEADOS.filter(e => e.estado === 'Activo').length}
            </div>
            <div className="text-[10px] text-gris">trabajando actualmente</div>
          </div>
          <div className="bg-white border border-borde rounded-xl p-3 border-t-2 border-t-ambar">
            <div className="text-[10px] text-gris mb-1 uppercase tracking-wide font-medium">Liquidado último mes</div>
            <div className="text-xl font-semibold text-carbon">{formatUSD(totalMes)}</div>
            <div className="text-[10px] text-gris">total neto pagado</div>
          </div>
          <div className={"bg-white border border-borde rounded-xl p-3 border-t-2 " +
            (alertasART > 0 ? 'border-t-rojo' : 'border-t-verde-ac')}>
            <div className="text-[10px] text-gris mb-1 uppercase tracking-wide font-medium">Alertas ART</div>
            <div className={"text-xl font-semibold " + (alertasART > 0 ? 'text-rojo' : 'text-verde')}>
              {alertasART}
            </div>
            <div className="text-[10px] text-gris">vencimientos próximos</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <div className="flex items-center gap-2 bg-white border border-borde rounded-lg px-3 py-1.5 flex-1 max-w-xs">
            <Search size={13} className="text-gris flex-shrink-0"/>
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar nombre, DNI, cargo..."
              className="text-xs outline-none bg-transparent flex-1 text-carbon placeholder:text-gris"/>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {(['Todos', 'En blanco', 'Jornalero', 'Contratista', 'Eventual'] as const).map(t => (
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
            {(['Todos', 'Activo', 'Licencia', 'Vacaciones'] as const).map(e => (
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
            <strong className="text-carbon">{filtrados.length}</strong> personas
          </span>
        </div>

        {/* Lista de empleados */}
        <div className={"grid gap-3 " + (seleccionado ? 'grid-cols-[1fr_320px]' : 'grid-cols-1')}>

          <div className="bg-white border border-borde rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-tierra border-b border-borde">
                  {['Empleado','Cargo','Tipo','Ingreso','Antigüedad','Remuneración','Última liq.','Estado'].map(h => (
                    <th key={h} className="text-left px-3 py-2 font-medium text-gris">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-borde">
                {filtrados.map(emp => {
                  const ultLiq = emp.liquidaciones[0]
                  const artDias = diasHasta(emp.art_vencimiento)
                  return (
                    <tr key={emp.id}
                      onClick={() => setSeleccionado(seleccionado?.id === emp.id ? null : emp)}
                      className={"cursor-pointer transition-colors hover:bg-tierra/50 " +
                        (seleccionado?.id === emp.id ? 'bg-verde-s' : '')}>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-verde flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-semibold text-[10px]">{getIniciales(emp.nombre)}</span>
                          </div>
                          <div>
                            <p className="font-medium text-carbon">{emp.nombre}</p>
                            <p className="text-[10px] text-gris">DNI {emp.dni}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-carbon">{emp.cargo}</td>
                      <td className="px-3 py-2">
                        <span className={getTipoChip(emp.tipo)}>{emp.tipo}</span>
                      </td>
                      <td className="px-3 py-2 text-gris">{formatDate(emp.fecha_ingreso)}</td>
                      <td className="px-3 py-2 text-carbon font-medium">{getAntiguedad(emp.fecha_ingreso)}</td>
                      <td className="px-3 py-2 text-carbon font-semibold whitespace-nowrap">
                        {emp.sueldo_basico ? formatUSD(emp.sueldo_basico) + '/mes' :
                         emp.jornal_diario ? formatUSD(emp.jornal_diario) + '/dia' : '—'}
                      </td>
                      <td className="px-3 py-2">
                        {ultLiq ? (
                          <>
                            <p className="text-verde font-semibold">{formatUSD(ultLiq.neto)}</p>
                            <p className="text-[10px] text-gris">{ultLiq.mes} {ultLiq.ano}</p>
                          </>
                        ) : <span className="text-gris">—</span>}
                      </td>
                      <td className="px-3 py-2">
                        <span className={getEstadoChip(emp.estado)}>{emp.estado}</span>
                        {artDias !== null && artDias < 30 && (
                          <div className="mt-1">
                            <span className="chip chip-red text-[9px]">⚠ ART</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filtrados.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users size={32} className="text-borde mb-3"/>
                <p className="text-sm font-medium text-carbon mb-1">No hay empleados</p>
                <p className="text-xs text-gris">Cambia los filtros o agrega uno nuevo</p>
              </div>
            )}
          </div>

          {seleccionado && (
            <PanelDetalleEmpleado e={seleccionado} onClose={() => setSeleccionado(null)}/>
          )}
        </div>
      </div>
    </div>
  )
}
