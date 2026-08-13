'use client'
import { useState } from 'react'
import { Plus, X, MapPin, Pencil, ArrowRight, Briefcase, Phone, Mail } from 'lucide-react'
import Topbar from '@/components/Topbar'
import { createClient } from '@/lib/supabase'
import { useEstablecimiento, type Productor } from '@/hooks/useEstablecimiento'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

const inp = 'w-full border border-borde rounded-lg px-3 py-2 text-xs outline-none focus:border-verde-act bg-white'
const lbl = 'text-xs text-gris block mb-1'

// ── Form productor ──────────────────────────────────────────────────────────
function FormProductor({ userId, editar, onClose, onSaved }: {
  userId: string | null
  editar?: Productor
  onClose: () => void
  onSaved: () => void
}) {
  const [nombre,    setNombre]    = useState(editar?.nombre ?? '')
  const [razon,     setRazon]     = useState(editar?.razon_social ?? '')
  const [cuit,      setCuit]      = useState(editar?.cuit ?? '')
  const [telefono,  setTelefono]  = useState(editar?.telefono ?? '')
  const [email,     setEmail]     = useState(editar?.email ?? '')
  const [localidad, setLocalidad] = useState(editar?.localidad ?? '')
  const [provincia, setProvincia] = useState(editar?.provincia ?? '')
  const [saving,    setSaving]    = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) { toast.error('El nombre del productor es obligatorio'); return }
    setSaving(true)
    try {
      const supabase = createClient()
      const payload = {
        nombre:       nombre.trim(),
        razon_social: razon.trim()     || null,
        cuit:         cuit.trim()      || null,
        telefono:     telefono.trim()  || null,
        email:        email.trim()     || null,
        localidad:    localidad.trim() || null,
        provincia:    provincia.trim() || null,
      }
      if (editar) {
        const { error } = await supabase.from('productores').update(payload).eq('id', editar.id)
        if (error) throw error
      } else {
        const id = crypto.randomUUID()
        const { error } = await supabase.from('productores').insert({ id, asesor_id: userId, ...payload })
        if (error) throw error
      }
      toast.success(editar ? 'Productor actualizado' : 'Productor creado')
      onSaved()
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? 'error desconocido'
      console.error('[Productores] Error al guardar:', err)
      toast.error(`No se pudo guardar el productor: ${msg}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-borde sticky top-0 bg-white z-10">
          <h2 className="text-sm font-semibold text-carbon">{editar ? 'Editar productor' : 'Nuevo productor'}</h2>
          <button onClick={onClose} className="text-gris hover:text-carbon"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className={lbl}>Nombre / Razón *</label>
            <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Las del Bianco" className={inp} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Razón social</label>
              <input value={razon} onChange={e => setRazon(e.target.value)} className={inp} />
            </div>
            <div>
              <label className={lbl}>CUIT</label>
              <input value={cuit} onChange={e => setCuit(e.target.value)} placeholder="30-12345678-9" className={inp} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Teléfono</label>
              <input value={telefono} onChange={e => setTelefono(e.target.value)} className={inp} />
            </div>
            <div>
              <label className={lbl}>Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)} className={inp} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Localidad</label>
              <input value={localidad} onChange={e => setLocalidad(e.target.value)} className={inp} />
            </div>
            <div>
              <label className={lbl}>Provincia</label>
              <input value={provincia} onChange={e => setProvincia(e.target.value)} className={inp} />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-borde text-carbon text-xs font-medium py-2 rounded-lg hover:bg-tierra transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-verde-act text-white text-xs font-semibold py-2 rounded-lg hover:bg-verde transition-colors disabled:opacity-60">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Form campo (establecimiento de un productor) ─────────────────────────────
function FormCampo({ productor, onClose, onSaved }: {
  productor: Productor
  onClose: () => void
  onSaved: () => void
}) {
  const [nombre,     setNombre]     = useState('')
  const [provincia,  setProvincia]  = useState('')
  const [superficie, setSuperficie] = useState('')
  const [cuig,       setCuig]       = useState('')
  const [saving,     setSaving]     = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) { toast.error('El nombre del campo es obligatorio'); return }
    const sup = superficie ? Number(superficie) : null
    if (superficie && (isNaN(sup as number) || (sup as number) <= 0)) { toast.error('La superficie debe ser positiva'); return }
    setSaving(true)
    try {
      const supabase = createClient()
      const id = crypto.randomUUID()
      const { error } = await supabase.from('establecimientos').insert({
        id,
        nombre:       nombre.trim(),
        provincia:    provincia.trim() || null,
        superficie:   sup,
        cuig:         cuig.trim() || null,
        productor_id: productor.id,
      })
      if (error) throw error
      toast.success('Campo creado')
      onSaved()
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? 'error desconocido'
      console.error('[Campos] Error al guardar:', err)
      toast.error(`No se pudo crear el campo: ${msg}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-borde">
          <div>
            <h2 className="text-sm font-semibold text-carbon">Nuevo campo</h2>
            <p className="text-[11px] text-gris">Productor: {productor.nombre}</p>
          </div>
          <button onClick={onClose} className="text-gris hover:text-carbon"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className={lbl}>Nombre del campo *</label>
            <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Adelino" className={inp} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Superficie (ha)</label>
              <input type="number" min="0.1" step="0.1" value={superficie} onChange={e => setSuperficie(e.target.value)} placeholder="Ej: 50" className={inp} />
            </div>
            <div>
              <label className={lbl}>Provincia</label>
              <input value={provincia} onChange={e => setProvincia(e.target.value)} className={inp} />
            </div>
          </div>
          <div>
            <label className={lbl}>CUIG (opcional)</label>
            <input value={cuig} onChange={e => setCuig(e.target.value)} className={inp} />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-borde text-carbon text-xs font-medium py-2 rounded-lg hover:bg-tierra transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-verde-act text-white text-xs font-semibold py-2 rounded-lg hover:bg-verde transition-colors disabled:opacity-60">
              {saving ? 'Guardando...' : 'Crear campo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Página principal ────────────────────────────────────────────────────────
export default function ProductoresPage() {
  const { productores, campos, establecimiento, cambiarCampo, refrescar, userId, loading } = useEstablecimiento()
  const router = useRouter()
  const [formProd,  setFormProd]  = useState<{ editar?: Productor } | null>(null)
  const [formCampo, setFormCampo] = useState<Productor | null>(null)

  async function trabajarAca(estId: string) {
    await cambiarCampo(estId)
    toast.success('Campo activo cambiado')
    router.push('/dashboard')
  }

  function onSaved() {
    setFormProd(null)
    setFormCampo(null)
    refrescar()
  }

  const actions = (
    <button onClick={() => setFormProd({})}
      className="flex items-center gap-1.5 text-xs font-semibold bg-verde-act text-white px-3 py-1.5 rounded-lg hover:bg-verde transition-colors">
      <Plus size={13} /> Nuevo productor
    </button>
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {formProd && (
        <FormProductor userId={userId} editar={formProd.editar} onClose={() => setFormProd(null)} onSaved={onSaved} />
      )}
      {formCampo && (
        <FormCampo productor={formCampo} onClose={() => setFormCampo(null)} onSaved={onSaved} />
      )}

      <Topbar title="Productores" actions={actions} />

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <p className="text-sm text-gris">Cargando...</p>
        ) : productores.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Briefcase size={40} className="text-borde mb-3" />
            <p className="text-sm font-medium text-carbon mb-1">Todavía no tenés productores</p>
            <p className="text-xs text-gris mb-4">Creá tu primer productor y después cargale sus campos.</p>
            <button onClick={() => setFormProd({})}
              className="flex items-center gap-1.5 text-xs font-semibold bg-verde-act text-white px-4 py-2 rounded-lg hover:bg-verde transition-colors">
              <Plus size={13} /> Nuevo productor
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {productores.map(prod => {
              const suyos = campos.filter(c => c.productor_id === prod.id)
              const contacto = [prod.telefono, prod.email].filter(Boolean)
              return (
                <div key={prod.id} className="bg-white border border-borde rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-borde flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-carbon truncate">{prod.nombre}</p>
                      <p className="text-[11px] text-gris">
                        {[prod.cuit, prod.localidad, prod.provincia].filter(Boolean).join(' · ') || 'Sin datos'}
                      </p>
                      {contacto.length > 0 && (
                        <div className="flex items-center gap-3 mt-1">
                          {prod.telefono && <span className="flex items-center gap-1 text-[10px] text-gris"><Phone size={10} />{prod.telefono}</span>}
                          {prod.email && <span className="flex items-center gap-1 text-[10px] text-gris"><Mail size={10} />{prod.email}</span>}
                        </div>
                      )}
                    </div>
                    <button onClick={() => setFormProd({ editar: prod })} title="Editar productor"
                      className="text-gris hover:text-carbon flex-shrink-0"><Pencil size={14} /></button>
                  </div>

                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gris">Campos ({suyos.length})</p>
                      <button onClick={() => setFormCampo(prod)}
                        className="flex items-center gap-1 text-[11px] font-medium text-verde-act hover:text-verde">
                        <Plus size={12} /> Nuevo campo
                      </button>
                    </div>
                    {suyos.length === 0 ? (
                      <p className="text-xs text-gris italic py-2">Sin campos cargados.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {suyos.map(c => {
                          const activo = c.id === establecimiento?.id
                          return (
                            <div key={c.id}
                              className={'flex items-center gap-2 rounded-lg border px-3 py-2 ' + (activo ? 'border-verde-act bg-verde-s' : 'border-borde')}>
                              <MapPin size={13} className={activo ? 'text-verde-act' : 'text-gris'} />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-carbon truncate">{c.nombre}</p>
                                <p className="text-[10px] text-gris">{[c.provincia, c.superficie ? `${c.superficie} ha` : null].filter(Boolean).join(' · ')}</p>
                              </div>
                              {activo ? (
                                <span className="text-[10px] font-semibold text-verde-act">Activo</span>
                              ) : (
                                <button onClick={() => trabajarAca(c.id)}
                                  className="flex items-center gap-1 text-[11px] font-medium text-verde-act hover:text-verde">
                                  Trabajar acá <ArrowRight size={12} />
                                </button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
