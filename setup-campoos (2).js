#!/usr/bin/env node
/**
 * CampoOS MVP - Generador de proyecto completo
 * Ejecutar: node setup-campoos.js
 * Crea toda la estructura del proyecto en la carpeta actual
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const GREEN  = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN   = '\x1b[36m';
const RESET  = '\x1b[0m';
const BOLD   = '\x1b[1m';

function log(msg, color = GREEN)  { console.log(`${color}${msg}${RESET}`); }
function info(msg)  { console.log(`${CYAN}  → ${msg}${RESET}`); }
function title(msg) { console.log(`\n${BOLD}${YELLOW}◆ ${msg}${RESET}`); }

function writeFile(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  info(`Creado: ${filePath}`);
}

function run(cmd, cwd = '.') {
  try {
    execSync(cmd, { cwd, stdio: 'inherit' });
  } catch(e) {
    console.error(`Error ejecutando: ${cmd}`);
    process.exit(1);
  }
}

// ─── ARCHIVOS DEL PROYECTO ───────────────────────────────────────────────────

const files = {};

// package.json
files['package.json'] = JSON.stringify({
  name: "campoos",
  version: "0.1.0",
  private: true,
  scripts: {
    dev: "next dev",
    build: "next build",
    start: "next start",
    lint: "next lint"
  },
  dependencies: {
    next: "14.2.3",
    react: "^18",
    "react-dom": "^18",
    "@supabase/supabase-js": "^2.43.4",
    "@supabase/ssr": "^0.3.0",
    "lucide-react": "^0.383.0",
    clsx: "^2.1.1"
  },
  devDependencies: {
    typescript: "^5",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    autoprefixer: "^10.0.1",
    postcss: "^8",
    tailwindcss: "^3.4.1",
    eslint: "^8",
    "eslint-config-next": "14.2.3"
  }
}, null, 2);

// next.config.js
files['next.config.js'] = `/** @type {import('next').NextConfig} */
const nextConfig = {}
module.exports = nextConfig
`;

// tsconfig.json
files['tsconfig.json'] = JSON.stringify({
  compilerOptions: {
    lib: ["dom","dom.iterable","esnext"],
    allowJs: true,
    skipLibCheck: true,
    strict: true,
    noEmit: true,
    esModuleInterop: true,
    module: "esnext",
    moduleResolution: "bundler",
    resolveJsonModule: true,
    isolatedModules: true,
    jsx: "preserve",
    incremental: true,
    plugins: [{ name: "next" }],
    paths: { "@/*": ["./src/*"] }
  },
  include: ["next-env.d.ts","**/*.ts","**/*.tsx",".next/types/**/*.ts"],
  exclude: ["node_modules"]
}, null, 2);

// tailwind.config.js
files['tailwind.config.js'] = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        verde:    { DEFAULT:'#1A5C2A', act:'#2D9E4E', ac:'#4FCB6B', s:'#EAF3DE', n:'#0F2415' },
        ambar:    { DEFAULT:'#EF9F27', s:'#FFF8E1' },
        azul:     { DEFAULT:'#185FA5', s:'#E6F1FB' },
        rojo:     { DEFAULT:'#E24B4A', s:'#FFEBEE' },
        carbon:   '#2C2C2A',
        gris:     '#5F5E5A',
        tierra:   '#F1EFE8',
        borde:    '#D3D1C7',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
`;

// postcss.config.js
files['postcss.config.js'] = `module.exports = {
  plugins: { tailwindcss: {}, autoprefixer: {} },
}`;

// .env.local
files['.env.local'] = `# Supabase - reemplazá con tus valores de supabase.com → Settings → API
NEXT_PUBLIC_SUPABASE_URL=TU_SUPABASE_URL_AQUI
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_SUPABASE_ANON_KEY_AQUI
`;

// .gitignore
files['.gitignore'] = `.env.local
.env
node_modules/
.next/
out/
build/
*.log
.DS_Store
`;

// ─── SUPABASE CLIENT ──────────────────────────────────────────────────────────
files['src/lib/supabase.ts'] = `import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
`;

