'use client'
import { useState, useEffect } from 'react'
import { Search, Plus, ShoppingCart, X, Truck, FileText, Package, CheckCircle2, Clock, Trash2 } from 'lucide-react'
import Topbar from '@/components/Topbar'
import { createClient } from '@/lib/supabase'
import { useEstablecimiento } from '@/hooks/useEstablecimiento'

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

type FormItem = { descripcion: string; cantidad: string; unidad: string; precio_unitario: string }

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

function hoy() {
  return new Date().toISOString().split('T')[0]
}

// ── Formulario nueva OC ────────────────────────────────────────────────────────
function FormNuevaOC({
  establecimientoId,
  onClose,
  onSuccess,
}: {
  establecimientoId: string
  onClose: () => void
  onSuccess: (c: Compra) => void
}) {
  const [form, setForm] = useState({
    numero: '',
    fecha: hoy(),
    fecha_entrega: '',
    proveedor: '',
    categoria: 'Agroquimico' as CategoriaCompra,
    estado: 'Borrador' as EstadoOC,
    moneda: 'USD' as 'USD' | 'ARS',
    metodo_pago: 'Transferencia' as Compra['metodo_pago'],
    destino_deposito: '',
    observaciones: '',
  })
  const [items, setItems] = useState<FormItem[]>([
    { descripcion: '', cantidad: '1', unidad: 'unidades', precio_unitario: '' },
  ])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-generar número de OC basado en conteo existente
  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('compras')
      .select('numero', { count: 'exact', head: true })
      .eq('establecimiento_id', establecimientoId)
      .then(({ count }) => {
        const seq = String((count ?? 0) + 1).padStart(4, '0')
        setForm(f => ({ ...f, numero: `OC-${new Date().getFullYear()}-${seq}` }))
      })
  }, [establecimientoId])

  // Totales calculados
  const subtotal = items.reduce((acc, i) =>
    acc + (Number(i.cantidad) || 0) * (Number(i.precio_unitario) || 0), 0)
  const iva = subtotal * 0.21
  const total = subtotal + iva

  function addItem() {
    setItems(prev => [...prev, { descripcion: '', cantidad: '1', unidad: 'unidades', precio_unitario: '' }])
  }
  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }
  function updateItem(idx: number, field: keyof FormItem, val: string) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: val } : item))
  }

  async function handleSave() {
    if (!form.proveedor.trim() || !form.numero.trim()) {
      setError('Completá el proveedor y el número de OC.')
      return
    }
    const validItems = items.filter(i => i.descripcion.trim())
    if (validItems.length === 0) {
      setError('Agregá al menos un ítem a la orden.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const supabase = createClient()
      const compraId = crypto.randomUUID()

      const { error: dbError } = await supabase
        .from('compras')
        .insert({
          id: compraId,
          establecimiento_id: establecimientoId,
          numero: form.numero.trim(),
          fecha: form.fecha,
          fecha_entrega: form.fecha_entrega || null,
          proveedor: form.proveedor.trim(),
          categoria: form.categoria,
          estado: form.estado,
          subtotal,
          iva,
          total,
          moneda: form.moneda,
          metodo_pago: form.metodo_pago,
          destino_deposito: form.destino_deposito.trim() || null,
          observaciones: form.observaciones.trim() || null,
        })

      if (dbError) {
        console.error('[Compras] Error al crear OC:', dbError.message, dbError.code)
        setError(dbError.code === '23505'
          ? `El número "${form.numero}" ya existe. Usá otro número.`
          : 'No se pudo crear la orden. Intentá de nuevo.')
        return
      }

      const { error: itemsError } = await supabase
        .from('items_compra')
        .insert(validItems.map(item => ({
          compra_id: compraId,
          descripcion: item.descripcion.trim(),
          cantidad: Number(item.cantidad) || 1,
          unidad: item.unidad,
          precio_unitario: Number(item.precio_unitario) || 0,
        })))

      if (itemsError) {
        console.error('[Compras] Error al insertar ítems:', itemsError.message)
        await supabase.from('compras').delete().eq('id', compraId)
        setError('Error al guardar los ítems. Intentá de nuevo.')
        return
      }

      onSuccess({
        id: compraId,
        numero: form.numero.trim(),
        fecha: form.fecha,
        fecha_entrega: form.fecha_entrega || undefined,
        proveedor: form.proveedor.trim(),
        categoria: form.categoria,
        estado: form.estado,
        items: validItems.map(item => ({
          descripcion: item.descripcion.trim(),
          cantidad: Number(item.cantidad) || 1,
          unidad: item.unidad,
          precio_unitario: Number(item.precio_unitario) || 0,
        })),
        subtotal,
        iva,
        total,
        moneda: form.moneda,
        metodo_pago: form.metodo_pago,
        destino_deposito: form.destino_deposito.trim() || undefined,
        observaciones: form.observaciones.trim() || undefined,
      })
    } catch (err) {
      console.error('[Compras] Error inesperado:', err)
      setError('Error inesperado. Intentá de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const inp = "w-full text-xs border border-borde rounded-lg px-3 py-2 bg-white text-carbon outline-none focus:border-verde-act transition-colors"
  const lbl = "text-[10px] font-semibold uppercase tracking-wider text-gris mb-1 block"

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <div className="bg-verde px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Nueva orden de compra</p>
            <p className="text-xs text-white/60 mt-0.5">Completá los datos y los ítems</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <X size={18}/>
          </button>
        </div>

        <div className="p-5 max-h-[75vh] overflow-y-auto space-y-4">
          {error && (
            <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Cabecera OC */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Número de OC *</label>
              <input className={inp} value={form.numero}
                onChange={e => setForm({...form, numero: e.target.value})}
                placeholder="OC-2026-0001"/>
            </div>
            <div>
              <label className={lbl}>Fecha *</label>
              <input className={inp} type="date" value={form.fecha}
                onChange={e => setForm({...form, fecha: e.target.value})}/>
            </div>
            <div className="col-span-2">
              <label className={lbl}>Proveedor *</label>
              <input className={inp} placeholder="ej. Agroquimicos Sur S.R.L." value={form.proveedor}
                onChange={e => setForm({...form, proveedor: e.target.value})}/>
            </div>
            <div>
              <label className={lbl}>Categoria *</label>
              <select className={inp} value={form.categoria}
                onChange={e => setForm({...form, categoria: e.target.value as CategoriaCompra})}>
                {(['Agroquimico','Semilla','Fertilizante','Combustible','Veterinario','Servicios','Repuestos','Otro'] as CategoriaCompra[]).map(c =>
                  <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Estado</label>
              <select className={inp} value={form.estado}
                onChange={e => setForm({...form, estado: e.target.value as EstadoOC})}>
                {(['Borrador','Enviada','Confirmada','Recibida','Pagada','Cancelada'] as EstadoOC[]).map(e =>
                  <option key={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Método de pago</label>
              <select className={inp} value={form.metodo_pago}
                onChange={e => setForm({...form, metodo_pago: e.target.value as Compra['metodo_pago']})}>
                {(['Transferencia','Cheque','Cuenta corriente','Tarjeta','Forward']).map(m =>
                  <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Moneda</label>
              <select className={inp} value={form.moneda}
                onChange={e => setForm({...form, moneda: e.target.value as 'USD' | 'ARS'})}>
                <option>USD</option>
                <option>ARS</option>
              </select>
            </div>
            <div>
              <label className={lbl}>Fecha de entrega</label>
              <input className={inp} type="date" value={form.fecha_entrega}
                onChange={e => setForm({...form, fecha_entrega: e.target.value})}/>
            </div>
            <div>
              <label className={lbl}>Destino / depósito</label>
              <input className={inp} placeholder="ej. Deposito principal" value={form.destino_deposito}
                onChange={e => setForm({...form, destino_deposito: e.target.value})}/>
            </div>
          </div>

          {/* Ítems */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className={lbl.replace('mb-1', 'mb-0')}>Ítems *</p>
              <button type="button" onClick={addItem}
                className="flex items-center gap-1 text-[10px] font-semibold text-verde-act hover:text-verde transition-colors">
                <Plus size={11}/> Agregar ítem
              </button>
            </div>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_80px_90px_90px_28px] gap-1.5 items-center">
                  <input className={inp} placeholder="Descripción del ítem" value={item.descripcion}
                    onChange={e => updateItem(idx, 'descripcion', e.target.value)}/>
                  <input className={inp} type="number" placeholder="Cant." value={item.cantidad}
                    onChange={e => updateItem(idx, 'cantidad', e.target.value)}/>
                  <select className={inp} value={item.unidad}
                    onChange={e => updateItem(idx, 'unidad', e.target.value)}>
                    {['litros','kg','unidades','dosis','bolsas','tn','bidon','ha'].map(u => <option key={u}>{u}</option>)}
                  </select>
                  <input className={inp} type="number" step="0.01" placeholder="USD unit." value={item.precio_unitario}
                    onChange={e => updateItem(idx, 'precio_unitario', e.target.value)}/>
                  <button type="button" onClick={() => removeItem(idx)}
                    disabled={items.length === 1}
                    className="flex items-center justify-center text-gris hover:text-rojo transition-colors disabled:opacity-30">
                    <Trash2 size={13}/>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Totales calculados */}
          <div className="bg-tierra rounded-xl p-3 text-xs space-y-1.5">
            <div className="flex justify-between text-gris">
              <span>Subtotal</span>
              <span className="font-medium text-carbon">{formatUSD(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gris">
              <span>IVA 21%</span>
              <span className="font-medium text-carbon">{formatUSD(iva)}</span>
            </div>
            <div className="border-t border-borde pt-1.5 flex justify-between font-semibold">
              <span className="text-carbon">Total</span>
              <span className="text-rojo text-sm">{formatUSD(total)}</span>
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className={lbl}>Observaciones</label>
            <textarea className={inp + " resize-none"} rows={2}
              placeholder="Notas adicionales..." value={form.observaciones}
              onChange={e => setForm({...form, observaciones: e.target.value})}/>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-borde flex justify-end gap-2">
          <button onClick={onClose} disabled={saving}
            className="text-xs font-medium px-4 py-2 rounded-lg border border-borde text-carbon hover:bg-tierra transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving}
            className="text-xs font-semibold px-4 py-2 rounded-lg bg-verde-act text-white hover:bg-verde transition-colors disabled:opacity-60">
            {saving ? 'Guardando...' : 'Crear orden'}
          </button>
        </div>
      </div>
    </div>
  )
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
        {/* Total */}
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

        {/* Pago y entrega */}
        <div className="py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-2">Pago y entrega</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              ['Fecha OC',      formatDate(compra.fecha)],
              ['Entrega',       formatDate(compra.fecha_entrega)],
              ['Método pago',   compra.metodo_pago],
              ['Fecha pago',    formatDate(compra.fecha_pago)],
            ].map(([l, v]) => (
              <div key={l} className="bg-tierra rounded-lg p-2">
                <p className="text-[10px] text-gris mb-0.5">{l}</p>
                <p className="text-xs font-semibold text-carbon">{v}</p>
              </div>
            ))}
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
  const { establecimiento, loading: loadingEst } = useEstablecimiento()
  const [compras, setCompras] = useState<Compra[]>([])
  const [loadingComp, setLoadingComp] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [catFiltro, setCatFiltro] = useState<string>('Todos')
  const [estadoFiltro, setEstadoFiltro] = useState<string>('Todos')
  const [seleccionada, setSeleccionada] = useState<Compra | null>(null)

  useEffect(() => {
    if (!establecimiento?.id) return

    let cancelled = false
    async function cargar() {
      setLoadingComp(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from('compras')
        .select('*, items_compra(*)')
        .eq('establecimiento_id', establecimiento!.id)
        .order('fecha', { ascending: false })

      if (cancelled) return
      if (error) {
        console.error('[Compras] Error al cargar:', error.message)
        setLoadingComp(false)
        return
      }

      const mapped: Compra[] = (data ?? []).map(c => ({
        id: c.id as string,
        numero: c.numero as string,
        fecha: c.fecha as string,
        fecha_entrega: c.fecha_entrega ?? undefined,
        proveedor: c.proveedor as string,
        categoria: c.categoria as CategoriaCompra,
        estado: c.estado as EstadoOC,
        items: (c.items_compra ?? []).map((item: Record<string, unknown>) => ({
          descripcion: item.descripcion as string,
          cantidad: Number(item.cantidad),
          unidad: item.unidad as string,
          precio_unitario: Number(item.precio_unitario),
        })),
        subtotal: Number(c.subtotal),
        iva: Number(c.iva),
        total: Number(c.total),
        moneda: c.moneda as 'USD' | 'ARS',
        metodo_pago: c.metodo_pago as Compra['metodo_pago'],
        fecha_pago: c.fecha_pago ?? undefined,
        numero_factura: c.numero_factura ?? undefined,
        destino_deposito: c.destino_deposito ?? undefined,
        observaciones: c.observaciones ?? undefined,
      }))

      setCompras(mapped)
      setLoadingComp(false)
    }

    cargar()
    return () => { cancelled = true }
  }, [establecimiento?.id])

  const loading = loadingEst || loadingComp

  function handleSuccess(c: Compra) {
    setCompras(prev => [c, ...prev])
    setMostrarForm(false)
    setSeleccionada(c)
  }

  const filtradas = compras.filter(c => {
    const matchBusqueda = c.numero.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.proveedor.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.items.some(i => i.descripcion.toLowerCase().includes(busqueda.toLowerCase()))
    const matchCat = catFiltro === 'Todos' || c.categoria === catFiltro
    const matchEstado = estadoFiltro === 'Todos' || c.estado === estadoFiltro
    return matchBusqueda && matchCat && matchEstado
  })

  // KPIs
  const totalAcumulado = compras
    .filter(c => c.estado !== 'Cancelada' && c.estado !== 'Borrador')
    .reduce((acc, c) => acc + c.total, 0)
  const porPagar = compras
    .filter(c => c.estado === 'Recibida' || c.estado === 'Confirmada' || c.estado === 'Enviada')
    .reduce((acc, c) => acc + c.total, 0)
  const ordenesActivas = compras.filter(c => c.estado === 'Enviada' || c.estado === 'Confirmada').length
  const proveedoresActivos = new Set(compras.filter(c => c.estado !== 'Cancelada').map(c => c.proveedor)).size

  const actions = (
    <div className="flex gap-2">
      <button
        onClick={() => setMostrarForm(true)}
        className="flex items-center gap-1.5 text-xs font-semibold bg-verde-act text-white px-3 py-1.5 rounded-lg hover:bg-verde transition-colors">
        <Plus size={13}/> Nueva orden de compra
      </button>
    </div>
  )

  if (loading) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <Topbar title="Compras" actions={actions}/>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gris">Cargando compras...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {mostrarForm && establecimiento && (
        <FormNuevaOC
          establecimientoId={establecimiento.id}
          onClose={() => setMostrarForm(false)}
          onSuccess={handleSuccess}
        />
      )}
      <Topbar title="Compras" actions={actions}/>
      <div className="flex-1 overflow-y-auto p-4">

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-2.5 mb-4">
          {[
            { l:'Comprado acumulado', v: formatUSD(totalAcumulado),    s:'todas las ordenes activas',  c:'border-t-rojo' },
            { l:'Por pagar',          v: formatUSD(porPagar),           s:'pendientes de pago',          c: porPagar > 0 ? 'border-t-ambar' : 'border-t-verde-ac' },
            { l:'Ordenes activas',    v: ordenesActivas.toString(),     s:'en proceso o por recibir',   c:'border-t-azul' },
            { l:'Proveedores',        v: proveedoresActivos.toString(), s:'distintos en historial',     c:'border-t-verde-ac' },
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
              <button key={c} onClick={() => setCatFiltro(c)}
                className={"text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium " +
                  (catFiltro === c ? 'bg-verde text-white border-verde' : 'bg-white border-borde text-carbon hover:bg-tierra')}>
                {c}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {(['Todos', 'Pagada', 'Recibida', 'Confirmada', 'Enviada', 'Borrador'] as const).map(e => (
              <button key={e} onClick={() => setEstadoFiltro(e)}
                className={"text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium " +
                  (estadoFiltro === e ? 'bg-ambar text-white border-ambar' : 'bg-white border-borde text-carbon hover:bg-tierra')}>
                {e}
              </button>
            ))}
          </div>
          <span className="ml-auto text-xs text-gris bg-tierra border border-borde px-3 py-1.5 rounded-lg">
            <strong className="text-carbon">{filtradas.length}</strong> ordenes
          </span>
        </div>

        {/* Sin compras */}
        {compras.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ShoppingCart size={40} className="text-borde mb-3"/>
            <p className="text-sm font-medium text-carbon mb-1">No hay órdenes de compra</p>
            <p className="text-xs text-gris">Usá el botón <strong>Nueva orden de compra</strong> para registrar la primera compra</p>
          </div>
        ) : (
          <div className={"grid gap-3 " + (seleccionada ? 'grid-cols-[1fr_320px]' : 'grid-cols-1')}>

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
              {filtradas.length === 0 && compras.length > 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ShoppingCart size={32} className="text-borde mb-3"/>
                  <p className="text-sm font-medium text-carbon mb-1">No hay órdenes con ese filtro</p>
                  <p className="text-xs text-gris">Cambia los filtros para ver otras órdenes</p>
                </div>
              )}
            </div>

            {seleccionada && (
              <PanelDetalleCompra compra={seleccionada} onClose={() => setSeleccionada(null)}/>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
