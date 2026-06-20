'use client'
import { useState, useEffect } from 'react'
import { Plus, Car, Truck, X, AlertTriangle, Fuel, FileText, MapPin } from 'lucide-react'
import Topbar from '@/components/Topbar'
import { createClient } from '@/lib/supabase'
import { useEstablecimiento } from '@/hooks/useEstablecimiento'
import toast from 'react-hot-toast'

// ── Tipos ─────────────────────────────────────────────────────────────────────
type TipoVehiculo = 'Camioneta' | 'Camion' | 'Acoplado' | 'Utilitario' | 'Auto' | 'Moto'
type EstadoVehiculo = 'Operativo' | 'En taller' | 'Fuera de servicio'

type CargaVehiculo = {
  id: string
  fecha: string
  litros: number
  km?: number
  costo: number
  estacion?: string
}

type Vehiculo = {
  id: string
  nombre: string
  tipo: TipoVehiculo
  marca?: string
  modelo?: string
  ano?: number
  patente?: string
  chasis?: string
  km: number
  estado: EstadoVehiculo
  consumo_promedio?: number
  combustible_actual?: number
  capacidad_tanque?: number
  asignado_a?: string
  vtv_vencimiento?: string
  seguro_vencimiento?: string
  patente_vencimiento?: string
  observaciones?: string
  cargas: CargaVehiculo[]
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function getEstadoChip(e: EstadoVehiculo) {
  if (e === 'Operativo') return 'chip chip-green'
  if (e === 'En taller') return 'chip chip-amber'
  return 'chip chip-red'
}

function getTipoIcon(t: TipoVehiculo) {
  return (t === 'Camion' || t === 'Acoplado') ? <Truck size={14}/> : <Car size={14}/>
}

function formatDate(d?: string) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function formatKm(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 }) + ' km'
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

function hoy() {
  return new Date().toISOString().split('T')[0]
}