// ─── TYPES ────────────────────────────────────────────────────────────────────
files['src/types/index.ts'] = `export type Animal = {
  id: string
  caravana: string
  caravana_interna?: string
  categoria: 'Vaca' | 'Toro' | 'Novillo' | 'Vaquillona' | 'Ternero' | 'Ternera'
  raza?: string
  potrero?: string
  peso_actual?: number
  gdp?: number
  estado_sanitario: 'Al día' | 'Vacuna vencida' | 'Vacuna próxima' | 'Sin RFID'
  tiene_rfid: boolean
  fecha_nacimiento?: string
  observaciones?: string
  created_at: string
}

export type KPI = {
  label: string
  value: string
  sub: string
  trend?: string
  trendUp?: boolean
  accent: 'verde' | 'ambar' | 'azul' | 'rojo'
}
`;

// ─── GLOBAL CSS ───────────────────────────────────────────────────────────────
files['src/app/globals.css'] = `@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

* { box-sizing: border-box; }

body {
  font-family: 'Inter', system-ui, sans-serif;
  background: #F1EFE8;
  color: #2C2C2A;
}

/* Scrollbar */
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #D3D1C7; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #5F5E5A; }

/* Chip badges */
.chip {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 8px; border-radius: 20px;
  font-size: 11px; font-weight: 500; white-space: nowrap;
}
.chip-green  { background: #EAF3DE; color: #27500A; }
.chip-red    { background: #FFEBEE; color: #791F1F; }
.chip-amber  { background: #FFF8E1; color: #633806; }
.chip-blue   { background: #E6F1FB; color: #0C447C; }
.chip-gray   { background: #F1EFE8; color: #5F5E5A; }
.chip-purple { background: #EEEDFE; color: #3C3489; }
`;

// ─── LAYOUT ───────────────────────────────────────────────────────────────────
files['src/app/layout.tsx'] = `import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CampoOS — Gestión Agropecuaria',
  description: 'El sistema operativo del campo latinoamericano',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
`;

// ─── SIDEBAR COMPONENT ───────────────────────────────────────────────────────
files['src/components/Sidebar.tsx'] = `'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Home, PawPrint, Map, Package, Wrench,
  Receipt, Calculator, Users, Antenna,
  Settings, ChevronRight
} from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { href: '/dashboard',  icon: Home,       label: 'Inicio' },
  { href: '/animales',   icon: PawPrint,   label: 'Animales' },
  { href: '/lotes',      icon: Map,        label: 'Lotes' },
  { href: '/inventario', icon: Package,    label: 'Inventario' },
  { href: '/maquinaria', icon: Wrench,     label: 'Maquinaria' },
]

const navItems2 = [
  { href: '/ventas',      icon: Receipt,    label: 'Ventas' },
  { href: '/contabilidad',icon: Calculator, label: 'Contabilidad' },
  { href: '/rrhh',        icon: Users,      label: 'RRHH' },
]

const navItems3 = [
  { href: '/iot',         icon: Antenna,    label: 'IoT RFID' },
]

export default function Sidebar() {
  const path = usePathname()

  const NavItem = ({ href, icon: Icon, label }: { href:string, icon:any, label:string }) => {
    const active = path.startsWith(href)
    return (
      <Link href={href} title={label}
        className={clsx(
          'w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150 group relative',
          active
            ? 'bg-verde-ac text-verde'
            : 'text-white/40 hover:bg-white/10 hover:text-white'
        )}>
        <Icon size={18} />
        {/* Tooltip */}
        <span className="absolute left-12 bg-carbon text-white text-xs font-medium px-2 py-1 rounded-md whitespace-nowrap
          opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
          {label}
        </span>
      </Link>
    )
  }

  return (
    <div className="w-14 bg-verde flex flex-col items-center py-3 gap-1 flex-shrink-0 h-screen sticky top-0">
      {/* Logo */}
      <Link href="/dashboard" className="w-9 h-9 bg-verde-act rounded-lg flex items-center justify-center mb-3">
        <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
          <rect x="2" y="13" width="20" height="9" rx="2" fill="rgba(255,255,255,0.3)"/>
          <polygon points="12,3 22,13 2,13" fill="white"/>
          <rect x="9" y="16" width="6" height="6" rx="1" fill="#1A5C2A"/>
        </svg>
      </Link>

      {navItems.map(item => <NavItem key={item.href} {...item} />)}

      <div className="w-7 h-px bg-white/10 my-2" />
      {navItems2.map(item => <NavItem key={item.href} {...item} />)}

      <div className="w-7 h-px bg-white/10 my-2" />
      {navItems3.map(item => <NavItem key={item.href} {...item} />)}

      <div className="mt-auto">
        <div className="w-7 h-px bg-white/10 mb-2" />
        <NavItem href="/config" icon={Settings} label="Configuración" />
      </div>
    </div>
  )
}
`;

