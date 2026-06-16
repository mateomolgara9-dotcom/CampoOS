export type Categoria = 'Vaca' | 'Toro' | 'Novillo' | 'Vaquillona' | 'Ternero' | 'Ternera'
export type EstadoSanitario = 'Al día' | 'Vacuna vencida' | 'Vacuna próxima' | 'Sin RFID'

export type Animal = {
  id: string
  caravana: string
  caravana_interna?: string
  categoria: Categoria
  raza?: string
  potrero?: string
  peso_actual?: number
  gdp?: number
  estado_sanitario: EstadoSanitario
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
