'use client'
import { useState, useEffect } from 'react'
import { Search, Plus, Users, X, Phone, Mail, MapPin, FileText, AlertTriangle } from 'lucide-react'
import Topbar from '@/components/Topbar'
import { createClient } from '@/lib/supabase'
import { useEstablecimiento } from '@/hooks/useEstablecimiento'
import toast from 'react-hot-toast'

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
  telefono?: string
  email?: string
  direccion?: string
  ciudad?: string
  sueldo_basico?: number
  jornal_diario?: number
  dias_trabajados_mes?: number
  obra_social?: string
  art?: string
  art_vencimiento?: string
  liquidaciones: Liquidacion[]
  observaciones?: string
}

const MESES_ORDEN = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

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

function hoy() {
  return new Date().toISOString().split('T')[0]
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
          <p className="text-[11px] text-white/60 mt-0.5">{e.cargo}{e.dni ? ' · DNI ' + e.dni : ''}</p>
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
        {!!(e.sueldo_basico || e.jornal_diario) && (
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
        {!!(e.obra_social || e.art) && (
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
                      Bruto {formatUSD(l.bruto)}{l.descuentos > 0 ? ' · Desc ' + formatUSD(l.descuentos) : ''}
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

// ── Formulario nuevo empleado ─────────────────────────────────────────────────
function FormNuevoEmpleado({
  establecimientoId,
  onClose,
  onSuccess,
}: {
  establecimientoId: string
  onClose: () => void
  onSuccess: (e: Empleado) => void
}) {
  const [nombre, setNombre] = useState('')
  const [cargo, setCargo] = useState<Cargo>('Peon general')
  const [tipo, setTipo] = useState<TipoEmpleado>('En blanco')
  const [estado, setEstado] = useState<EstadoEmpleado>('Activo')
  const [dni, setDni] = useState('')
  const [cuil, setCuil] = useState('')
  const [fechaIngreso, setFechaIngreso] = useState(hoy())
  const [fechaNacimiento, setFechaNacimiento] = useState('')
  const [sueldoBasico, setSueldoBasico] = useState('')
  const [jornalDiario, setJornalDiario] = useState('')
  const [diasTrabajados, setDiasTrabajados] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [direccion, setDireccion] = useState('')
  const [obraSocial, setObraSocial] = useState('')
  const [art, setArt] = useState('')
  const [artVencimiento, setArtVencimiento] = useState('')
  const [observaciones, setObservaciones] = useState('')

  const [saving, setSaving] = useState(false)

  const inputCls = 'w-full text-sm border border-borde rounded-lg px-3 py-2 outline-none focus:border-verde focus:ring-1 focus:ring-verde/20 bg-white text-carbon placeholder:text-gris'

  async function handleSave() {
    if (!nombre.trim()) { toast.error('El nombre es obligatorio.'); return }

    setSaving(true)
    try {
      const supabase = createClient()
      const id = crypto.randomUUID()

      const { error: dbError } = await supabase.from('empleados').insert({
        id,
        establecimiento_id: establecimientoId,
        nombre: nombre.trim(),
        cargo,
        tipo,
        estado,
        dni: dni.trim() || null,
        cuil: cuil.trim() || null,
        fecha_ingreso: fechaIngreso,
        fecha_nacimiento: fechaNacimiento || null,
        sueldo_basico: sueldoBasico ? Number(sueldoBasico) : null,
        jornal_diario: jornalDiario ? Number(jornalDiario) : null,
        dias_trabajados_mes: diasTrabajados ? Number(diasTrabajados) : null,
        telefono: telefono.trim() || null,
        email: email.trim() || null,
        ciudad: ciudad.trim() || null,
        direccion: direccion.trim() || null,
        obra_social: obraSocial.trim() || null,
        art: art.trim() || null,
        art_vencimiento: artVencimiento || null,
        observaciones: observaciones.trim() || null,
      })

      if (dbError) {
        toast.error('Error al guardar: ' + dbError.message)
        return
      }

      const empleado: Empleado = {
        id,
        nombre: nombre.trim(),
        cargo,
        tipo,
        estado,
        dni: dni.trim(),
        cuil: cuil.trim() || undefined,
        fecha_ingreso: fechaIngreso,
        fecha_nacimiento: fechaNacimiento || undefined,
        sueldo_basico: sueldoBasico ? Number(sueldoBasico) : undefined,
        jornal_diario: jornalDiario ? Number(jornalDiario) : undefined,
        dias_trabajados_mes: diasTrabajados ? Number(diasTrabajados) : undefined,
        telefono: telefono.trim() || undefined,
        email: email.trim() || undefined,
        ciudad: ciudad.trim() || undefined,
        direccion: direccion.trim() || undefined,
        obra_social: obraSocial.trim() || undefined,
        art: art.trim() || undefined,
        art_vencimiento: artVencimiento || undefined,
        observaciones: observaciones.trim() || undefined,
        liquidaciones: [],
      }
      toast.success('Empleado guardado correctamente')
      onSuccess(empleado)
    } catch (err) {
      toast.error('Error inesperado.')
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
            <h2 className="text-sm font-semibold text-white">Nuevo empleado</h2>
            <p className="text-xs text-white/60 mt-0.5">Completá los datos del personal</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white"><X size={16}/></button>
        </div>

        <div className="p-5 space-y-4">

          {/* Nombre */}
          <div>
            <label className="block text-xs font-medium text-carbon mb-1.5">Nombre completo *</label>
            <input value={nombre} onChange={e => setNombre(e.target.value)}
              placeholder="Juan García"
              className={inputCls}/>
          </div>

          {/* Cargo, Tipo, Estado */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-carbon mb-1.5">Cargo *</label>
              <select value={cargo} onChange={e => setCargo(e.target.value as Cargo)} className={inputCls}>
                {(['Encargado','Tractorista','Peon general','Veterinario','Mecanico','Ordenador','Capataz','Otro'] as Cargo[]).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-carbon mb-1.5">Tipo *</label>
              <select value={tipo} onChange={e => setTipo(e.target.value as TipoEmpleado)} className={inputCls}>
                {(['En blanco','Jornalero','Contratista','Eventual'] as TipoEmpleado[]).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-carbon mb-1.5">Estado *</label>
              <select value={estado} onChange={e => setEstado(e.target.value as EstadoEmpleado)} className={inputCls}>
                {(['Activo','Licencia','Vacaciones','Inactivo'] as EstadoEmpleado[]).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* DNI, CUIL, Fechas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-carbon mb-1.5">DNI</label>
              <input value={dni} onChange={e => setDni(e.target.value)}
                placeholder="27.458.963" className={inputCls}/>
            </div>
            <div>
              <label className="block text-xs font-medium text-carbon mb-1.5">CUIL</label>
              <input value={cuil} onChange={e => setCuil(e.target.value)}
                placeholder="20-27458963-4" className={inputCls}/>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-carbon mb-1.5">Fecha de ingreso *</label>
              <input type="date" value={fechaIngreso} onChange={e => setFechaIngreso(e.target.value)} className={inputCls}/>
            </div>
            <div>
              <label className="block text-xs font-medium text-carbon mb-1.5">Fecha de nacimiento</label>
              <input type="date" value={fechaNacimiento} onChange={e => setFechaNacimiento(e.target.value)} className={inputCls}/>
            </div>
          </div>

          {/* Remuneración */}
          <div className="border border-borde rounded-xl p-3 space-y-3 bg-tierra/30">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gris">Remuneración</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-carbon mb-1.5">Sueldo básico (USD)</label>
                <input type="number" value={sueldoBasico} onChange={e => setSueldoBasico(e.target.value)}
                  min="0" step="0.01" placeholder="0.00" className={inputCls}/>
              </div>
              <div>
                <label className="block text-xs font-medium text-carbon mb-1.5">Jornal diario (USD)</label>
                <input type="number" value={jornalDiario} onChange={e => setJornalDiario(e.target.value)}
                  min="0" step="0.01" placeholder="0.00" className={inputCls}/>
              </div>
              <div>
                <label className="block text-xs font-medium text-carbon mb-1.5">Días/mes</label>
                <input type="number" value={diasTrabajados} onChange={e => setDiasTrabajados(e.target.value)}
                  min="0" max="31" placeholder="0" className={inputCls}/>
              </div>
            </div>
          </div>

          {/* Contacto */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-carbon mb-1.5">Teléfono</label>
              <input value={telefono} onChange={e => setTelefono(e.target.value)}
                placeholder="+54 351 5847-321" className={inputCls}/>
            </div>
            <div>
              <label className="block text-xs font-medium text-carbon mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="juan@ejemplo.com" className={inputCls}/>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-carbon mb-1.5">Ciudad</label>
              <input value={ciudad} onChange={e => setCiudad(e.target.value)}
                placeholder="Villa María, Córdoba" className={inputCls}/>
            </div>
            <div>
              <label className="block text-xs font-medium text-carbon mb-1.5">Dirección</label>
              <input value={direccion} onChange={e => setDireccion(e.target.value)}
                placeholder="Casa del campo" className={inputCls}/>
            </div>
          </div>

          {/* Cobertura social */}
          <div className="border border-borde rounded-xl p-3 space-y-3 bg-tierra/30">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gris">Cobertura social</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-carbon mb-1.5">Obra social</label>
                <input value={obraSocial} onChange={e => setObraSocial(e.target.value)}
                  placeholder="OSPRERA" className={inputCls}/>
              </div>
              <div>
                <label className="block text-xs font-medium text-carbon mb-1.5">ART</label>
                <input value={art} onChange={e => setArt(e.target.value)}
                  placeholder="Provincia ART" className={inputCls}/>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-carbon mb-1.5">Vencimiento ART</label>
              <input type="date" value={artVencimiento} onChange={e => setArtVencimiento(e.target.value)} className={inputCls}/>
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-xs font-medium text-carbon mb-1.5">Observaciones</label>
            <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)}
              placeholder="Notas adicionales..."
              rows={2}
              className="w-full text-sm border border-borde rounded-lg px-3 py-2 outline-none focus:border-verde focus:ring-1 focus:ring-verde/20 bg-white text-carbon placeholder:text-gris resize-none"/>
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-2">
          <button onClick={onClose}
            className="flex-1 text-sm font-medium border border-borde text-carbon py-2.5 rounded-lg hover:bg-tierra transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 text-sm font-semibold bg-verde-act text-white py-2.5 rounded-lg hover:bg-verde transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
            {saving ? 'Guardando...' : 'Guardar empleado'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Pagina principal ───────────────────────────────────────────────────────────
export default function RRHH() {
  const { establecimiento } = useEstablecimiento()
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [loadingEmp, setLoadingEmp] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState<string>('Todos')
  const [estadoFiltro, setEstadoFiltro] = useState<string>('Todos')
  const [seleccionado, setSeleccionado] = useState<Empleado | null>(null)

  useEffect(() => {
    if (!establecimiento?.id) return
    let cancelled = false

    async function cargar() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('empleados')
        .select('*, liquidaciones(*)')
        .eq('establecimiento_id', establecimiento!.id)
        .order('nombre')

      if (cancelled) return
      if (error) {
        console.error('[RRHH] Error al cargar:', error.message)
        setLoadingEmp(false)
        return
      }

      const mapped: Empleado[] = (data ?? []).map(emp => {
        const liqs = ((emp.liquidaciones ?? []) as Record<string, unknown>[])
          .map(l => ({
            id: l.id as string,
            mes: l.mes as string,
            ano: l.ano as number,
            bruto: Number(l.bruto),
            descuentos: Number(l.descuentos),
            neto: Number(l.neto),
            estado: l.estado as 'Pagada' | 'Pendiente',
          }))
          .sort((a, b) => {
            if (b.ano !== a.ano) return b.ano - a.ano
            return MESES_ORDEN.indexOf(b.mes) - MESES_ORDEN.indexOf(a.mes)
          })

        return {
          id: emp.id as string,
          nombre: emp.nombre as string,
          dni: (emp.dni ?? '') as string,
          cuil: emp.cuil ?? undefined,
          fecha_nacimiento: emp.fecha_nacimiento ?? undefined,
          fecha_ingreso: emp.fecha_ingreso as string,
          cargo: emp.cargo as Cargo,
          tipo: emp.tipo as TipoEmpleado,
          estado: emp.estado as EstadoEmpleado,
          telefono: emp.telefono ?? undefined,
          email: emp.email ?? undefined,
          direccion: emp.direccion ?? undefined,
          ciudad: emp.ciudad ?? undefined,
          sueldo_basico: emp.sueldo_basico != null ? Number(emp.sueldo_basico) : undefined,
          jornal_diario: emp.jornal_diario != null ? Number(emp.jornal_diario) : undefined,
          dias_trabajados_mes: emp.dias_trabajados_mes ?? undefined,
          obra_social: emp.obra_social ?? undefined,
          art: emp.art ?? undefined,
          art_vencimiento: emp.art_vencimiento ?? undefined,
          observaciones: emp.observaciones ?? undefined,
          liquidaciones: liqs,
        }
      })

      setEmpleados(mapped)
      setLoadingEmp(false)
    }

    cargar()
    return () => { cancelled = true }
  }, [establecimiento?.id])

  function handleSuccess(emp: Empleado) {
    setEmpleados(prev => [...prev, emp].sort((a, b) => a.nombre.localeCompare(b.nombre)))
    setMostrarForm(false)
    setSeleccionado(emp)
  }

  const filtrados = empleados.filter(emp => {
    const matchBusqueda = emp.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      emp.dni.includes(busqueda) ||
      emp.cargo.toLowerCase().includes(busqueda.toLowerCase())
    const matchTipo = tipoFiltro === 'Todos' || emp.tipo === tipoFiltro
    const matchEstado = estadoFiltro === 'Todos' || emp.estado === estadoFiltro
    return matchBusqueda && matchTipo && matchEstado
  })

  // KPIs
  const totalEmpleados = empleados.length
  const enBlanco = empleados.filter(e => e.tipo === 'En blanco' && e.estado === 'Activo').length
  const jornaleros = empleados.filter(e => (e.tipo === 'Jornalero' || e.tipo === 'Eventual') && e.estado === 'Activo').length
  const totalMes = empleados.reduce((acc, e) => {
    const ultLiq = e.liquidaciones[0]
    return acc + (ultLiq ? ultLiq.neto : 0)
  }, 0)
  const alertasART = empleados.filter(e => {
    const d = diasHasta(e.art_vencimiento)
    return d !== null && d < 30
  }).length

  const actions = (
    <div className="flex gap-2">
      <button className="flex items-center gap-1.5 text-xs font-medium border border-borde bg-white text-carbon px-3 py-1.5 rounded-lg hover:bg-tierra transition-colors">
        <FileText size={13}/> Liquidaciones del mes
      </button>
      <button
        onClick={() => setMostrarForm(true)}
        className="flex items-center gap-1.5 text-xs font-semibold bg-verde-act text-white px-3 py-1.5 rounded-lg hover:bg-verde transition-colors">
        <Plus size={13}/> Nuevo empleado
      </button>
    </div>
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Recursos Humanos" actions={actions}/>

      {mostrarForm && establecimiento && (
        <FormNuevoEmpleado
          establecimientoId={establecimiento.id}
          onClose={() => setMostrarForm(false)}
          onSuccess={handleSuccess}
        />
      )}

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
              {empleados.filter(e => e.estado === 'Activo').length}
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
            <div className="text-[10px] text-gris mb-1 uppercase tracking-wide font-medium flex items-center gap-1">
              {alertasART > 0 && <AlertTriangle size={11} className="text-rojo"/>} Alertas ART
            </div>
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
        {loadingEmp ? (
          <div className="bg-white border border-borde rounded-xl flex items-center justify-center py-12">
            <p className="text-sm text-gris">Cargando personal...</p>
          </div>
        ) : (
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
                              {emp.dni && <p className="text-[10px] text-gris">DNI {emp.dni}</p>}
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
              {empleados.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users size={32} className="text-borde mb-3"/>
                  <p className="text-sm font-medium text-carbon mb-1">Todavía no hay personal registrado</p>
                  <p className="text-xs text-gris">Agregá tu primer empleado con el botón "Nuevo empleado"</p>
                </div>
              )}
              {empleados.length > 0 && filtrados.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users size={32} className="text-borde mb-3"/>
                  <p className="text-sm font-medium text-carbon mb-1">Sin resultados</p>
                  <p className="text-xs text-gris">Cambiá los filtros para ver otro personal</p>
                </div>
              )}
            </div>

            {seleccionado && (
              <PanelDetalleEmpleado e={seleccionado} onClose={() => setSeleccionado(null)}/>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