// ─── TOPBAR COMPONENT ─────────────────────────────────────────────────────────
files['src/components/Topbar.tsx'] = `'use client'
import { Bell, Search } from 'lucide-react'

interface TopbarProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export default function Topbar({ title, subtitle, actions }: TopbarProps) {
  return (
    <div className="bg-white border-b border-borde h-[52px] flex items-center px-5 gap-3 flex-shrink-0">
      {/* Establecimiento */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-verde-ac" />
        <span className="text-sm font-medium text-carbon">La Esperanza</span>
        <span className="text-xs text-gris bg-tierra px-2 py-0.5 rounded-full">Córdoba · 1.240 ha</span>
      </div>

      {/* Sync */}
      <span className="text-xs text-gris flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-verde-ac inline-block"/>
        Sincronizado
      </span>

      <div className="ml-auto flex items-center gap-2">
        {actions}
        <button className="w-8 h-8 rounded-lg border border-borde flex items-center justify-center text-gris hover:bg-tierra transition-colors relative">
          <Bell size={15} />
          <span className="absolute -top-1 -right-1 bg-rojo text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-semibold">3</span>
        </button>
        <button className="w-8 h-8 rounded-lg border border-borde flex items-center justify-center text-gris hover:bg-tierra transition-colors">
          <Search size={15} />
        </button>
        <div className="w-8 h-8 rounded-full bg-verde flex items-center justify-center text-white text-xs font-semibold cursor-pointer">
          JG
        </div>
      </div>
    </div>
  )
}
`;

// ─── KPI CARD COMPONENT ───────────────────────────────────────────────────────
files['src/components/KpiCard.tsx'] = `import { TrendingUp, TrendingDown } from 'lucide-react'
import clsx from 'clsx'
import type { KPI } from '@/types'

export default function KpiCard({ label, value, sub, trend, trendUp, accent }: KPI) {
  const accentColor = {
    verde: 'border-t-verde-ac',
    ambar: 'border-t-ambar',
    azul:  'border-t-azul',
    rojo:  'border-t-rojo',
  }[accent]

  return (
    <div className={clsx('bg-white border border-borde rounded-xl p-3.5 border-t-2', accentColor)}>
      <div className="text-[10px] text-gris mb-1.5 font-medium uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-semibold text-carbon leading-none mb-1">{value}</div>
      <div className="text-[10px] text-gris">{sub}</div>
      {trend && (
        <div className={clsx(
          'inline-flex items-center gap-1 text-[10px] font-semibold mt-1.5 px-1.5 py-0.5 rounded-full',
          trendUp ? 'bg-verde-s text-verde' : 'bg-rojo-s text-rojo'
        )}>
          {trendUp ? <TrendingUp size={10}/> : <TrendingDown size={10}/>}
          {trend}
        </div>
      )}
    </div>
  )
}
`;

// ─── APP LAYOUT (con sidebar) ─────────────────────────────────────────────────
files['src/app/(app)/layout.tsx'] = `import Sidebar from '@/components/Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-tierra">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}
`;

