
'use client'
import { useState } from 'react'
import { Search, Plus, Download, Antenna, Filter } from 'lucide-react'
import Topbar from '@/components/Topbar'

const ANIMALES = [
  { id:'1', caravana:'AR-1142', cat:'Vaca',       potrero:'Potrero Sur', peso:342, gdp:0.9,  san:'Vacuna vencida' },
  { id:'2', caravana:'AR-2087', cat:'Vaca',       potrero:'Lote Norte',  peso:318, gdp:0.7,  san:'Al dia'         },
  { id:'3', caravana:'AR-3341', cat:'Novillo',    potrero:'Campo Bajo',  peso:287, gdp:1.1,  san:'Al dia'         },
  { id:'4', caravana:'AR-0891', cat:'Ternero',    potrero:'Potrero Sur', peso:148, gdp:0.6,  san:'Vacuna proxima' },
  { id:'5', caravana:'AR-4521', cat:'Vaquillona', potrero:'Lote Este',   peso:264, gdp:0.8,  san:'Al dia'         },
  { id:'6', caravana:'AR-1143', cat:'Vaca',       potrero:'Potrero Sur', peso:331, gdp:-0.2, san:'Vacuna vencida' },
  { id:'7', caravana:'AR-7712', cat:'Novillo',    potrero:'Campo Bajo',  peso:312, gdp:0.5,  san:'Al dia'         },
  { id:'8', caravana:'Sin car.', cat:'Ternero',   potrero:'Lote Norte',  peso:0,   gdp:0,    san:'Sin RFID'       },
]

function getSanChip(san: string) {
  if (san === 'Vacuna vencida') return 'chip chip-red'
  if (san === 'Vacuna proxima') return 'chip chip-amber'
  if (san === 'Sin RFID') return 'chip chip-amber'
  return 'chip chip-green'
}

function getCatChip(cat: string) {
  if (cat === 'Novillo') return 'chip chip-blue'
  if (cat === 'Ternero' || cat === 'Vaquillona') return 'chip chip-amber'
  return 'chip chip-green'
}

export default function Animales() {
  const [busqueda, setBusqueda] = useState('')
  const [sel, setSel] = useState(ANIMALES[0])

  const filtrados = ANIMALES.filter(a =>
    a.caravana.toLowerCase().includes(busqueda.toLowerCase()) ||
    a.potrero.toLowerCase().includes(busqueda.toLowerCase()) ||
    a.cat.toLowerCase().includes(busqueda.toLowerCase())
  )

  const actions = (
    <div className="flex gap-2">
      <button className="flex items-center gap-1 text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-300 px-3 py-1.5 rounded-lg">
        <Antenna size={13}/> Iniciar RFID
      </button>
      <button className="flex items-center gap-1 text-xs border border-borde bg-white text-carbon px-3 py-1.5 rounded-lg">
        <Download size={13}/> Exportar
      </button>
      <button className="flex items-center gap-1 text-xs font-semibold bg-verde-act text-white px-3 py-1.5 rounded-lg">
        <Plus size={13}/> Nuevo animal
      </button>
    </div>
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Gestion animal" actions={actions} />
      <div className="flex-1 overflow-y-auto p-4">

        <div className="grid grid-cols-4 gap-2.5 mb-4">
          {[
            { l:'Total rodeo',     v:'847',        s:'animales activos',    c:'border-t-verde-ac' },
            { l:'Peso promedio',   v:'318 kg',     s:'GDP: +0.8 kg/dia',    c:'border-t-verde-ac' },
            { l:'Alertas san.',    v:'7',          s:'2 criticas / 5 prox', c:'border-t-ambar'    },
            { l:'Con RFID',        v:'831 / 847',  s:'98.1% identificados', c:'border-t-azul'     },
          ].map(({ l, v, s, c }) => (
            <div key={l} className={"bg-white border border-borde rounded-xl p-3 border-t-2 " + c}>
              <div className="text-[10px] text-gris mb-1 uppercase tracking-wide font-medium">{l}</div>
              <div className="text-xl font-semibold text-carbon">{v}</div>
              <div className="text-[10px] text-gris">{s}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-2 bg-white border border-borde rounded-lg px-3 py-1.5 flex-1 max-w-xs">
            <Search size={13} className="text-gris"/>
            <input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar caravana, potrero..."
              className="text-xs outline-none bg-transparent flex-1 text-carbon placeholder:text-gris"
            />
          </div>
          <span className="ml-auto text-xs text-gris bg-tierra border border-borde px-3 py-1.5 rounded-lg">
            <strong className="text-carbon">{filtrados.length}</strong> animales
          </span>
        </div>

        <div className="grid grid-cols-[1fr_280px] gap-3 items-start">
          <div className="bg-white border border-borde rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-tierra border-b border-borde">
                  {['Caravana','Categoria','Potrero','Peso','GDP','Sanidad'].map(h => (
                    <th key={h} className="text-left px-3 py-2 font-medium text-gris">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-borde">
                {filtrados.map(animal => (
                  <tr
                    key={animal.id}
                    onClick={() => setSel(animal)}
                    className={"cursor-pointer hover:bg-tierra/60 " + (sel?.id === animal.id ? 'bg-verde-s' : '')}
                  >
                    <td className="px-3 py-2">
                      <span className="font-mono text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                        {animal.caravana}
                      </span>
                    </td>
                    <td className="px-3 py-2"><span className={getCatChip(animal.cat)}>{animal.cat}</span></td>
                    <td className="px-3 py-2 text-carbon">{animal.potrero}</td>
                    <td className="px-3 py-2 font-medium text-carbon">{animal.peso ? animal.peso + ' kg' : '—'}</td>
                    <td className={"px-3 py-2 font-semibold " + (animal.gdp > 0 ? 'text-verde' : animal.gdp < 0 ? 'text-rojo' : 'text-gris')}>
                      {animal.gdp !== 0 ? (animal.gdp > 0 ? '+' : '') + animal.gdp : '—'}
                    </td>
                    <td className="px-3 py-2">
                      <span className={getSanChip(animal.san)}>{animal.san}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {sel && (
            <div className="bg-white border border-borde rounded-xl overflow-hidden">
              <div className="bg-verde px-4 py-3">
                <p className="text-sm font-semibold text-white">{sel.caravana}</p>
                <p className="text-xs text-white/60 mt-0.5">{sel.cat} / {sel.potrero}</p>
                <span className={"mt-2 inline-block " + getSanChip(sel.san)}>{sel.san}</span>
              </div>
              <div className="p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-2">Biometria</p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[
                    ['Peso actual', sel.peso ? sel.peso + ' kg' : '—'],
                    ['GDP 30 dias', sel.gdp ? (sel.gdp > 0 ? '+' : '') + sel.gdp + ' kg/d' : '—'],
                    ['Cond. corporal', '3.5 / 5'],
                    ['Edad estimada', '4 anos'],
                  ].map(([l, v]) => (
                    <div key={l} className="bg-tierra rounded-lg p-2">
                      <p className="text-[10px] text-gris mb-1">{l}</p>
                      <p className="text-sm font-semibold text-carbon">{v}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gris mb-2">Historial pesadas</p>
                {[['18/05','342 kg','+0.9'],['18/04','315 kg','+0.7'],['18/03','294 kg','+0.8']].map(([f,p,g]) => (
                  <div key={f} className="flex justify-between text-xs mb-1.5">
                    <span className="text-gris">{f}</span>
                    <span className="font-medium text-carbon">{p}</span>
                    <span className="text-verde">{g} kg/d</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
