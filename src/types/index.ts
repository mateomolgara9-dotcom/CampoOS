export type Animal = {
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