// ─── DASHBOARD PAGE ───────────────────────────────────────────────────────────
files['src/app/(app)/dashboard/page.tsx'] = `'use client'
import { useState } from 'react'
import { PawPrint, Map, Antenna, Package, Wrench, Receipt,
         AlertTriangle, Activity, Cloud, Sun, CloudRain } from 'lucide-react'
import Topbar from '@/components/Topbar'
import KpiCard from '@/components/KpiCard'
import type { KPI } from '@/types'
import Link from 'next/link'

const kpis: KPI[] = [
  { label: 'Hacienda total',   value: '847',       sub: 'animales activos',     trend: '+12 vs mes anterior', trendUp: true,  accent: 'verde' },
  { label: 'Peso promedio',    value: '318 kg',     sub: 'última pesada 18/05',  trend: 'GDP +0.8 kg/día',     trendUp: true,  accent: 'verde' },
  { label: 'Lotes activos',    value: '14',         sub: 'de 18 lotes totales',  trend: '3 en barbecho',       trendUp: false, accent: 'ambar' },
  { label: 'Margen campaña',   value: 'USD 148',    sub: 'por hectárea acum.',   trend: '+18% vs campaña ant.',trendUp: true,  accent: 'azul'  },
]

const actividad = [
  { icon: Antenna,       color: 'bg-verde-s text-verde',      title: 'Pesada RFID completada — Manga Norte',      sub: '183 animales · promedio 312 kg · GDP +0.8 kg/día', time: 'hace 4 min' },
  { icon: AlertTriangle, color: 'bg-ambar-s text-ambar',      title: 'Alerta sanitaria — Vacuna aftosa vencida',  sub: 'Animales AR-1142 y AR-1143 · Acción requerida',    time: 'hace 1 h'   },
  { icon: Map,           color: 'bg-verde-s text-verde',      title: 'Aplicación herbicida — Lote 7 El Sauce',    sub: 'Glifosato 3 l/ha · 120 ha · Op: Miguel Ruiz',      time: 'hace 3 h'   },
  { icon: Package,       color: 'bg-azul-s text-azul',        title: 'Compra registrada — Semillas maíz DK7500',  sub: '450 kg · ARS 2.340.000 · Agroquímicos Sur',        time: 'ayer 16:30' },
  { icon: Wrench,        color: 'bg-rojo-s text-rojo',        title: 'Service pendiente — John Deere 6130J',      sub: 'Horómetro 2.850 h · Próximo service a 3.000 h',    time: 'ayer 09:00' },
]

const alertas = [
  { color: 'bg-rojo',  title: 'Vacuna aftosa vencida',  sub: 'Requiere acción inmediata', count: '2',  countClass: 'bg-rojo-s text-rojo' },
  { color: 'bg-ambar', title: 'Service de maquinaria',   sub: 'Próximos 150 hs de uso',   count: '1',  countClass: 'bg-ambar-s text-ambar' },
  { color: 'bg-ambar', title: 'Stock bajo — herbicida',  sub: 'Menos de 20% en depósito', count: '1',  countClass: 'bg-ambar-s text-ambar' },
  { color: 'bg-azul',  title: 'Lluvia prevista mañana',  sub: '12–18 mm · Revisar labores',count: '!', countClass: 'bg-azul-s text-azul' },
]

const modulos = [
  { href:'/animales',   icon: PawPrint,  label: 'Animales' },
  { href:'/iot',        icon: Antenna,   label: 'IoT RFID' },
  { href:'/lotes',      icon: Map,       label: 'Lotes'    },
  { href:'/inventario', icon: Package,   label: 'Inventario'},
  { href:'/maquinaria', icon: Wrench,    label: 'Maquinaria'},
  { href:'/ventas',     icon: Receipt,   label: 'Ventas'   },
]

export default function Dashboard() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Dashboard" />
      <div className="flex-1 overflow-y-auto p-5">

        {/* Page header */}
        <div className="flex items-end justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-carbon">Buenos días, Juan</h1>
            <p className="text-xs text-gris mt-0.5">Viernes 23 de mayo · Campaña 2025/26</p>
          </div>
          <div className="flex gap-2">
            <button className="text-xs font-medium px-3 py-1.5 rounded-lg border border-borde bg-white text-carbon hover:bg-tierra transition-colors">Exportar</button>
            <button className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-verde-act text-white hover:bg-verde transition-colors">+ Nueva tarea</button>
          </div>
        </div>

        {/* Alert banner */}
        <div className="bg-ambar-s border border-ambar rounded-xl p-3 flex items-center gap-3 mb-4">
          <AlertTriangle size={16} className="text-ambar flex-shrink-0"/>
          <p className="text-xs text-amber-800 flex-1">
            <span className="font-semibold">3 alertas requieren atención:</span> 2 animales con vacuna vencida · 1 máquina con service pendiente · lluvia prevista mañana
          </p>
          <button className="text-xs font-semibold text-ambar whitespace-nowrap hover:underline">Ver todas →</button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-2.5 mb-4">
          {kpis.map((kpi, i) => <KpiCard key={i} {...kpi} />)}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-[1fr_280px] gap-3">

          {/* Left */}
          <div className="flex flex-col gap-3">

            {/* Actividad */}
            <div className="bg-white border border-borde rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-borde">
                <h3 className="text-sm font-medium text-carbon flex items-center gap-1.5">
                  <Activity size={15} className="text-verde-act"/> Actividad reciente
                </h3>
                <button className="text-xs text-azul hover:underline">Ver historial</button>
              </div>
              <div className="divide-y divide-borde">
                {actividad.map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5 px-4 py-3">
                    <div className={"w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 " + item.color}>
                      <item.icon size={14}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-carbon truncate">{item.title}</p>
                      <p className="text-[11px] text-gris mt-0.5 truncate">{item.sub}</p>
                    </div>
                    <span className="text-[10px] text-gris whitespace-nowrap mt-0.5">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rodeo summary */}
            <div className="bg-white border border-borde rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-borde">
                <h3 className="text-sm font-medium text-carbon flex items-center gap-1.5">
                  <PawPrint size={15} className="text-verde-act"/> Composición del rodeo
                </h3>
                <Link href="/animales" className="text-xs text-azul hover:underline">Ver detalle →</Link>
              </div>
              <div className="p-4 flex gap-4 items-end">
                <div className="flex gap-1.5 items-end h-14 flex-1">
                  {[{l:'Vacas',v:342,h:'100%'},{l:'Terneros',v:198,h:'58%'},{l:'Vaquillonas',v:167,h:'49%'},{l:'Novillos',v:112,h:'33%'},{l:'Toros',v:28,h:'14%'}].map((b,i)=>(
                    <div key={i} className="flex flex-col items-center flex-1">
                      <div className={"w-full rounded-t-sm " + (i===0?"bg-verde-act":"bg-verde-s")} style={{height:b.h}}/>
                      <p className="text-[9px] text-gris mt-1 text-center leading-tight">{b.l}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-1.5 min-w-[120px]">
                  {[['Vacas','342'],['Terneros','198'],['Vaquillonas','167'],['Novillos','112'],['Toros','28']].map(([l,v])=>(
                    <div key={l} className="flex justify-between text-[11px]">
                      <span className="text-gris">{l}</span>
                      <span className="font-medium text-carbon">{v}</span>
                    </div>
                  ))}
                  <div className="border-t border-borde pt-1.5 flex justify-between text-[11px]">
                    <span className="font-medium text-carbon">Total</span>
                    <span className="font-semibold text-verde">847</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="flex flex-col gap-3">

            {/* Clima */}
            <div className="bg-white border border-borde rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-borde">
                <h3 className="text-sm font-medium text-carbon flex items-center gap-1.5">
                  <Cloud size={15} className="text-verde-act"/> Clima hoy
                </h3>
                <span className="text-[10px] text-gris">Villa María, CBA</span>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-3 pb-3 border-b border-borde mb-3">
                  <Sun size={36} className="text-ambar flex-shrink-0"/>
                  <div>
                    <div className="text-3xl font-light text-carbon">19°C</div>
                    <div className="text-xs text-gris">Parcialmente nublado</div>
                    <div className="text-[10px] text-gris">La Esperanza</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[['💧','Humedad 68%'],['💨','Viento 14 km/h'],['🌡️','Máx 23° Mín 9°'],['🌧️','Lluvia 0 mm']].map(([e,t])=>(
                    <div key={t} className="text-[11px] text-gris flex items-center gap-1">{e} {t}</div>
                  ))}
                </div>
                <div className="flex justify-between pt-2 border-t border-borde">
                  {[['Sáb','🌧️','15°'],['Dom','☁️','18°'],['Lun','☀️','22°'],['Mar','☀️','24°'],['Mié','🌧️','16°']].map(([d,i,t])=>(
                    <div key={d} className="text-center">
                      <div className="text-[10px] text-gris">{d}</div>
                      <div className="text-sm my-0.5">{i}</div>
                      <div className="text-[11px] font-medium text-carbon">{t}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Alertas */}
            <div className="bg-white border border-borde rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-borde">
                <h3 className="text-sm font-medium text-carbon">Alertas activas</h3>
                <button className="text-xs text-azul hover:underline">Ver todas</button>
              </div>
              <div className="divide-y divide-borde">
                {alertas.map((a,i)=>(
                  <div key={i} className="flex items-start gap-2 px-4 py-2.5">
                    <div className={"w-1.5 h-10 rounded-full flex-shrink-0 " + a.color}/>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-carbon">{a.title}</p>
                      <p className="text-[11px] text-gris">{a.sub}</p>
                    </div>
                    <span className={"text-[10px] font-bold px-1.5 py-0.5 rounded-full " + a.countClass}>{a.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Accesos rápidos */}
            <div className="bg-white border border-borde rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-borde">
                <h3 className="text-sm font-medium text-carbon">Accesos rápidos</h3>
              </div>
              <div className="p-3 grid grid-cols-3 gap-2">
                {modulos.map(m=>(
                  <Link key={m.href} href={m.href}
                    className="bg-tierra border border-borde rounded-lg p-2.5 text-center hover:bg-verde-s hover:border-verde-ac transition-all group">
                    <m.icon size={18} className="text-verde-act mx-auto mb-1 group-hover:text-verde"/>
                    <p className="text-[10px] font-medium text-carbon">{m.label}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
`;

