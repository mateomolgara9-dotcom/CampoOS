'use client'
import { useState } from 'react'
import { Search, Plus, Users, Building2, Truck, Stethoscope, X, Phone, Mail, MapPin, FileText, TrendingUp, Star } from 'lucide-react'
import Topbar from '@/components/Topbar'

// ── Tipos ─────────────────────────────────────────────────────────────────────
type TipoContacto = 'Cliente' | 'Proveedor' | 'Asesor' | 'Contratista' | 'Transportista' | 'Otro'
type EstadoContacto = 'Activo' | 'Inactivo' | 'Potencial'

type Contacto = {
  id: string
  nombre: string
  razon_social?: string
  tipo: TipoContacto
  subtipo?: string
  estado: EstadoContacto
  cuit?: string
  telefono?: string
  email?: string
  direccion?: string
  ciudad?: string
  provincia?: string
  contacto_principal?: string
  // Datos comerciales
  total_operaciones?: number
  monto_acumulado?: number
  ultima_operacion?: string
  // Calificacion
  rating?: number // 1-5
  observaciones?: string
  tags?: string[]
}

// ── Datos de ejemplo ──────────────────────────────────────────────────────────
const CONTACTOS: Contacto[] = [
  {
    id:'1', nombre:'Frigorifico Rioplatense', razon_social:'Frigorifico Rioplatense S.A.',
    tipo:'Cliente', subtipo:'Frigorifico', estado:'Activo',
    cuit:'30-65478932-4', telefono:'+54 11 4789-1200', email:'compras@rioplatense.com.ar',
    direccion:'Av. del Libertador 4500', ciudad:'Pilar', provincia:'Buenos Aires',
    contacto_principal:'Roberto Sanchez',
    total_operaciones:24, monto_acumulado:825000, ultima_operacion:'2026-05-18',
    rating:5, tags:['Frigorifico', 'Hacienda'],
  },
  {
    id:'2', nombre:'Cargill Argentina', razon_social:'Cargill S.A.C.I.',
    tipo:'Cliente', subtipo:'Acopiador', estado:'Activo',
    cuit:'30-50001884-7', telefono:'+54 11 4319-2400', email:'comercial@cargill.com.ar',
    direccion:'Av. del Libertador 1000', ciudad:'Vicente Lopez', provincia:'Buenos Aires',
    contacto_principal:'Maria Eugenia Lopez',
    total_operaciones:8, monto_acumulado:712000, ultima_operacion:'2026-05-05',
    rating:5, tags:['Granos', 'Forward'],
  },
  {
    id:'3', nombre:'Acopio La Reina', razon_social:'Acopio La Reina S.R.L.',
    tipo:'Cliente', subtipo:'Acopiador', estado:'Activo',
    cuit:'30-71239456-1', telefono:'+54 353 4521-789', email:'admin@lareina.com.ar',
    direccion:'Ruta Nacional 9 km 542', ciudad:'Villa Maria', provincia:'Cordoba',
    contacto_principal:'Daniel Bertola',
    total_operaciones:15, monto_acumulado:312000, ultima_operacion:'2026-05-15',
    rating:4, tags:['Granos', 'Acopio local'],
  },
  {
    id:'4', nombre:'Agroquimicos Sur', razon_social:'Agroquimicos del Sur S.R.L.',
    tipo:'Proveedor', subtipo:'Agroquimicos', estado:'Activo',
    cuit:'30-71458921-3', telefono:'+54 351 4789-456', email:'ventas@agroquimicosur.com',
    direccion:'Av. Colon 2800', ciudad:'Cordoba', provincia:'Cordoba',
    contacto_principal:'Federico Romano',
    total_operaciones:42, monto_acumulado:185000, ultima_operacion:'2026-05-22',
    rating:4, tags:['Insumos', 'Agroquimicos'],
  },
  {
    id:'5', nombre:'YPF Agro', razon_social:'YPF S.A. Division Agro',
    tipo:'Proveedor', subtipo:'Fertilizantes', estado:'Activo',
    cuit:'30-54668997-9', telefono:'+54 11 5441-2000', email:'agro@ypf.com',
    direccion:'Macacha Guemes 515', ciudad:'CABA', provincia:'Buenos Aires',
    contacto_principal:'Luciano Pereira',
    total_operaciones:12, monto_acumulado:95000, ultima_operacion:'2026-04-20',
    rating:5, tags:['Fertilizantes', 'Combustible'],
  },
  {
    id:'6', nombre:'Dekalb Semillas', razon_social:'Bayer S.A. Division Semillas',
    tipo:'Proveedor', subtipo:'Semillas', estado:'Activo',
    cuit:'30-50001485-2', telefono:'+54 11 4317-7500', email:'semillas@bayer.com',
    direccion:'Av. del Libertador 7202', ciudad:'CABA', provincia:'Buenos Aires',
    contacto_principal:'Veronica Aguilera',
    total_operaciones:6, monto_acumulado:48000, ultima_operacion:'2026-04-15',
    rating:5, tags:['Semillas', 'Maiz', 'Soja'],
  },
  {
    id:'7', nombre:'Dr. Martin Acosta', tipo:'Asesor', subtipo:'Veterinario',
    estado:'Activo', cuit:'20-28457896-5', telefono:'+54 351 5847-321',
    email:'mvet.acosta@gmail.com', ciudad:'Villa Maria', provincia:'Cordoba',
    total_operaciones:48, monto_acumulado:28800, ultima_operacion:'2026-05-15',
    rating:5, observaciones:'Veterinario de cabecera. Asistencia mensual al rodeo.',
    tags:['Sanidad', 'Rodeo'],
  },
  {
    id:'8', nombre:'Ing. Agr. Patricia Mendez', tipo:'Asesor', subtipo:'Agronomo',
    estado:'Activo', cuit:'27-30125478-3', telefono:'+54 353 4159-852',
    email:'p.mendez.agro@gmail.com', ciudad:'Villa Maria', provincia:'Cordoba',
    total_operaciones:18, monto_acumulado:15400, ultima_operacion:'2026-05-10',
    rating:5, observaciones:'Asesora agronomica CREA. Visita cada 15 dias.',
    tags:['CREA', 'Cultivos'],
  },
  {
    id:'9', nombre:'Transporte Los Andes', razon_social:'Transporte Los Andes S.R.L.',
    tipo:'Transportista', subtipo:'Hacienda', estado:'Activo',
    cuit:'30-65124789-3', telefono:'+54 351 4587-963', email:'logistica@losandes.com.ar',
    ciudad:'Cordoba', provincia:'Cordoba', contacto_principal:'Carlos Quiroga',
    total_operaciones:32, monto_acumulado:45600, ultima_operacion:'2026-05-18',
    rating:4, tags:['Camiones jaulas', 'Hacienda'],
  },
  {
    id:'10', nombre:'Cosechadora El Pampero', tipo:'Contratista', subtipo:'Cosecha',
    estado:'Activo', cuit:'30-71258963-4', telefono:'+54 353 4789-456',
    contacto_principal:'Sergio Vivas',
    ciudad:'Villa Nueva', provincia:'Cordoba',
    total_operaciones:6, monto_acumulado:32400, ultima_operacion:'2026-04-05',
    rating:5, observaciones:'Contratista de cosecha. 50 ha/dia, JD S780.',
    tags:['Cosecha', 'Maiz', 'Soja'],
  },
  {
    id:'11', nombre:'Estancia La Maria', tipo:'Cliente', subtipo:'Vecino',
    estado:'Activo', telefono:'+54 351 5478-963',
    contacto_principal:'Luis Maria Echeverria',
    ciudad:'Cordoba', provincia:'Cordoba',
    total_operaciones:2, monto_acumulado:12000, ultima_operacion:'2026-05-20',
    rating:4, observaciones:'Vecino. Servicios de cosecha y siembra.',
    tags:['Servicios', 'Vecino'],
  },
  {
    id:'12', nombre:'Banco Galicia Agro', razon_social:'Banco Galicia S.A.',
    tipo:'Otro', subtipo:'Banco', estado:'Activo',
    telefono:'+54 11 6329-0000', email:'agro@galiciasa.com',
    ciudad:'CABA', provincia:'Buenos Aires',
    contacto_principal:'Sebastian Mendoza',
    rating:4, observaciones:'Linea de credito Carta Verde. USD 50.000 aprobados.',
    tags:['Banco', 'Financiamiento'],
  },
  {
    id:'13', nombre:'Carniceria El Tropezon', razon_social:'Carniceria El Tropezon',
    tipo:'Cliente', subtipo:'Carniceria', estado:'Activo',
    telefono:'+54 351 4123-456',
    contacto_principal:'Juan Carlos Romero',
    ciudad:'Cordoba', provincia:'Cordoba',
    total_operaciones:4, monto_acumulado:32500, ultima_operacion:'2026-05-10',
    rating:4, tags:['Hacienda', 'Carniceria'],
  },
  {
    id:'14', nombre:'Don Mario Semillas', razon_social:'Asociados Don Mario S.A.',
    tipo:'Proveedor', subtipo:'Semillas', estado:'Potencial',
    telefono:'+54 2477 410-100',
    ciudad:'Chacabuco', provincia:'Buenos Aires',
    rating:0, observaciones:'Contactar para semilla soja proxima campania.',
    tags:['Semillas', 'Soja'],
  },
]

