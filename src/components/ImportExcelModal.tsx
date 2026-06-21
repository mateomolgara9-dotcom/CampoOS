'use client'
import { useState, useRef } from 'react'
import {
  X, Upload, Download, CheckCircle2, AlertTriangle,
  FileSpreadsheet, Loader2, ChevronLeft,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase'
import toast from 'react-hot-toast'

// ── Tipos públicos ─────────────────────────────────────────────────────────────
export type ColumnDef = {
  key: string
  header: string
  required: boolean
  type: 'string' | 'number' | 'boolean' | 'date' | 'enum'
  enumValues?: string[]
}

type ParsedRow = {
  rowNum: number
  raw: Record<string, string>
  data: Record<string, unknown>
  errors: string[]
  valid: boolean
}

export type ImportExcelModalProps = {
  entityName: string       // "animales" — usado en el toast
  entityLabel: string      // "Animales" — usado en la UI
  tableName: string
  columns: ColumnDef[]
  exampleRows: unknown[][]
  establecimientoId: string
  transformRow?: (data: Record<string, unknown>, index: number) => Record<string, unknown>
  onClose: () => void
  onSuccess: (count: number) => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function cellStr(v: unknown): string {
  if (v === null || v === undefined) return ''
  return String(v).trim()
}

function deaccent(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function normalizeEnum(val: string, enumValues: string[]): string | null {
  const v = val.trim()
  if (enumValues.includes(v)) return v
  const m1 = enumValues.find(e => e.toLowerCase() === v.toLowerCase())
  if (m1) return m1
  const m2 = enumValues.find(e => deaccent(e) === deaccent(v))
  return m2 ?? null
}

function parseDate(val: string): string | null {
  const parts = val.trim().split('/')
  if (parts.length !== 3) return null
  const [d, m, y] = parts
  if (!d || !m || !y || y.length !== 4) return null
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

// ── Generación de plantilla ───────────────────────────────────────────────────
function downloadTemplate(
  columns: ColumnDef[],
  exampleRows: unknown[][],
  entityLabel: string,
) {
  const wb = XLSX.utils.book_new()

  // Hoja 1: Datos
  const headers = columns.map(c => c.header)
  const ws = XLSX.utils.aoa_to_sheet([headers, ...exampleRows])
  ws['!cols'] = columns.map(c => ({ wch: Math.max(c.header.length + 4, 20) }))
  XLSX.utils.book_append_sheet(wb, ws, 'Datos')

  // Hoja 2: Instrucciones
  const instrData: unknown[][] = [
    ['Campo', 'Obligatorio', 'Tipo de dato', 'Valores válidos / Formato'],
    ...columns.map(c => [
      c.header,
      c.required ? 'Sí' : 'No',
      c.type === 'enum'    ? 'Texto (valores fijos)' :
      c.type === 'boolean' ? 'SI / NO'               :
      c.type === 'date'    ? 'Fecha'                 :
      c.type === 'number'  ? 'Número'                : 'Texto libre',
      c.type === 'enum'    ? (c.enumValues?.join(', ') ?? '') :
      c.type === 'date'    ? 'DD/MM/AAAA'            :
      c.type === 'boolean' ? 'SI o NO'               : '',
    ]),
  ]
  const wsInstr = XLSX.utils.aoa_to_sheet(instrData)
  wsInstr['!cols'] = [{ wch: 28 }, { wch: 14 }, { wch: 24 }, { wch: 70 }]
  XLSX.utils.book_append_sheet(wb, wsInstr, 'Instrucciones')

  XLSX.writeFile(wb, `plantilla_${entityLabel.toLowerCase().replace(/\s+/g, '_')}.xlsx`)
}

// ── Validación ────────────────────────────────────────────────────────────────
function parseAndValidate(
  rawRows: Record<string, unknown>[],
  columns: ColumnDef[],
): ParsedRow[] {
  return rawRows.map((raw, idx) => {
    const errors: string[] = []
    const data: Record<string, unknown> = {}

    for (const col of columns) {
      const val = cellStr(raw[col.header])

      if (col.required && !val) {
        errors.push(`"${col.header}" es obligatorio`)
        continue
      }
      if (!val) { data[col.key] = null; continue }

      switch (col.type) {
        case 'string':
          data[col.key] = val
          break

        case 'number': {
          const n = parseFloat(val.replace(',', '.'))
          if (isNaN(n) || n < 0)
            errors.push(`"${col.header}" debe ser un número positivo`)
          else
            data[col.key] = n
          break
        }

        case 'boolean': {
          const l = val.toLowerCase()
          if (l === 'si' || l === 'sí')   data[col.key] = true
          else if (l === 'no')             data[col.key] = false
          else errors.push(`"${col.header}" debe ser SI o NO`)
          break
        }

        case 'date': {
          const parsed = parseDate(val)
          if (!parsed) errors.push(`"${col.header}" debe tener formato DD/MM/AAAA`)
          else data[col.key] = parsed
          break
        }

        case 'enum': {
          const norm = normalizeEnum(val, col.enumValues ?? [])
          if (!norm)
            errors.push(`"${col.header}": "${val}" no válido (opciones: ${col.enumValues?.join(', ')})`)
          else
            data[col.key] = norm
          break
        }
      }
    }

    return {
      rowNum: idx + 2,
      raw: Object.fromEntries(
        Object.entries(raw).map(([k, v]) => [k, cellStr(v)])
      ),
      data,
      errors,
      valid: errors.length === 0,
    }
  })
}

// ── Componente ─────────────────────────────────────────────────────────────────
export default function ImportExcelModal({
  entityName, entityLabel, tableName, columns, exampleRows,
  establecimientoId, transformRow, onClose, onSuccess,
}: ImportExcelModalProps) {
  const supabase  = createClient()
  const fileRef   = useRef<HTMLInputElement>(null)

  const [step,        setStep]        = useState<1 | 2>(1)
  const [file,        setFile]        = useState<File | null>(null)
  const [rows,        setRows]        = useState<ParsedRow[]>([])
  const [missingCols, setMissingCols] = useState<string[]>([])
  const [filter,      setFilter]      = useState<'all' | 'valid' | 'error'>('all')
  const [parsing,     setParsing]     = useState(false)
  const [importing,   setImporting]   = useState(false)

  async function handleFile(f: File) {
    setFile(f)
    setParsing(true)
    setMissingCols([])
    setRows([])
    try {
      const buffer = await f.arrayBuffer()
      const wb     = XLSX.read(buffer, { type: 'array', raw: false })
      const ws     = wb.Sheets[wb.SheetNames[0]]
      const all    = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })

      if (all.length === 0) { setStep(2); return }

      // Verificar columnas
      const excelHeaders = Object.keys(all[0])
      const missing = columns.map(c => c.header).filter(h => !excelHeaders.includes(h))
      if (missing.length > 0) {
        setMissingCols(missing)
        setStep(2)
        return
      }

      // Ignorar filas completamente vacías
      const nonEmpty = all.filter(row =>
        columns.some(c => cellStr(row[c.header]) !== '')
      )

      if (nonEmpty.length > 500) {
        toast(`El archivo tiene ${nonEmpty.length} filas — el procesamiento puede demorar unos segundos.`, { icon: '⚠️' })
      }

      setRows(parseAndValidate(nonEmpty, columns))
      setStep(2)
    } catch {
      toast.error('No se pudo leer el archivo. Verificá que sea un .xlsx válido.')
    } finally {
      setParsing(false)
    }
  }

  async function handleImport() {
    const valid = rows.filter(r => r.valid)
    if (valid.length === 0) return
    setImporting(true)
    try {
      const payload = valid.map((r, i) => ({
        id: crypto.randomUUID(),
        establecimiento_id: establecimientoId,
        ...r.data,
        ...(transformRow ? transformRow(r.data, i) : {}),
      }))
      const { error } = await supabase.from(tableName).insert(payload)
      if (error) throw error
      toast.success(`${valid.length} ${entityName} importados correctamente`)
      onSuccess(valid.length)
      onClose()
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? 'error desconocido'
      console.error(`[Import ${tableName}]`, err)
      toast.error(`Error al importar: ${msg}`)
    } finally {
      setImporting(false)
    }
  }

  const validCount = rows.filter(r => r.valid).length
  const errorCount = rows.filter(r => !r.valid).length
  const shownRows: ParsedRow[] =
    filter === 'valid' ? rows.filter(r => r.valid)  :
    filter === 'error' ? rows.filter(r => !r.valid) : rows

  const filters: { id: 'all' | 'valid' | 'error'; label: string; count: number }[] = [
    { id: 'all',   label: 'Todas',       count: rows.length },
    { id: 'valid', label: 'Válidas',     count: validCount  },
    { id: 'error', label: 'Con errores', count: errorCount  },
  ]

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl flex flex-col" style={{ maxHeight: '90vh' }}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-borde flex-shrink-0">
          <div className="flex items-center gap-3">
            <FileSpreadsheet size={18} className="text-verde-act"/>
            <div>
              <h2 className="text-sm font-semibold text-carbon">Importar {entityLabel} desde Excel</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[10px] font-medium ${step === 1 ? 'text-verde-act' : 'text-gris'}`}>
                  1. Subir archivo
                </span>
                <span className="text-[10px] text-gris">→</span>
                <span className={`text-[10px] font-medium ${step === 2 ? 'text-verde-act' : 'text-gris'}`}>
                  2. Validar e importar
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-gris hover:text-carbon"><X size={16}/></button>
        </div>

        {/* ── Contenido ────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">

          {/* Paso 1 */}
          {step === 1 && (
            <div className="p-6 space-y-5">
              <div className="bg-verde-s border border-verde-ac/30 rounded-xl p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-carbon mb-0.5">Paso 1 — Descargá la plantilla</p>
                  <p className="text-[11px] text-gris">Tiene los encabezados correctos, filas de ejemplo e instrucciones de validación.</p>
                </div>
                <button
                  onClick={() => downloadTemplate(columns, exampleRows, entityLabel)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-verde-act border border-verde-ac/40 bg-white px-3 py-2 rounded-lg hover:bg-verde-s transition-colors whitespace-nowrap flex-shrink-0">
                  <Download size={13}/> Descargar plantilla
                </button>
              </div>

              <div>
                <p className="text-xs font-semibold text-carbon mb-2">Paso 2 — Subí el archivo completado</p>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-borde rounded-xl p-10 text-center cursor-pointer hover:border-verde-act hover:bg-verde-s/30 transition-all group">
                  {parsing ? (
                    <Loader2 size={28} className="text-verde-act animate-spin mx-auto mb-2"/>
                  ) : (
                    <Upload size={28} className="text-gris mx-auto mb-2 group-hover:text-verde-act transition-colors"/>
                  )}
                  <p className="text-xs font-medium text-carbon">
                    {parsing ? 'Procesando...' : file ? file.name : 'Hacé click o arrastrá un archivo'}
                  </p>
                  <p className="text-[11px] text-gris mt-0.5">Solo archivos .xlsx o .xls</p>
                  <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}/>
                </div>
              </div>
            </div>
          )}

          {/* Paso 2 */}
          {step === 2 && (
            <div className="p-4 space-y-3">

              {/* Error: columnas faltantes */}
              {missingCols.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-2">
                  <AlertTriangle size={16} className="text-rojo flex-shrink-0 mt-0.5"/>
                  <div>
                    <p className="text-xs font-semibold text-rojo mb-1">El archivo no tiene las columnas requeridas</p>
                    <p className="text-[11px] text-red-700">Faltan: <strong>{missingCols.join(', ')}</strong></p>
                    <p className="text-[11px] text-red-700 mt-1">Descargá la plantilla y completá con esos encabezados exactos.</p>
                  </div>
                </div>
              )}

              {/* Sin filas */}
              {missingCols.length === 0 && rows.length === 0 && (
                <div className="text-center py-12">
                  <FileSpreadsheet size={32} className="text-gris mx-auto mb-2 opacity-40"/>
                  <p className="text-sm text-gris">No se encontraron filas de datos en el archivo.</p>
                </div>
              )}

              {/* Resultados */}
              {missingCols.length === 0 && rows.length > 0 && (
                <>
                  {/* Resumen */}
                  <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
                    errorCount === 0 ? 'bg-verde-s border-verde-ac/30' : 'bg-ambar-s border-ambar/30'
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-verde-act"/>
                        <span className="text-xs font-semibold text-verde-act">{validCount} filas válidas</span>
                      </div>
                      {errorCount > 0 && (
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle size={14} className="text-ambar"/>
                          <span className="text-xs font-semibold text-ambar">{errorCount} con errores</span>
                        </div>
                      )}
                      <span className="text-[11px] text-gris">{rows.length} filas totales</span>
                    </div>
                    {errorCount > 0 && (
                      <span className="text-[10px] text-gris">Las filas con error no se importarán</span>
                    )}
                  </div>

                  {/* Filtro */}
                  <div className="flex gap-1.5">
                    {filters.map(f => (
                      <button key={f.id} onClick={() => setFilter(f.id)}
                        className={"text-[11px] px-3 py-1 rounded-lg border font-medium transition-colors " +
                          (filter === f.id
                            ? 'bg-verde text-white border-verde'
                            : 'bg-white border-borde text-carbon hover:bg-tierra')}>
                        {f.label} ({f.count})
                      </button>
                    ))}
                  </div>

                  {/* Tabla */}
                  <div className="border border-borde rounded-xl overflow-hidden">
                    <div className="overflow-auto max-h-72">
                      <table className="w-full text-xs min-w-max">
                        <thead className="sticky top-0 z-10">
                          <tr className="bg-tierra border-b border-borde">
                            <th className="text-left px-2 py-2 font-medium text-gris w-8">#</th>
                            <th className="text-left px-2 py-2 font-medium text-gris w-14">OK</th>
                            {columns.map(c => (
                              <th key={c.key} className="text-left px-2 py-2 font-medium text-gris whitespace-nowrap">
                                {c.header}
                              </th>
                            ))}
                            <th className="text-left px-2 py-2 font-medium text-gris min-w-[180px]">Error</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-borde">
                          {shownRows.map(row => (
                            <tr key={row.rowNum}
                              className={row.valid ? 'bg-verde-s/20 hover:bg-verde-s/40' : 'bg-red-50 hover:bg-red-100'}>
                              <td className="px-2 py-1.5 text-gris font-mono text-[10px]">{row.rowNum}</td>
                              <td className="px-2 py-1.5">
                                {row.valid
                                  ? <CheckCircle2 size={12} className="text-verde-act"/>
                                  : <AlertTriangle size={12} className="text-rojo"/>}
                              </td>
                              {columns.map(c => (
                                <td key={c.key} className="px-2 py-1.5 text-carbon max-w-[130px] truncate">
                                  {row.raw[c.header] || <span className="text-gris text-[10px] italic">—</span>}
                                </td>
                              ))}
                              <td className="px-2 py-1.5 text-rojo text-[10px] whitespace-normal">
                                {row.errors.join(' · ')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <div className="border-t border-borde px-5 py-3 flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => step === 2 ? setStep(1) : onClose()}
            className="flex items-center gap-1.5 text-xs font-medium border border-borde text-carbon px-4 py-2 rounded-lg hover:bg-tierra transition-colors">
            {step === 2 && <ChevronLeft size={13}/>}
            {step === 1 ? 'Cancelar' : 'Volver'}
          </button>

          {step === 2 && validCount > 0 && missingCols.length === 0 && (
            <button onClick={handleImport} disabled={importing}
              className="flex items-center gap-1.5 text-xs font-semibold bg-verde-act text-white px-5 py-2 rounded-lg hover:bg-verde transition-colors disabled:opacity-60">
              {importing
                ? <><Loader2 size={13} className="animate-spin"/> Importando...</>
                : <><Upload size={13}/> Importar {validCount} {entityName}</>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