// ─── ANIMALES PAGE ────────────────────────────────────────────────────────────
files['src/app/(app)/animales/page.tsx'] = `
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
`;

// ─── ROOT PAGE REDIRECT ───────────────────────────────────────────────────────
files['src/app/page.tsx'] = `import { redirect } from 'next/navigation'
export default function Home() { redirect('/dashboard') }
`;

// ─── PLACEHOLDER PAGES ────────────────────────────────────────────────────────
const placeholders = [
  ['lotes',       'Lotes & Cultivos',  'Mapa de lotes georeferenciados, campañas y labores'],
  ['inventario',  'Inventario',        'Insumos, agroquímicos, semillas y herramientas'],
  ['maquinaria',  'Maquinaria',        'Ficha técnica, horómetro y mantenimiento'],
  ['ventas',      'Ventas',            'Hacienda, granos, contratos y liquidaciones'],
  ['contabilidad','Contabilidad',      'Plan de cuentas, costos por lote y resultados'],
  ['rrhh',        'RRHH',              'Personal, jornales, contratistas y haberes'],
  ['iot',         'IoT & Caravanas',   'Lectores RFID, dispositivos conectados y alertas'],
  ['config',      'Configuración',     'Perfil, establecimiento, usuarios y ajustes'],
]

for (const [slug, title, desc] of placeholders) {
  files[`src/app/(app)/${slug}/page.tsx`] = `import Topbar from '@/components/Topbar'
export default function Page() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="${title}" />
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🚧</div>
          <h2 className="text-xl font-semibold text-carbon mb-2">${title}</h2>
          <p className="text-sm text-gris mb-6">${desc}</p>
          <p className="text-xs text-gris bg-ambar-s border border-ambar px-4 py-2 rounded-xl inline-block">
            Módulo en construcción — próximamente disponible
          </p>
        </div>
      </div>
    </div>
  )
}
`;
}

