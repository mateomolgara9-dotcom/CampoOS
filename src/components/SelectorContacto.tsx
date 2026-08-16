'use client'
import { useState, useEffect, useId } from 'react'
import { createClient } from '@/lib/supabase'

/**
 * Input de nombre/razón social que autocompleta desde el módulo Contactos
 * del establecimiento. Sugiere los contactos existentes para evitar duplicados
 * y tipeos, pero permite texto libre si el nombre no está cargado todavía.
 */
export default function SelectorContacto({ establecimientoId, valor, onChange, placeholder, className }: {
  establecimientoId: string
  valor: string
  onChange: (nombre: string) => void
  placeholder?: string
  className?: string
}) {
  const [nombres, setNombres] = useState<string[]>([])
  const listId = useId()

  useEffect(() => {
    if (!establecimientoId) return
    let cancel = false
    ;(async () => {
      const supabase = createClient()
      const { data } = await supabase.from('contactos')
        .select('nombre, razon_social')
        .eq('establecimiento_id', establecimientoId)
        .order('nombre')
      if (cancel) return
      const set = new Set<string>()
      for (const c of (data ?? []) as { nombre?: string; razon_social?: string | null }[]) {
        if (c.nombre) set.add(c.nombre)
        if (c.razon_social) set.add(c.razon_social)
      }
      setNombres(Array.from(set))
    })()
    return () => { cancel = true }
  }, [establecimientoId])

  return (
    <>
      <input list={listId} value={valor} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} className={className} autoComplete="off" />
      <datalist id={listId}>
        {nombres.map(n => <option key={n} value={n} />)}
      </datalist>
    </>
  )
}
