'use client'
import { useState, useEffect } from 'react'
import { Search, Plus, RefreshCw, Upload } from 'lucide-react'
import Topbar from '@/components/Topbar'
import { createClient } from '@/lib/supabase'
import { useEstablecimiento } from '@/hooks/useEstablecimiento'
import type { Animal, Categoria, EstadoSanitario } from '@/types'
import toast from 'react-hot-toast'
import dynamic from 'next/dynamic'
import type { ColumnDef } from '@/components/ImportExcelModal'
const ImportExcelModal = dynamic(() => import('@/components/ImportExcelModal'), { ssr: false })

const CATEGORIAS: Categoria[] = ['Vaca', 'Toro', 'Novillo', 'Vaquillona', 'Ternero', 'Ternera']
const ESTADOS: EstadoSanitario[] = ['Al día', 'Vacuna vencida', 'Vacuna próxima', 'Sin RFID']

// ── Config de importación Excel ───────────────────────────────────────────────
const IMPORT_COLUMNS: ColumnDef[] = [
  { key: 'caravana',         header: 'Caravana',            required: true,  type: 'string' },
  { key: 'categoria',        header: 'Categoria',            required: true,  type: 'enum',    enumValues: ['Vaca', 'Toro', 'Novillo', 'Vaquillona', 'Ternero', 'Ternera'] },
  { key: 'raza',             header: 'Raza',                required: false, type: 'string' },
  { key: 'potrero',          header: 'Potrero',             required: false, type: 'string' },
  { key: 'peso_actual',      header: 'Peso (kg)',           required: false, type: 'number' },
  { key: 'estado_sanitario', header: 'Estado Sanitario',    required: false, type: 'enum',    enumValues: ['Al día', 'Vacuna vencida', 'Vacuna próxima', 'Sin RFID'] },
  { key: 'tiene_rfid',       header: 'Tiene RFID (SI/NO)',  required: false, type: 'boolean' },
]

const IMPORT_EXAMPLES: unknown[][] = [
  ['AR-1001', 'Vaca',    'Angus',    'Norte', 380, 'Al día',          'SI'],
  ['AR-1002', 'Toro',    'Hereford', 'Sur',   550, 'Al día',          'NO'],
  ['AR-1003', 'Ternero', '',         'Norte', 120, 'Vacuna próxima',  'SI'],
]

const ANIMAL_SELECT = 'id, caravana, categoria, raza, potrero, peso_actual, gdp, estado_sanitario, tiene_rfid, created_at'

function getSanChip(san: EstadoSanitario) {
  if (san === 'Vacuna vencida') return 'chip chip-red'
  if (san === 'Vacuna próxima') return 'chip chip-amber'
  if (san === 'Sin RFID') return 'chip chip-amber'
  return 'chip chip-green'
}

function getCatChip(cat: Categoria) {
  if (cat === 'Novillo') return 'chip chip-blue'
  if (cat === 'Ternero' || cat === 'Vaquillona' || cat === 'Ternera') return 'chip chip-amber'
  return 'chip chip-green'
}

