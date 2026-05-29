-- CampoOS — Schema inicial
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