// ── Helpers ────────────────────────────────────────────────────────────────────
function getTipoChip(t: TipoContacto) {
  const map: Record<TipoContacto, string> = {
    'Cliente':       'chip chip-green',
    'Proveedor':     'chip chip-blue',
    'Asesor':        'chip chip-purple',
    'Contratista':   'chip chip-amber',
    'Transportista': 'chip chip-gray',
    'Otro':          'chip chip-gray',
  }
  return map[t]
}

function getEstadoChip(e: EstadoContacto) {
  if (e === 'Activo') return 'chip chip-green'
  if (e === 'Potencial') return 'chip chip-amber'
  return 'chip chip-gray'
}

function getTipoIcon(t: TipoContacto) {
  if (t === 'Cliente') return <Building2 size={14}/>
  if (t === 'Proveedor') return <Truck size={14}/>
  if (t === 'Asesor') return <Stethoscope size={14}/>
  if (t === 'Transportista') return <Truck size={14}/>
  if (t === 'Contratista') return <Users size={14}/>
  return <FileText size={14}/>
}

function formatDate(d?: string) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function formatUSD(n?: number) {
  if (!n) return '—'
  return 'USD ' + n.toLocaleString(undefined, { maximumFractionDigits: 0 })
}

function getIniciales(nombre: string) {
  return nombre.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

// ── Panel detalle ──────────────────────────────────────────────────────────────
function PanelDetalleContacto({ c, onClose }: { c: Contacto, onClose: () => void }) {
  return (
    <div className="bg-white border border-borde rounded-xl overflow-hidden">
      <div className="bg-verde px-4 py-3 flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-verde-act flex items-center justify-center flex-shrink-0">
          <span className="text-white font-semibold text-sm">{getIniciales(c.nombre)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">{c.nombre}</p>
          {c.razon_social && c.razon_social !== c.nombre && (
            <p className="text-[11px] text-white/60 mt-0.5 truncate">{c.razon_social}</p>
          )}
          <div className="flex gap-1.5 mt-1.5 flex-wrap">
            <span className={getTipoChip(c.tipo)}>{c.tipo}</span>
            {c.subtipo && <span className="chip" style={{background:'rgba(255,255,255,.15)',color:'#fff'}}>{c.subtipo}</span>}
          </div>
        </div>
        <button onClick={onClose} className="text-white/50 hover:text-white"><X size={14}/></button>
      </div>

      <div className="p-4 divide-y divide-borde">
        {/* Rating */}
        {c.rating !== undefined && c.rating > 0 && (
          <div className="pb-3">
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(n => (
                <Star key={n} size={14}
                  className={n <= (c.rating || 0) ? 'fill-ambar text-ambar' : 'text-borde'}/>
              ))}
              <span className="text-[11px] text-gris ml-1">Calificacion</span>
            </div>
          </div>
        )}

        {/* Métricas comerciales */}
        {(c.total_operaciones || c.monto_acumulado) && (
          <div className="py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-2">Historial comercial</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-tierra rounded-lg p-2">
                <p className="text-[10px] text-gris mb-0.5">Operaciones</p>
                <p className="text-sm font-semibold text-carbon">{c.total_operaciones || 0}</p>
              </div>
              <div className="bg-verde-s rounded-lg p-2">
                <p className="text-[10px] text-verde mb-0.5">Total acumulado</p>
                <p className="text-sm font-semibold text-verde">{formatUSD(c.monto_acumulado)}</p>
              </div>
            </div>
            {c.ultima_operacion && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-azul font-medium bg-azul-s px-3 py-1.5 rounded-lg">
                <TrendingUp size={12}/> Última operación: {formatDate(c.ultima_operacion)}
              </div>
            )}
          </div>
        )}

        {/* Datos de contacto */}
        <div className="py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-2">Datos de contacto</p>
          <div className="space-y-2">
            {c.contacto_principal && (
              <div className="flex items-start gap-2">
                <Users size={12} className="text-gris mt-0.5 flex-shrink-0"/>
                <div>
                  <p className="text-[10px] text-gris">Contacto principal</p>
                  <p className="text-xs font-medium text-carbon">{c.contacto_principal}</p>
                </div>
              </div>
            )}
            {c.telefono && (
              <div className="flex items-start gap-2">
                <Phone size={12} className="text-gris mt-0.5 flex-shrink-0"/>
                <div>
                  <p className="text-[10px] text-gris">Teléfono</p>
                  <p className="text-xs font-medium text-carbon">{c.telefono}</p>
                </div>
              </div>
            )}
            {c.email && (
              <div className="flex items-start gap-2">
                <Mail size={12} className="text-gris mt-0.5 flex-shrink-0"/>
                <div>
                  <p className="text-[10px] text-gris">Email</p>
                  <p className="text-xs font-medium text-carbon break-all">{c.email}</p>
                </div>
              </div>
            )}
            {(c.ciudad || c.provincia) && (
              <div className="flex items-start gap-2">
                <MapPin size={12} className="text-gris mt-0.5 flex-shrink-0"/>
                <div>
                  <p className="text-[10px] text-gris">Ubicación</p>
                  <p className="text-xs font-medium text-carbon">
                    {[c.direccion, c.ciudad, c.provincia].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>
            )}
            {c.cuit && (
              <div className="flex items-start gap-2">
                <FileText size={12} className="text-gris mt-0.5 flex-shrink-0"/>
                <div>
                  <p className="text-[10px] text-gris">CUIT</p>
                  <p className="text-xs font-medium text-carbon font-mono">{c.cuit}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        {c.tags && c.tags.length > 0 && (
          <div className="py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-2">Etiquetas</p>
            <div className="flex flex-wrap gap-1.5">
              {c.tags.map(t => (
                <span key={t} className="text-[10px] bg-tierra text-gris px-2 py-0.5 rounded-md border border-borde">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Observaciones */}
        {c.observaciones && (
          <div className="py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-2">Observaciones</p>
            <p className="text-xs text-carbon bg-tierra rounded-lg p-2">{c.observaciones}</p>
          </div>
        )}

        {/* Acciones */}
        <div className="pt-4 flex flex-col gap-2">
          <button className="w-full text-xs font-semibold bg-verde-act text-white py-2 rounded-lg hover:bg-verde transition-colors">
            Registrar operación
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
export default function Contactos() {
  const [busqueda, setBusqueda] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState<string>('Todos')
  const [estadoFiltro, setEstadoFiltro] = useState<string>('Todos')
  const [seleccionado, setSeleccionado] = useState<Contacto | null>(null)

  const filtrados = CONTACTOS.filter(c => {
    const matchBusqueda = c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (c.razon_social || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (c.contacto_principal || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (c.tags || []).some(t => t.toLowerCase().includes(busqueda.toLowerCase()))
    const matchTipo = tipoFiltro === 'Todos' || c.tipo === tipoFiltro
    const matchEstado = estadoFiltro === 'Todos' || c.estado === estadoFiltro
    return matchBusqueda && matchTipo && matchEstado
  })

  // KPIs
  const totalContactos = CONTACTOS.length
  const clientes = CONTACTOS.filter(c => c.tipo === 'Cliente').length
  const proveedores = CONTACTOS.filter(c => c.tipo === 'Proveedor').length
  const totalFacturado = CONTACTOS.filter(c => c.tipo === 'Cliente')
    .reduce((acc, c) => acc + (c.monto_acumulado || 0), 0)

  const actions = (
    <div className="flex gap-2">
      <button className="flex items-center gap-1.5 text-xs font-semibold bg-verde-act text-white px-3 py-1.5 rounded-lg hover:bg-verde transition-colors">
        <Plus size={13}/> Nuevo contacto
      </button>
    </div>
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Contactos" actions={actions}/>
      <div className="flex-1 overflow-y-auto p-4">

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-2.5 mb-4">
          {[
            { l:'Total contactos',     v: totalContactos.toString(),     s:'en la base de datos',         c:'border-t-verde-ac' },
            { l:'Clientes activos',    v: clientes.toString(),           s:'compradores recurrentes',     c:'border-t-verde-ac' },
            { l:'Proveedores',         v: proveedores.toString(),         s:'red de abastecimiento',       c:'border-t-azul' },
            { l:'Total facturado',     v: formatUSD(totalFacturado),      s:'a clientes acumulado',        c:'border-t-ambar' },
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
              placeholder="Buscar nombre, CUIT, email, etiqueta..."
              className="text-xs outline-none bg-transparent flex-1 text-carbon placeholder:text-gris"/>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {(['Todos', 'Cliente', 'Proveedor', 'Asesor', 'Contratista', 'Transportista'] as const).map(t => (
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
          <span className="ml-auto text-xs text-gris bg-tierra border border-borde px-3 py-1.5 rounded-lg">
            <strong className="text-carbon">{filtrados.length}</strong> contactos
          </span>
        </div>

        {/* Lista + Detalle */}
        <div className={"grid gap-3 " + (seleccionado ? 'grid-cols-[1fr_320px]' : 'grid-cols-1')}>

          {/* Grid de contactos */}
          <div className={"grid gap-2.5 " + (seleccionado ? 'grid-cols-2' : 'grid-cols-3')}>
            {filtrados.map(c => (
              <div key={c.id}
                onClick={() => setSeleccionado(seleccionado?.id === c.id ? null : c)}
                className={"bg-white border rounded-xl p-3 cursor-pointer transition-all hover:shadow-md " +
                  (seleccionado?.id === c.id ? 'border-verde-act bg-verde-s' : 'border-borde hover:border-gris')}>
                <div className="flex items-start gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-verde flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-xs">{getIniciales(c.nombre)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-carbon truncate">{c.nombre}</p>
                    <p className="text-[10px] text-gris truncate mt-0.5">
                      {c.contacto_principal || c.razon_social || c.ciudad || '—'}
                    </p>
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      <span className={getTipoChip(c.tipo)}>{c.tipo}</span>
                      {c.subtipo && (
                        <span className="text-[10px] text-gris">· {c.subtipo}</span>
                      )}
                    </div>
                  </div>
                </div>
                {c.monto_acumulado && c.monto_acumulado > 0 && (
                  <div className="mt-2 pt-2 border-t border-borde flex items-center justify-between">
                    <span className="text-[10px] text-gris">
                      {c.total_operaciones} oper.
                    </span>
                    <span className="text-[11px] font-semibold text-verde">
                      {formatUSD(c.monto_acumulado)}
                    </span>
                  </div>
                )}
                {c.rating !== undefined && c.rating > 0 && (
                  <div className="mt-1 flex items-center gap-0.5">
                    {[1,2,3,4,5].map(n => (
                      <Star key={n} size={9}
                        className={n <= (c.rating || 0) ? 'fill-ambar text-ambar' : 'text-borde'}/>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Panel detalle */}
          {seleccionado && (
            <PanelDetalleContacto c={seleccionado} onClose={() => setSeleccionado(null)}/>
          )}
        </div>

        {filtrados.length === 0 && (
          <div className="bg-white border border-borde rounded-xl flex flex-col items-center justify-center py-12 text-center">
            <Users size={32} className="text-borde mb-3"/>
            <p className="text-sm font-medium text-carbon mb-1">No hay contactos</p>
            <p className="text-xs text-gris">Cambia los filtros o agrega un nuevo contacto</p>
          </div>
        )}
      </div>
    </div>
  )
}
