import type { LucideIcon } from 'lucide-react'
import {
  Home, PawPrint, Map, Package, Wrench, Car, Antenna,
  Receipt, ShoppingCart, UserCircle, Calculator, Users,
  Settings, ClipboardList, Briefcase,
} from 'lucide-react'

export type GrupoModulo = 'General' | 'Asesor' | 'Producción' | 'Comercial'

export type ModuloDef = {
  href: string
  label: string
  icon: LucideIcon
  grupo: GrupoModulo
  fijo?: boolean   // siempre visible, no se puede apagar
}

// Orden = orden en el sidebar. Inicio arriba, Configuración abajo (ambos fijos).
export const MODULOS: ModuloDef[] = [
  { href: '/dashboard',    label: 'Inicio',        icon: Home,          grupo: 'General',    fijo: true },
  { href: '/productores',  label: 'Productores',   icon: Briefcase,     grupo: 'Asesor' },
  { href: '/contactos',    label: 'Contactos',     icon: UserCircle,    grupo: 'Asesor' },
  { href: '/cuaderno',     label: 'Cuaderno',      icon: ClipboardList, grupo: 'Asesor' },
  { href: '/lotes',        label: 'Lotes',         icon: Map,           grupo: 'Producción' },
  { href: '/animales',     label: 'Animales',      icon: PawPrint,      grupo: 'Producción' },
  { href: '/inventario',   label: 'Inventario',    icon: Package,       grupo: 'Producción' },
  { href: '/maquinaria',   label: 'Maquinaria',    icon: Wrench,        grupo: 'Producción' },
  { href: '/flota',        label: 'Flota',         icon: Car,           grupo: 'Producción' },
  { href: '/iot',          label: 'IoT RFID',      icon: Antenna,       grupo: 'Producción' },
  { href: '/ventas',       label: 'Ventas',        icon: Receipt,       grupo: 'Comercial' },
  { href: '/compras',      label: 'Compras',       icon: ShoppingCart,  grupo: 'Comercial' },
  { href: '/contabilidad', label: 'Contabilidad',  icon: Calculator,    grupo: 'Comercial' },
  { href: '/rrhh',         label: 'RRHH',          icon: Users,         grupo: 'Comercial' },
  { href: '/config',       label: 'Configuración', icon: Settings,      grupo: 'General',    fijo: true },
]

export const MODULOS_TOGGLE = MODULOS.filter(m => !m.fijo)

// visibles === null  → mostrar todo (default). Si es array, solo los listados (+ los fijos).
export function moduloVisible(href: string, visibles: string[] | null, fijo?: boolean) {
  return !!fijo || visibles === null || visibles.includes(href)
}