// ── Panel detalle vehiculo ────────────────────────────────────────────────────
function PanelDetalleVehiculo({ v, onClose }: { v: Vehiculo, onClose: () => void }) {
  const docs = [
    { label: 'VTV', fecha: v.vtv_vencimiento },
    { label: 'Seguro', fecha: v.seguro_vencimiento },
    { label: 'Patente', fecha: v.patente_vencimiento },
  ]

  const ultimaCarga = v.cargas[0]
  const kmTotal = v.cargas.reduce((acc, c) => acc + c.litros, 0)

  return (
    <div className="bg-white border border-borde rounded-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-verde px-4 py-3 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-verde-act flex items-center justify-center flex-shrink-0">
          {getTipoIcon(v.tipo)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">{v.nombre}</p>
          <p className="text-[11px] text-white/60 mt-0.5">
            {[v.marca, v.modelo, v.ano].filter(Boolean).join(' · ')}
            {v.patente ? ' · ' + v.patente : ''}
          </p>
          <div className="flex gap-1.5 mt-1.5">
            <span className={getEstadoChip(v.estado)}>{v.estado}</span>
            <span className="chip chip-gray">{v.tipo}</span>
          </div>
        </div>
        <button onClick={onClose} className="text-white/50 hover:text-white"><X size={14}/></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 divide-y divide-borde">
        {/* KM y combustible */}
        <div className="pb-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-2">Estado actual</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-verde-s rounded-lg p-2">
              <p className="text-[10px] text-verde">Kilometraje</p>
              <p className="text-lg font-semibold text-carbon">{formatKm(v.km)}</p>
            </div>
            {v.combustible_actual != null && v.capacidad_tanque ? (
              <div className="bg-tierra rounded-lg p-2">
                <p className="text-[10px] text-gris">Combustible</p>
                <p className="text-sm font-semibold text-carbon">
                  {v.combustible_actual}L / {v.capacidad_tanque}L
                </p>
                <div className="mt-1 h-1.5 bg-borde rounded-full overflow-hidden">
                  <div
                    className="h-1.5 bg-ambar rounded-full"
                    style={{ width: Math.min((v.combustible_actual / v.capacidad_tanque) * 100, 100) + '%' }}
                  />
                </div>
              </div>
            ) : (
              <div className="bg-tierra rounded-lg p-2">
                <p className="text-[10px] text-gris">Consumo prom.</p>
                <p className="text-sm font-semibold text-carbon">
                  {v.consumo_promedio ? v.consumo_promedio + ' L/100km' : '—'}
                </p>
              </div>
            )}
          </div>
          {v.asignado_a && (
            <div className="mt-2 flex items-center gap-1.5 bg-azul-s rounded-lg px-3 py-2">
              <MapPin size={11} className="text-azul flex-shrink-0"/>
              <span className="text-xs text-azul font-medium">Asignado a: {v.asignado_a}</span>
            </div>
          )}
        </div>

        {/* Documentación */}
        <div className="py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-2">Documentación</p>
          <div className="space-y-2">
            {docs.map(doc => {
              const dias = diasHasta(doc.fecha)
              const vencido = dias !== null && dias < 0
              const proximo = dias !== null && dias >= 0 && dias < 30
              const ok = dias !== null && dias >= 30
              return (
                <div key={doc.label}
                  className={"rounded-lg px-3 py-2 flex items-center justify-between " +
                    (vencido ? 'bg-rojo-s' : proximo ? 'bg-ambar-s' : 'bg-tierra')}>
                  <div>
                    <p className={"text-[10px] font-semibold " +
                      (vencido ? 'text-rojo' : proximo ? '' : 'text-gris')}
                      style={proximo ? {color:'#854F0B'} : {}}>
                      {doc.label}
                    </p>
                    <p className="text-xs font-medium text-carbon">{formatDate(doc.fecha)}</p>
                  </div>
                  {dias !== null && (
                    <div className="text-right">
                      {vencido && <span className="chip chip-red text-[10px]">VENCIDO</span>}
                      {proximo && <span className="chip chip-amber text-[10px]">{dias}d</span>}
                      {ok && <span className="chip chip-green text-[10px]">Vigente</span>}
                    </div>
                  )}
                  {dias === null && <span className="text-[10px] text-gris">Sin fecha</span>}
                </div>
              )
            })}
          </div>
        </div>

        {/* Cargas recientes */}
        {v.cargas.length > 0 && (
          <div className="py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-2">
              Cargas de combustible
            </p>
            <div className="space-y-1.5">
              {v.cargas.slice(0, 4).map(c => (
                <div key={c.id} className="bg-tierra rounded-lg p-2 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-carbon">{formatDate(c.fecha)}</p>
                    <p className="text-[10px] text-gris">
                      {c.litros}L{c.km ? ' · ' + formatKm(c.km) : ''}{c.estacion ? ' · ' + c.estacion : ''}
                    </p>
                  </div>
                  <p className="text-xs font-semibold text-carbon">{formatUSD(c.costo)}</p>
                </div>
              ))}
            </div>
            {kmTotal > 0 && (
              <p className="text-[10px] text-gris mt-2">
                Total cargado: {kmTotal.toLocaleString()} L
              </p>
            )}
          </div>
        )}

        {/* Datos técnicos */}
        {(v.chasis || v.consumo_promedio) && (
          <div className="py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-2">Datos técnicos</p>
            <div className="space-y-1.5">
              {v.chasis && (
                <div className="bg-tierra rounded-lg p-2">
                  <p className="text-[10px] text-gris">Chasis</p>
                  <p className="text-xs font-mono font-medium text-carbon">{v.chasis}</p>
                </div>
              )}
              {v.consumo_promedio && (
                <div className="bg-tierra rounded-lg p-2">
                  <p className="text-[10px] text-gris">Consumo promedio</p>
                  <p className="text-xs font-medium text-carbon">{v.consumo_promedio} L/100km</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Observaciones */}
        {v.observaciones && (
          <div className="py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-2">Observaciones</p>
            <p className="text-xs text-carbon bg-tierra rounded-lg p-2">{v.observaciones}</p>
          </div>
        )}

        {/* Ultima carga */}
        {ultimaCarga && (
          <div className="pt-4">
            <div className="flex items-center gap-1.5 text-xs text-gris bg-tierra rounded-lg px-3 py-2">
              <Fuel size={11} className="flex-shrink-0"/>
              Última carga: {formatDate(ultimaCarga.fecha)} — {ultimaCarga.litros}L
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Formulario nuevo vehiculo ─────────────────────────────────────────────────
function FormNuevoVehiculo({
  establecimientoId,
  onClose,
  onSuccess,
}: {
  establecimientoId: string
  onClose: () => void
  onSuccess: (v: Vehiculo) => void
}) {
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState<TipoVehiculo>('Camioneta')
  const [estado, setEstado] = useState<EstadoVehiculo>('Operativo')
  const [marca, setMarca] = useState('')
  const [modelo, setModelo] = useState('')
  const [ano, setAno] = useState('')
  const [patente, setPatente] = useState('')
  const [chasis, setChasis] = useState('')
  const [km, setKm] = useState('0')
  const [consumoPromedio, setConsumoPromedio] = useState('')
  const [capacidadTanque, setCapacidadTanque] = useState('')
  const [asignadoA, setAsignadoA] = useState('')
  const [vtvVencimiento, setVtvVencimiento] = useState('')
  const [seguroVencimiento, setSeguroVencimiento] = useState('')
  const [patenteVencimiento, setPatenteVencimiento] = useState('')
  const [observaciones, setObservaciones] = useState('')

  const [saving, setSaving] = useState(false)

  const inputCls = 'w-full text-sm border border-borde rounded-lg px-3 py-2 outline-none focus:border-verde focus:ring-1 focus:ring-verde/20 bg-white text-carbon placeholder:text-gris'

  async function handleSave() {
    if (!nombre.trim()) { toast.error('El nombre es obligatorio.'); return }

    setSaving(true)
    try {
      const supabase = createClient()
      const id = crypto.randomUUID()

      const { error: dbError } = await supabase.from('vehiculos').insert({
        id,
        establecimiento_id: establecimientoId,
        nombre: nombre.trim(),
        tipo,
        estado,
        marca: marca.trim() || null,
        modelo: modelo.trim() || null,
        ano: ano ? Number(ano) : null,
        patente: patente.trim() || null,
        chasis: chasis.trim() || null,
        km: Number(km) || 0,
        consumo_promedio: consumoPromedio ? Number(consumoPromedio) : null,
        capacidad_tanque: capacidadTanque ? Number(capacidadTanque) : null,
        asignado_a: asignadoA.trim() || null,
        vtv_vencimiento: vtvVencimiento || null,
        seguro_vencimiento: seguroVencimiento || null,
        patente_vencimiento: patenteVencimiento || null,
        observaciones: observaciones.trim() || null,
      })

      if (dbError) {
        toast.error('Error al guardar: ' + dbError.message)
        return
      }

      toast.success('Vehículo guardado correctamente')
      onSuccess({
        id,
        nombre: nombre.trim(),
        tipo,
        estado,
        marca: marca.trim() || undefined,
        modelo: modelo.trim() || undefined,
        ano: ano ? Number(ano) : undefined,
        patente: patente.trim() || undefined,
        chasis: chasis.trim() || undefined,
        km: Number(km) || 0,
        consumo_promedio: consumoPromedio ? Number(consumoPromedio) : undefined,
        capacidad_tanque: capacidadTanque ? Number(capacidadTanque) : undefined,
        asignado_a: asignadoA.trim() || undefined,
        vtv_vencimiento: vtvVencimiento || undefined,
        seguro_vencimiento: seguroVencimiento || undefined,
        patente_vencimiento: patenteVencimiento || undefined,
        observaciones: observaciones.trim() || undefined,
        cargas: [],
      })
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
            <h2 className="text-sm font-semibold text-white">Nuevo vehículo</h2>
            <p className="text-xs text-white/60 mt-0.5">Completá los datos del vehículo</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white"><X size={16}/></button>
        </div>

        <div className="p-5 space-y-4">

          {/* Nombre */}
          <div>
            <label className="block text-xs font-medium text-carbon mb-1.5">Nombre *</label>
            <input value={nombre} onChange={e => setNombre(e.target.value)}
              placeholder="Toyota Hilux blanca, Camión Iveco..."
              className={inputCls}/>
          </div>

          {/* Tipo, Estado */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-carbon mb-1.5">Tipo *</label>
              <select value={tipo} onChange={e => setTipo(e.target.value as TipoVehiculo)} className={inputCls}>
                {(['Camioneta','Camion','Acoplado','Utilitario','Auto','Moto'] as TipoVehiculo[]).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-carbon mb-1.5">Estado *</label>
              <select value={estado} onChange={e => setEstado(e.target.value as EstadoVehiculo)} className={inputCls}>
                {(['Operativo','En taller','Fuera de servicio'] as EstadoVehiculo[]).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Marca, Modelo, Año */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-carbon mb-1.5">Marca</label>
              <input value={marca} onChange={e => setMarca(e.target.value)}
                placeholder="Toyota" className={inputCls}/>
            </div>
            <div>
              <label className="block text-xs font-medium text-carbon mb-1.5">Modelo</label>
              <input value={modelo} onChange={e => setModelo(e.target.value)}
                placeholder="Hilux" className={inputCls}/>
            </div>
            <div>
              <label className="block text-xs font-medium text-carbon mb-1.5">Año</label>
              <input type="number" value={ano} onChange={e => setAno(e.target.value)}
                min="1950" max="2100" placeholder="2022" className={inputCls}/>
            </div>
          </div>

          {/* Patente, Chasis, KM */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-carbon mb-1.5">Patente</label>
              <input value={patente} onChange={e => setPatente(e.target.value)}
                placeholder="AB123CD" className={inputCls}/>
            </div>
            <div>
              <label className="block text-xs font-medium text-carbon mb-1.5">Chasis</label>
              <input value={chasis} onChange={e => setChasis(e.target.value)}
                placeholder="VIN..." className={inputCls}/>
            </div>
            <div>
              <label className="block text-xs font-medium text-carbon mb-1.5">KM actuales</label>
              <input type="number" value={km} onChange={e => setKm(e.target.value)}
                min="0" placeholder="0" className={inputCls}/>
            </div>
          </div>

          {/* Combustible */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-carbon mb-1.5">Consumo prom. (L/100km)</label>
              <input type="number" value={consumoPromedio} onChange={e => setConsumoPromedio(e.target.value)}
                min="0" step="0.1" placeholder="10.0" className={inputCls}/>
            </div>
            <div>
              <label className="block text-xs font-medium text-carbon mb-1.5">Cap. tanque (L)</label>
              <input type="number" value={capacidadTanque} onChange={e => setCapacidadTanque(e.target.value)}
                min="0" placeholder="70" className={inputCls}/>
            </div>
          </div>

          {/* Asignado */}
          <div>
            <label className="block text-xs font-medium text-carbon mb-1.5">Asignado a</label>
            <input value={asignadoA} onChange={e => setAsignadoA(e.target.value)}
              placeholder="Nombre del conductor o área"
              className={inputCls}/>
          </div>

          {/* Documentación */}
          <div className="border border-borde rounded-xl p-3 space-y-3 bg-tierra/30">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gris">Documentación</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-carbon mb-1.5">Venc. VTV</label>
                <input type="date" value={vtvVencimiento} onChange={e => setVtvVencimiento(e.target.value)} className={inputCls}/>
              </div>
              <div>
                <label className="block text-xs font-medium text-carbon mb-1.5">Venc. Seguro</label>
                <input type="date" value={seguroVencimiento} onChange={e => setSeguroVencimiento(e.target.value)} className={inputCls}/>
              </div>
              <div>
                <label className="block text-xs font-medium text-carbon mb-1.5">Venc. Patente</label>
                <input type="date" value={patenteVencimiento} onChange={e => setPatenteVencimiento(e.target.value)} className={inputCls}/>
              </div>
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
            {saving ? 'Guardando...' : 'Guardar vehículo'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Pagina principal ───────────────────────────────────────────────────────────
export default function Flota() {
  const { establecimiento } = useEstablecimiento()
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [loadingVeh, setLoadingVeh] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [seleccionado, setSeleccionado] = useState<Vehiculo | null>(null)

  useEffect(() => {
    if (!establecimiento?.id) return
    let cancelled = false

    async function cargar() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('vehiculos')
        .select('*, cargas_combustible_vehiculos(*)')
        .eq('establecimiento_id', establecimiento!.id)
        .order('nombre')

      if (cancelled) return
      if (error) {
        console.error('[Flota] Error al cargar:', error.message)
        setLoadingVeh(false)
        return
      }

      const mapped: Vehiculo[] = (data ?? []).map(v => {
        const cargas = ((v.cargas_combustible_vehiculos ?? []) as Record<string, unknown>[])
          .map(c => ({
            id: c.id as string,
            fecha: c.fecha as string,
            litros: Number(c.litros),
            km: c.km != null ? Number(c.km) : undefined,
            costo: Number(c.costo),
            estacion: c.estacion as string | undefined ?? undefined,
          }))
          .sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)))

        return {
          id: v.id as string,
          nombre: v.nombre as string,
          tipo: v.tipo as TipoVehiculo,
          estado: v.estado as EstadoVehiculo,
          marca: v.marca ?? undefined,
          modelo: v.modelo ?? undefined,
          ano: v.ano ?? undefined,
          patente: v.patente ?? undefined,
          chasis: v.chasis ?? undefined,
          km: Number(v.km),
          consumo_promedio: v.consumo_promedio != null ? Number(v.consumo_promedio) : undefined,
          combustible_actual: v.combustible_actual != null ? Number(v.combustible_actual) : undefined,
          capacidad_tanque: v.capacidad_tanque != null ? Number(v.capacidad_tanque) : undefined,
          asignado_a: v.asignado_a ?? undefined,
          vtv_vencimiento: v.vtv_vencimiento ?? undefined,
          seguro_vencimiento: v.seguro_vencimiento ?? undefined,
          patente_vencimiento: v.patente_vencimiento ?? undefined,
          observaciones: v.observaciones ?? undefined,
          cargas,
        }
      })

      setVehiculos(mapped)
      setLoadingVeh(false)
    }

    cargar()
    return () => { cancelled = true }
  }, [establecimiento?.id])

  function handleSuccess(v: Vehiculo) {
    setVehiculos(prev => [...prev, v].sort((a, b) => a.nombre.localeCompare(b.nombre)))
    setMostrarForm(false)
    setSeleccionado(v)
  }

  // KPIs
  const operativos = vehiculos.filter(v => v.estado === 'Operativo').length
  const enTaller = vehiculos.filter(v => v.estado === 'En taller').length
  const alertasDocs = vehiculos.filter(v => {
    const docs = [v.vtv_vencimiento, v.seguro_vencimiento, v.patente_vencimiento]
    return docs.some(d => { const dias = diasHasta(d); return dias !== null && dias < 30 })
  }).length
  const kmPromedio = vehiculos.length > 0
    ? Math.round(vehiculos.reduce((acc, v) => acc + v.km, 0) / vehiculos.length)
    : 0

  const actions = (
    <button
      onClick={() => setMostrarForm(true)}
      className="flex items-center gap-1.5 text-xs font-semibold bg-verde-act text-white px-3 py-1.5 rounded-lg hover:bg-verde transition-colors">
      <Plus size={13}/> Nuevo vehículo
    </button>
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Flota" actions={actions}/>

      {mostrarForm && establecimiento && (
        <FormNuevoVehiculo
          establecimientoId={establecimiento.id}
          onClose={() => setMostrarForm(false)}
          onSuccess={handleSuccess}
        />
      )}

      <div className="flex-1 overflow-y-auto p-4">

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-2.5 mb-4">
          <div className="bg-white border border-borde rounded-xl p-3 border-t-2 border-t-verde-ac">
            <div className="text-[10px] text-gris mb-1 uppercase tracking-wide font-medium">Total vehículos</div>
            <div className="text-xl font-semibold text-carbon">{vehiculos.length}</div>
            <div className="text-[10px] text-gris">{operativos} operativos · {enTaller} en taller</div>
          </div>
          <div className="bg-white border border-borde rounded-xl p-3 border-t-2 border-t-verde-ac">
            <div className="text-[10px] text-gris mb-1 uppercase tracking-wide font-medium">Operativos</div>
            <div className="text-xl font-semibold text-verde">{operativos}</div>
            <div className="text-[10px] text-gris">disponibles ahora</div>
          </div>
          <div className={"bg-white border border-borde rounded-xl p-3 border-t-2 " +
            (alertasDocs > 0 ? 'border-t-rojo' : 'border-t-verde-ac')}>
            <div className="text-[10px] text-gris mb-1 uppercase tracking-wide font-medium flex items-center gap-1">
              {alertasDocs > 0 && <AlertTriangle size={11} className="text-rojo"/>} Alertas docs
            </div>
            <div className={"text-xl font-semibold " + (alertasDocs > 0 ? 'text-rojo' : 'text-verde')}>
              {alertasDocs}
            </div>
            <div className="text-[10px] text-gris">VTV, seguro o patente próx.</div>
          </div>
          <div className="bg-white border border-borde rounded-xl p-3 border-t-2 border-t-azul">
            <div className="text-[10px] text-gris mb-1 uppercase tracking-wide font-medium">KM promedio</div>
            <div className="text-xl font-semibold text-azul">
              {vehiculos.length > 0 ? formatKm(kmPromedio) : '—'}
            </div>
            <div className="text-[10px] text-gris">flota completa</div>
          </div>
        </div>

        {/* Contenido */}
        {loadingVeh ? (
          <div className="bg-white border border-borde rounded-xl flex items-center justify-center py-12">
            <p className="text-sm text-gris">Cargando flota...</p>
          </div>
        ) : vehiculos.length === 0 ? (
          <div className="bg-white border border-borde rounded-xl flex flex-col items-center justify-center py-16 text-center">
            <Car size={36} className="text-borde mb-3"/>
            <p className="text-sm font-medium text-carbon mb-1">Todavía no hay vehículos registrados</p>
            <p className="text-xs text-gris">Registrá tu primer vehículo con el botón "Nuevo vehículo"</p>
          </div>
        ) : (
          <div className={"grid gap-4 " + (seleccionado ? 'grid-cols-[1fr_320px]' : 'grid-cols-1')}>
            {/* Grilla de vehiculos */}
            <div className={"grid gap-3 " + (seleccionado ? 'grid-cols-2' : 'grid-cols-3')}>
              {vehiculos.map(v => {
                const alertaDocs = [v.vtv_vencimiento, v.seguro_vencimiento, v.patente_vencimiento]
                  .some(d => { const dias = diasHasta(d); return dias !== null && dias < 30 })

                return (
                  <div key={v.id}
                    onClick={() => setSeleccionado(seleccionado?.id === v.id ? null : v)}
                    className={"bg-white border rounded-xl p-3.5 cursor-pointer transition-all hover:shadow-md " +
                      (seleccionado?.id === v.id ? 'border-verde-act bg-verde-s' : 'border-borde hover:border-gris')}>
                    <div className="flex items-start gap-2.5 mb-3">
                      <div className="w-9 h-9 rounded-xl bg-verde-s border border-verde/20 flex items-center justify-center flex-shrink-0 text-verde">
                        {getTipoIcon(v.tipo)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-carbon truncate">{v.nombre}</p>
                        <p className="text-[10px] text-gris mt-0.5">
                          {[v.marca, v.modelo].filter(Boolean).join(' ') || v.tipo}
                          {v.patente ? ' · ' + v.patente : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-2">
                      <span className={getEstadoChip(v.estado)}>{v.estado}</span>
                      {alertaDocs && (
                        <AlertTriangle size={13} className="text-rojo"/>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-gris">
                      <FileText size={11}/>
                      <span className="font-medium text-carbon">{formatKm(v.km)}</span>
                      {v.ano && <span>· {v.ano}</span>}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Panel detalle */}
            {seleccionado && (
              <PanelDetalleVehiculo v={seleccionado} onClose={() => setSeleccionado(null)}/>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
