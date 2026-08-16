'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Search, Plus, Check, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { useEstablecimiento } from '@/hooks/useEstablecimiento'

/**
 * Selector conectado a la ÚNICA base de contactos (tu directorio de gente:
 * productores, clientes, proveedores, contratistas — todos juntos).
 * No permite texto libre: elegís uno registrado o lo registrás al vuelo.
 * La misma base se usa en Ventas, Compras y Cuaderno.
 */
export default function SelectorContacto({ valor, onChange, placeholder, className }: {
  valor: string
  onChange: (nombre: string, contactoId: string | null) => void
  placeholder?: string
  className?: string
}) {
  const { productores, userId, refrescar } = useEstablecimiento()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [creando, setCreando] = useState(false)

  const query = q.trim().toLowerCase()
  const filtrados = productores.filter(c => c.nombre.toLowerCase().includes(query))
  const existeExacto = productores.some(c => c.nombre.toLowerCase() === query)

  function elegir(c: { id: string; nombre: string }) {
    onChange(c.nombre, c.id); setOpen(false); setQ('')
  }

  async function registrar() {
    const nombre = q.trim()
    if (!nombre || !userId) return
    setCreando(true)
    try {
      const supabase = createClient()
      const id = crypto.randomUUID()
      const { error } = await supabase.from('productores').insert({ id, asesor_id: userId, nombre })
      if (error) throw error
      await refrescar()
      onChange(nombre, id)
      setOpen(false); setQ('')
      toast.success('Contacto registrado')
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? 'error desconocido'
      console.error('[SelectorContacto] registrar:', err)
      toast.error(`No se pudo registrar: ${msg}`)
    } finally {
      setCreando(false)
    }
  }

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className={(className ?? '') + ' flex items-center justify-between gap-2 text-left'}>
        <span className={'truncate ' + (valor ? 'text-carbon' : 'text-gris')}>{valor || placeholder || 'Elegí o registrá…'}</span>
        <ChevronDown size={14} className="text-gris flex-shrink-0" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-borde rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
            <div className="p-2 sticky top-0 bg-white border-b border-borde">
              <div className="flex items-center gap-2 border border-borde rounded-lg px-2 py-1.5">
                <Search size={13} className="text-gris flex-shrink-0" />
                <input autoFocus value={q} onChange={e => setQ(e.target.value)}
                  placeholder="Buscar o escribir para registrar…"
                  className="text-xs outline-none flex-1 bg-transparent text-carbon" />
              </div>
            </div>

            {filtrados.map(c => (
              <button key={c.id} type="button" onClick={() => elegir(c)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs hover:bg-tierra transition-colors">
                {valor === c.nombre ? <Check size={13} className="text-verde-act flex-shrink-0" /> : <span className="w-[13px] flex-shrink-0" />}
                <span className="truncate text-carbon">{c.nombre}</span>
              </button>
            ))}

            {query && !existeExacto && (
              <button type="button" onClick={registrar} disabled={creando}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs font-medium text-verde-act hover:bg-verde-s border-t border-borde disabled:opacity-60">
                <Plus size={13} className="flex-shrink-0" /> {creando ? 'Registrando…' : <>Registrar &ldquo;{q.trim()}&rdquo;</>}
              </button>
            )}

            {filtrados.length === 0 && !query && (
              <div className="px-3 py-3 text-xs text-gris">Escribí para buscar o registrar un contacto.</div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