// ─── SUPABASE SQL ─────────────────────────────────────────────────────────────
files['supabase/schema.sql'] = `-- CampoOS — Schema inicial
-- Ejecutar en Supabase → SQL Editor

-- Tabla de establecimientos
create table if not exists establecimientos (
  id          uuid default gen_random_uuid() primary key,
  nombre      text not null,
  provincia   text,
  superficie  numeric,
  cuig        text,
  created_at  timestamptz default now()
);

-- Tabla de animales
create table if not exists animales (
  id                uuid default gen_random_uuid() primary key,
  establecimiento_id uuid references establecimientos(id) on delete cascade,
  caravana          text not null,
  caravana_interna  text,
  categoria         text not null check (categoria in ('Vaca','Toro','Novillo','Vaquillona','Ternero','Ternera')),
  raza              text,
  potrero           text,
  peso_actual       numeric,
  gdp               numeric,
  estado_sanitario  text default 'Al día',
  tiene_rfid        boolean default false,
  fecha_nacimiento  date,
  observaciones     text,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- Tabla de pesadas
create table if not exists pesadas (
  id          uuid default gen_random_uuid() primary key,
  animal_id   uuid references animales(id) on delete cascade,
  peso_kg     numeric not null,
  gdp         numeric,
  fecha       date not null default current_date,
  metodo      text default 'manual' check (metodo in ('manual','rfid','bascula')),
  operario    text,
  observaciones text,
  created_at  timestamptz default now()
);

-- Datos de ejemplo
insert into establecimientos (nombre, provincia, superficie) values
  ('La Esperanza', 'Córdoba', 1240),
  ('El Paraíso',   'Buenos Aires', 850);

-- RLS (Row Level Security) — activar cuando tengas auth
-- alter table animales enable row level security;
`;

