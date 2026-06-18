'use client'
import { useState, useEffect } from 'react'
import { Search, Plus, Users, Building2, Truck, Stethoscope, X, Phone, Mail, MapPin, FileText, TrendingUp, Star } from 'lucide-react'
import Topbar from '@/components/Topbar'
import { createClient } from '@/lib/supabase'
import { useEstablecimiento } from '@/hooks/useEstablecimiento'

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
  total_operaciones?: number
  monto_acumulado?: number
  ultima_operacion?: string
  rating?: number
  observaciones?: string
  tags?: string[]
}

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

        {/* Metricas comerciales */}
        {!!(c.total_operaciones || c.monto_acumulado) && (
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

        {/* Estado */}
        <div className="pt-3">
          <span className={getEstadoChip(c.estado)}>{c.estado}</span>
        </div>
      </div>
    </div>
  )
}

// ── Formulario nuevo contacto ──────────────────────────────────────────────────
function FormNuevoContacto({
  establecimientoId,
  onClose,
  onSuccess,
}: {
  establecimientoId: string
  onClose: () => void
  onSuccess: (c: Contacto) => void
}) {
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState<TipoContacto>('Cliente')
  const [estado, setEstado] = useState<EstadoContacto>('Activo')
  const [subtipo, setSubtipo] = useState('')
  const [razonSocial, setRazonSocial] = useState('')
  const [cuit, setCuit] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [provincia, setProvincia] = useState('')
  const [direccion, setDireccion] = useState('')
  const [contactoPrincipal, setContactoPrincipal] = useState('')
  const [rating, setRating] = useState(0)
  const [observaciones, setObservaciones] = useState('')
  const [tags, setTags] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inputCls = 'w-full text-sm border border-borde rounded-lg px-3 py-2 outline-none focus:border-verde focus:ring-1 focus:ring-verde/20 bg-white text-carbon placeholder:text-gris'

  async function handleSave() {
    if (!nombre.trim()) { setError('El nombre es obligatorio.'); return }

    setSaving(true)
    setError(null)
    try {
      const supabase = createClient()
      const id = crypto.randomUUID()
      const tagsArr = tags.trim()
        ? tags.split(',').map(t => t.trim()).filter(Boolean)
        : []

      const { error: dbError } = await supabase.from('contactos').insert({
        id,
        establecimiento_id: establecimientoId,
        nombre: nombre.trim(),
        razon_social: razonSocial.trim() || null,
        tipo,
        subtipo: subtipo.trim() || null,
        estado,
        cuit: cuit.trim() || null,
        telefono: telefono.trim() || null,
        email: email.trim() || null,
        direccion: direccion.trim() || null,
        ciudad: ciudad.trim() || null,
        provincia: provincia.trim() || null,
        contacto_principal: contactoPrincipal.trim() || null,
        rating: rating > 0 ? rating : null,
        observaciones: observaciones.trim() || null,
        tags: tagsArr,
      })

      if (dbError) {
        setError('Error al guardar: ' + dbError.message)
        return
      }

      const contacto: Contacto = {
        id,
        nombre: nombre.trim(),
        razon_social: razonSocial.trim() || undefined,
        tipo,
        subtipo: subtipo.trim() || undefined,
        estado,
        cuit: cuit.trim() || undefined,
        telefono: telefono.trim() || undefined,
        email: email.trim() || undefined,
        direccion: direccion.trim() || undefined,
        ciudad: ciudad.trim() || undefined,
        provincia: provincia.trim() || undefined,
        contacto_principal: contactoPrincipal.trim() || undefined,
        rating: rating > 0 ? rating : undefined,
        observaciones: observaciones.trim() || undefined,
        tags: tagsArr.length > 0 ? tagsArr : undefined,
        total_operaciones: 0,
        monto_acumulado: 0,
      }
      onSuccess(contacto)
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
            <h2 className="text-sm font-semibold text-white">Nuevo contacto</h2>
            <p className="text-xs text-white/60 mt-0.5">Completá los datos del contacto</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white"><X size={16}/></button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">{error}</div>
          )}

          {/* Nombre */}
          <div>
            <label className="block text-xs font-medium text-carbon mb-1.5">Nombre *</label>
            <input value={nombre} onChange={e => setNombre(e.target.value)}
              placeholder="Nombre o razón social abreviada"
              className={inputCls}/>
          </div>

          {/* Tipo y Estado */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-carbon mb-1.5">Tipo *</label>
              <select value={tipo} onChange={e => setTipo(e.target.value as TipoContacto)} className={inputCls}>
                {(['Cliente','Proveedor','Asesor','Contratista','Transportista','Otro'] as TipoContacto[]).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-carbon mb-1.5">Estado *</label>
              <select value={estado} onChange={e => setEstado(e.target.value as EstadoContacto)} className={inputCls}>
                {(['Activo','Potencial','Inactivo'] as EstadoContacto[]).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Razon social y Subtipo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-carbon mb-1.5">Razón social</label>
              <input value={razonSocial} onChange={e => setRazonSocial(e.target.value)}
                placeholder="S.A., S.R.L., etc."
                className={inputCls}/>
            </div>
            <div>
              <label className="block text-xs font-medium text-carbon mb-1.5">Subtipo</label>
              <input value={subtipo} onChange={e => setSubtipo(e.target.value)}
                placeholder="Frigorifico, Acopiador..."
                className={inputCls}/>
            </div>
          </div>

          {/* Contacto y CUIT */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-carbon mb-1.5">Contacto principal</label>
              <input value={contactoPrincipal} onChange={e => setContactoPrincipal(e.target.value)}
                placeholder="Nombre y apellido"
                className={inputCls}/>
            </div>
            <div>
              <label className="block text-xs font-medium text-carbon mb-1.5">CUIT</label>
              <input value={cuit} onChange={e => setCuit(e.target.value)}
                placeholder="20-12345678-9"
                className={inputCls}/>
            </div>
          </div>

          {/* Telefono y Email */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-carbon mb-1.5">Teléfono</label>
              <input value={telefono} onChange={e => setTelefono(e.target.value)}
                placeholder="+54 351 1234-5678"
                className={inputCls}/>
            </div>
            <div>
              <label className="block text-xs font-medium text-carbon mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="contacto@empresa.com"
                className={inputCls}/>
            </div>
          </div>

          {/* Ciudad y Provincia */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-carbon mb-1.5">Ciudad</label>
              <input value={ciudad} onChange={e => setCiudad(e.target.value)}
                placeholder="Villa María"
                className={inputCls}/>
            </div>
            <div>
              <label className="block text-xs font-medium text-carbon mb-1.5">Provincia</label>
              <input value={provincia} onChange={e => setProvincia(e.target.value)}
                placeholder="Córdoba"
                className={inputCls}/>
            </div>
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-xs font-medium text-carbon mb-1.5">Dirección</label>
            <input value={direccion} onChange={e => setDireccion(e.target.value)}
              placeholder="Av. Colón 1234"
              className={inputCls}/>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-xs font-medium text-carbon mb-1.5">Calificación</label>
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(n => (
                <button key={n} type="button"
                  onClick={() => setRating(rating === n ? 0 : n)}
                  className="p-0.5">
                  <Star size={20} className={n <= rating ? 'fill-ambar text-ambar' : 'text-borde hover:text-ambar/50'}/>
                </button>
              ))}
              {rating > 0 && (
                <span className="text-xs text-gris ml-1">{rating}/5</span>
              )}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-carbon mb-1.5">Etiquetas</label>
            <input value={tags} onChange={e => setTags(e.target.value)}
              placeholder="Hacienda, Granos, CREA (separadas por coma)"
              className={inputCls}/>
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
            {saving ? 'Guardando...' : 'Guardar contacto'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Pagina principal ───────────────────────────────────────────────────────────
export default function Contactos() {
  const { establecimiento } = useEstablecimiento()
  const [contactos, setContactos] = useState<Contacto[]>([])
  const [loadingContactos, setLoadingContactos] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState<string>('Todos')
  const [estadoFiltro] = useState<string>('Todos')
  const [seleccionado, setSeleccionado] = useState<Contacto | null>(null)

  useEffect(() => {
    if (!establecimiento?.id) return
    let cancelled = false

    async function cargar() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('contactos')
        .select('*')
        .eq('establecimiento_id', establecimiento!.id)
        .order('nombre')

      if (cancelled) return
      if (error) {
        console.error('[Contactos] Error al cargar:', error.message)
        setLoadingContactos(false)
        return
      }

      const mapped: Contacto[] = (data ?? []).map(c => ({
        id: c.id as string,
        nombre: c.nombre as string,
        razon_social: c.razon_social ?? undefined,
        tipo: c.tipo as TipoContacto,
        subtipo: c.subtipo ?? undefined,
        estado: c.estado as EstadoContacto,
        cuit: c.cuit ?? undefined,
        telefono: c.telefono ?? undefined,
        email: c.email ?? undefined,
        direccion: c.direccion ?? undefined,
        ciudad: c.ciudad ?? undefined,
        provincia: c.provincia ?? undefined,
        contacto_principal: c.contacto_principal ?? undefined,
        total_operaciones: c.total_operaciones as number,
        monto_acumulado: Number(c.monto_acumulado),
        ultima_operacion: c.ultima_operacion ?? undefined,
        rating: c.rating ?? undefined,
        observaciones: c.observaciones ?? undefined,
        tags: (c.tags as string[]) ?? [],
      }))

      setContactos(mapped)
      setLoadingContactos(false)
    }

    cargar()
    return () => { cancelled = true }
  }, [establecimiento?.id])

  function handleSuccess(c: Contacto) {
    setContactos(prev => [...prev, c].sort((a, b) => a.nombre.localeCompare(b.nombre)))
    setMostrarForm(false)
    setSeleccionado(c)
  }

  const filtrados = contactos.filter(c => {
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
  const totalContactos = contactos.length
  const clientes = contactos.filter(c => c.tipo === 'Cliente').length
  const proveedores = contactos.filter(c => c.tipo === 'Proveedor').length
  const totalFacturado = contactos
    .filter(c => c.tipo === 'Cliente')
    .reduce((acc, c) => acc + (c.monto_acumulado || 0), 0)

  const actions = (
    <div className="flex gap-2">
      <button
        onClick={() => setMostrarForm(true)}
        className="flex items-center gap-1.5 text-xs font-semibold bg-verde-act text-white px-3 py-1.5 rounded-lg hover:bg-verde transition-colors">
        <Plus size={13}/> Nuevo contacto
      </button>
    </div>
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Contactos" actions={actions}/>

      {mostrarForm && establecimiento && (
        <FormNuevoContacto
          establecimientoId={establecimiento.id}
          onClose={() => setMostrarForm(false)}
          onSuccess={handleSuccess}
        />
      )}

      <div className="flex-1 overflow-y-auto p-4">

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-2.5 mb-4">
          {[
            { l:'Total contactos',  v: totalContactos.toString(), s:'en la base de datos',     c:'border-t-verde-ac' },
            { l:'Clientes activos', v: clientes.toString(),       s:'compradores recurrentes', c:'border-t-verde-ac' },
            { l:'Proveedores',      v: proveedores.toString(),    s:'red de abastecimiento',   c:'border-t-azul' },
            { l:'Total facturado',  v: formatUSD(totalFacturado), s:'a clientes acumulado',    c:'border-t-ambar' },
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
        {loadingContactos ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-gris">Cargando contactos...</p>
          </div>
        ) : contactos.length === 0 ? (
          <div className="bg-white border border-borde rounded-xl flex flex-col items-center justify-center py-12 text-center">
            <Users size={32} className="text-borde mb-3"/>
            <p className="text-sm font-medium text-carbon mb-1">Todavía no hay contactos registrados</p>
            <p className="text-xs text-gris">Agregá tu primer contacto con el botón "Nuevo contacto"</p>
          </div>
        ) : (
          <>
            <div className={"grid gap-3 " + (seleccionado ? 'grid-cols-[1fr_320px]' : 'grid-cols-1')}>
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
                    {!!c.monto_acumulado && c.monto_acumulado > 0 && (
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

              {seleccionado && (
                <PanelDetalleContacto c={seleccionado} onClose={() => setSeleccionado(null)}/>
              )}
            </div>

            {filtrados.length === 0 && (
              <div className="bg-white border border-borde rounded-xl flex flex-col items-center justify-center py-12 text-center mt-3">
                <Users size={32} className="text-borde mb-3"/>
                <p className="text-sm font-medium text-carbon mb-1">Sin resultados</p>
                <p className="text-xs text-gris">Cambiá los filtros para ver otros contactos</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