function FormNuevoAnimal({ establecimientoId, onClose, onSave }: {
  establecimientoId: string
  onClose: () => void
  onSave: (a: Animal) => void
}) {
  const [form, setForm] = useState({
    caravana: '',
    categoria: 'Vaca' as Categoria,
    raza: '',
    potrero: '',
    peso_actual: '',
    estado_sanitario: 'Al día' as EstadoSanitario,
    tiene_rfid: false,
  })
  const [guardando, setGuardando] = useState(false)

  function validate(): string | null {
    if (!form.caravana.trim()) return 'La caravana es obligatoria'
    if (form.caravana.length > 50) return 'La caravana no puede superar 50 caracteres'
    if (form.raza.length > 50) return 'La raza no puede superar 50 caracteres'
    if (form.potrero.length > 100) return 'El potrero no puede superar 100 caracteres'
    if (form.peso_actual !== '') {
      const peso = Number(form.peso_actual)
      if (isNaN(peso) || peso <= 0) return 'El peso debe ser un número positivo'
      if (peso > 2000) return 'El peso no puede superar 2.000 kg'
    }
    return null
  }

  async function handleSave() {
    const validationError = validate()
    if (validationError) { toast.error(validationError); return }
    setGuardando(true)
    try {
      const supabase = createClient()
      const { data, error: err } = await supabase
        .from('animales')
        .insert([{
          establecimiento_id: establecimientoId,
          caravana: form.caravana.trim(),
          categoria: form.categoria,
          raza: form.raza.trim() || null,
          potrero: form.potrero.trim() || null,
          peso_actual: form.peso_actual ? Number(form.peso_actual) : null,
          estado_sanitario: form.estado_sanitario,
          tiene_rfid: form.tiene_rfid,
        }])
        .select(ANIMAL_SELECT)
        .single()

      if (err) throw err
      toast.success('Animal guardado correctamente')
      onSave(data as Animal)
    } catch (err) {
      console.error('[Animales] Error al guardar:', err)
      toast.error('No se pudo guardar el animal. Verificá tu conexión e intentá de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  const inp = 'w-full text-xs border border-borde rounded-lg px-3 py-2 bg-white text-carbon outline-none focus:border-verde-act transition-colors'
  const lbl = 'text-[10px] font-semibold uppercase tracking-wider text-gris mb-1 block'

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      role="dialog" aria-modal="true" aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-verde px-5 py-4 flex items-center justify-between">
          <div>
            <p id="modal-title" className="text-sm font-semibold text-white">Nuevo animal</p>
            <p className="text-xs text-white/60 mt-0.5">Se guarda en la base de datos</p>
          </div>
          <button onClick={onClose} aria-label="Cerrar formulario" className="text-white/60 hover:text-white text-lg">✕</button>
        </div>
        <div className="p-5 grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className={lbl}>Caravana *</label>
            <input className={inp} placeholder="ej. AR-9001" maxLength={50}
              value={form.caravana} onChange={e => setForm({ ...form, caravana: e.target.value })} />
          </div>
          <div>
            <label className={lbl}>Categoría *</label>
            <select className={inp} value={form.categoria}
              onChange={e => setForm({ ...form, categoria: e.target.value as Categoria })}>
              {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Raza</label>
            <input className={inp} placeholder="ej. Angus" maxLength={50}
              value={form.raza} onChange={e => setForm({ ...form, raza: e.target.value })} />
          </div>
          <div>
            <label className={lbl}>Potrero</label>
            <input className={inp} placeholder="ej. Lote Norte" maxLength={100}
              value={form.potrero} onChange={e => setForm({ ...form, potrero: e.target.value })} />
          </div>
          <div>
            <label className={lbl}>Peso actual (kg)</label>
            <input className={inp} type="number" placeholder="0" min="0.1" max="2000" step="0.1"
              value={form.peso_actual} onChange={e => setForm({ ...form, peso_actual: e.target.value })} />
          </div>
          <div>
            <label className={lbl}>Estado sanitario</label>
            <select className={inp} value={form.estado_sanitario}
              onChange={e => setForm({ ...form, estado_sanitario: e.target.value as EstadoSanitario })}>
              {ESTADOS.map(e => <option key={e}>{e}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input type="checkbox" id="rfid" checked={form.tiene_rfid}
              onChange={e => setForm({ ...form, tiene_rfid: e.target.checked })} />
            <label htmlFor="rfid" className="text-xs text-carbon">Tiene caravana RFID</label>
          </div>
        </div>
        <div className="px-5 py-4 border-t border-borde flex justify-end gap-2">
          <button onClick={onClose}
            className="text-xs font-medium px-4 py-2 rounded-lg border border-borde text-carbon hover:bg-tierra transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={guardando}
            className="text-xs font-semibold px-4 py-2 rounded-lg bg-verde-act text-white hover:bg-verde transition-colors disabled:opacity-50">
            {guardando ? 'Guardando...' : 'Guardar animal'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Animales() {
  const { establecimiento } = useEstablecimiento()
  const [animales, setAnimales] = useState<Animal[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [sel, setSel] = useState<Animal | null>(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [mostrarImport, setMostrarImport] = useState(false)

  async function cargarAnimales() {
    setCargando(true)
    setError('')
    try {
      const supabase = createClient()
      const { data, error: err } = await supabase
        .from('animales')
        .select(ANIMAL_SELECT)
        .order('created_at', { ascending: false })
      if (err) throw err
      const rows = (data as Animal[]) || []
      setAnimales(rows)
      if (rows.length > 0) setSel(rows[0])
    } catch {
      setError('No se pudo cargar la lista de animales. Verificá tu conexión e intentá de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargarAnimales() }, [])

  const filtrados = animales.filter(a =>
    a.caravana.toLowerCase().includes(busqueda.toLowerCase()) ||
    (a.potrero ?? '').toLowerCase().includes(busqueda.toLowerCase()) ||
    a.categoria.toLowerCase().includes(busqueda.toLowerCase())
  )

  function handleSave(nuevo: Animal) {
    setAnimales(prev => [nuevo, ...prev])
    setSel(nuevo)
    setMostrarForm(false)
  }

  const animalesConPeso = animales.filter(a => a.peso_actual)
  const pesoPromedio = animalesConPeso.length > 0
    ? Math.round(animalesConPeso.reduce((acc, a) => acc + (a.peso_actual ?? 0), 0) / animalesConPeso.length)
    : null

  const actions = (
    <div className="flex gap-2">
      <button onClick={cargarAnimales}
        className="flex items-center gap-1.5 text-xs font-medium border border-borde bg-white text-carbon px-3 py-1.5 rounded-lg hover:bg-tierra transition-colors">
        <RefreshCw size={12} /> Actualizar
      </button>
      <button
        onClick={() => setMostrarImport(true)}
        disabled={!establecimiento}
        className="flex items-center gap-1.5 text-xs font-medium border border-borde bg-white text-carbon px-3 py-1.5 rounded-lg hover:bg-tierra transition-colors disabled:opacity-60">
        <Upload size={12}/> Importar Excel
      </button>
      <button onClick={() => setMostrarForm(true)}
        disabled={!establecimiento}
        className="flex items-center gap-1.5 text-xs font-semibold bg-verde-act text-white px-3 py-1.5 rounded-lg hover:bg-verde transition-colors disabled:opacity-60">
        <Plus size={13} /> Nuevo animal
      </button>
    </div>
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {mostrarImport && establecimiento && (
        <ImportExcelModal
          entityName="animales"
          entityLabel="Animales"
          tableName="animales"
          columns={IMPORT_COLUMNS}
          exampleRows={IMPORT_EXAMPLES}
          establecimientoId={establecimiento.id}
          onClose={() => setMostrarImport(false)}
          onSuccess={() => cargarAnimales()}
        />
      )}
      {mostrarForm && establecimiento && (
        <FormNuevoAnimal
          establecimientoId={establecimiento.id}
          onClose={() => setMostrarForm(false)}
          onSave={handleSave}
        />
      )}
      <Topbar title="Gestión animal" actions={actions} />
      <div className="flex-1 overflow-y-auto p-4">

        <div className="grid grid-cols-4 gap-2.5 mb-4">
          {[
            { l: 'Total rodeo',   v: animales.length.toString(),                                                        s: 'animales en base de datos', c: 'border-t-verde-ac' },
            { l: 'Con RFID',      v: animales.filter(a => a.tiene_rfid).length.toString(),                              s: 'identificados',             c: 'border-t-azul'    },
            { l: 'Alertas san.',  v: animales.filter(a => a.estado_sanitario === 'Vacuna vencida').length.toString(),   s: 'vacunas vencidas',          c: 'border-t-rojo'    },
            { l: 'Peso promedio', v: pesoPromedio ? `${pesoPromedio} kg` : '—',                                         s: 'promedio del rodeo',        c: 'border-t-verde-ac'},
          ].map(({ l, v, s, c }) => (
            <div key={l} className={`bg-white border border-borde rounded-xl p-3 border-t-2 ${c}`}>
              <div className="text-[10px] text-gris mb-1 uppercase tracking-wide font-medium">{l}</div>
              <div className="text-xl font-semibold text-carbon">{v}</div>
              <div className="text-[10px] text-gris">{s}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-2 bg-white border border-borde rounded-lg px-3 py-1.5 flex-1 max-w-xs">
            <Search size={13} className="text-gris flex-shrink-0" />
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar caravana, potrero..."
              aria-label="Buscar animales"
              className="text-xs outline-none bg-transparent flex-1 text-carbon placeholder:text-gris" />
          </div>
          <span className="ml-auto text-xs text-gris bg-tierra border border-borde px-3 py-1.5 rounded-lg">
            <strong className="text-carbon">{filtrados.length}</strong> animales
          </span>
        </div>

        {cargando && (
          <div className="bg-white border border-borde rounded-xl p-8 text-center">
            <div className="text-2xl mb-2">⏳</div>
            <p className="text-sm text-gris">Cargando animales...</p>
          </div>
        )}

        {error && (
          <div className="bg-rojo-s border border-rojo rounded-xl p-4 text-xs text-rojo mb-4" role="alert">
            {error}
          </div>
        )}

        {!cargando && !error && (
          <div className="grid grid-cols-[1fr_300px] gap-3 items-start">
            <div className="bg-white border border-borde rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-tierra border-b border-borde">
                    {['Caravana', 'Categoría', 'Potrero', 'Peso', 'GDP', 'Sanidad'].map(h => (
                      <th key={h} className="text-left px-3 py-2 font-medium text-gris">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-borde">
                  {filtrados.map(animal => (
                    <tr key={animal.id}
                      onClick={() => setSel(animal)}
                      className={`cursor-pointer hover:bg-tierra/60 ${sel?.id === animal.id ? 'bg-verde-s' : ''}`}>
                      <td className="px-3 py-2">
                        <span className="font-mono text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                          {animal.caravana}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={getCatChip(animal.categoria)}>{animal.categoria}</span>
                      </td>
                      <td className="px-3 py-2 text-carbon">{animal.potrero ?? '—'}</td>
                      <td className="px-3 py-2 font-medium text-carbon">
                        {animal.peso_actual ? `${animal.peso_actual} kg` : '—'}
                      </td>
                      <td className={`px-3 py-2 font-semibold ${
                        animal.gdp ? (animal.gdp > 0 ? 'text-verde' : 'text-rojo') : 'text-gris'
                      }`}>
                        {animal.gdp ? `${animal.gdp > 0 ? '+' : ''}${animal.gdp}` : '—'}
                      </td>
                      <td className="px-3 py-2">
                        <span className={getSanChip(animal.estado_sanitario)}>{animal.estado_sanitario}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtrados.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-2xl mb-2">🐄</p>
                  <p className="text-sm font-medium text-carbon mb-1">No hay animales</p>
                  <p className="text-xs text-gris">Agregá el primero con el botón &quot;Nuevo animal&quot;</p>
                </div>
              )}
            </div>

            {sel && (
              <div className="bg-white border border-borde rounded-xl overflow-hidden">
                <div className="bg-verde px-4 py-3">
                  <p className="text-sm font-semibold text-white">{sel.caravana}</p>
                  <p className="text-xs text-white/60 mt-0.5">{sel.categoria} · {sel.potrero ?? 'Sin potrero'}</p>
                  <span className={`mt-2 inline-block ${getSanChip(sel.estado_sanitario)}`}>
                    {sel.estado_sanitario}
                  </span>
                </div>
                <div className="p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-2">Biometría</p>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {[
                      ['Peso actual', sel.peso_actual ? `${sel.peso_actual} kg` : '—'],
                      ['GDP', sel.gdp ? `${sel.gdp > 0 ? '+' : ''}${sel.gdp} kg/d` : '—'],
                      ['Raza', sel.raza ?? '—'],
                      ['Tiene RFID', sel.tiene_rfid ? 'Sí' : 'No'],
                    ].map(([l, v]) => (
                      <div key={l} className="bg-tierra rounded-lg p-2">
                        <p className="text-[10px] text-gris mb-1">{l}</p>
                        <p className="text-sm font-semibold text-carbon">{v}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-gris">
                    Registrado: {new Date(sel.created_at).toLocaleDateString('es-AR')}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