// ─── README ───────────────────────────────────────────────────────────────────
files['README.md'] = `# 🌾 CampoOS — Sistema de Gestión Agropecuaria

## Instalación y primer uso

### 1. Instalar dependencias
\`\`\`bash
npm install
\`\`\`

### 2. Configurar Supabase
- Abrí .env.local
- Reemplazá TU_SUPABASE_URL_AQUI con tu URL de Supabase
- Reemplazá TU_SUPABASE_ANON_KEY_AQUI con tu anon key
- Ambos los encontrás en supabase.com → tu proyecto → Settings → API

### 3. Crear la base de datos
- Abrí supabase.com → tu proyecto → SQL Editor
- Pegá el contenido de supabase/schema.sql
- Clic en Run

### 4. Correr el proyecto
\`\`\`bash
npm run dev
\`\`\`

Abrí http://localhost:3000 en tu navegador 🚀

## Módulos disponibles
- ✅ Dashboard principal con KPIs
- ✅ Gestión animal con tabla y ficha individual
- 🚧 Lotes & GIS (próximamente)
- 🚧 Inventario (próximamente)
- 🚧 Maquinaria (próximamente)
- 🚧 Ventas (próximamente)
- 🚧 IoT RFID (próximamente)

## Stack
- Next.js 14 + React 18 + TypeScript
- Tailwind CSS
- Supabase (PostgreSQL)
- Lucide Icons
`;

// ─── MAIN: CREATE FILES ───────────────────────────────────────────────────────
title('Creando estructura del proyecto CampoOS...');

for (const [filePath, content] of Object.entries(files)) {
  writeFile(filePath, content);
}

title('Instalando dependencias (esto tarda 2-3 minutos)...');
run('npm install');

title('¡Listo! CampoOS está instalado.');
log('\n' + '═'.repeat(60));
log('  ✅  Proyecto creado exitosamente', GREEN);
log('');
log('  PRÓXIMOS PASOS:', YELLOW);
log('  1. Abrí el archivo .env.local en VS Code', CYAN);
log('  2. Reemplazá las keys de Supabase', CYAN);
log('  3. Ejecutá: npm run dev', CYAN);
log('  4. Abrí http://localhost:3000', CYAN);
log('');
log('  SUPABASE KEYS:', YELLOW);
log('  supabase.com → tu proyecto → Settings → API', CYAN);
log('═'.repeat(60) + '\n');
