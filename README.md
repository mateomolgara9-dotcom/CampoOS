# 🌾 CampoOS — Sistema de Gestión Agropecuaria

## Instalación y primer uso

### 1. Instalar dependencias
```bash
npm install
```

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
```bash
npm run dev
```

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
