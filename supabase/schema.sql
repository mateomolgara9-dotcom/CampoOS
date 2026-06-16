-- ============================================================
-- CampoOS — Schema completo v2
-- Aplicar en: Supabase → SQL Editor → Pegar todo → Run
-- ============================================================

-- ─── FUNCIÓN GLOBAL PARA updated_at ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$;


-- ════════════════════════════════════════════════════════════
-- NÚCLEO: ESTABLECIMIENTOS Y USUARIOS
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS establecimientos (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre      TEXT        NOT NULL CHECK (char_length(nombre) BETWEEN 1 AND 100),
  provincia   TEXT        CHECK (char_length(provincia) <= 50),
  superficie  NUMERIC     CHECK (superficie > 0),
  cuig        TEXT        CHECK (char_length(cuig) <= 20),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Vincula cada usuario de Supabase Auth con su establecimiento
CREATE TABLE IF NOT EXISTS perfil_usuarios (
  user_id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  establecimiento_id UUID        NOT NULL REFERENCES establecimientos(id) ON DELETE CASCADE,
  nombre_completo    TEXT        CHECK (char_length(nombre_completo) <= 100),
  rol                TEXT        NOT NULL DEFAULT 'operario'
                                   CHECK (rol IN ('admin','operario','solo_lectura')),
  avatar_iniciales   TEXT        CHECK (char_length(avatar_iniciales) <= 4),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER perfil_usuarios_upd BEFORE UPDATE ON perfil_usuarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ════════════════════════════════════════════════════════════
-- MÓDULO ANIMALES
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS animales (
  id                 UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  establecimiento_id UUID        REFERENCES establecimientos(id) ON DELETE CASCADE,
  caravana           TEXT        NOT NULL CHECK (char_length(caravana) BETWEEN 1 AND 50),
  caravana_interna   TEXT        CHECK (char_length(caravana_interna) <= 50),
  categoria          TEXT        NOT NULL
                                   CHECK (categoria IN ('Vaca','Toro','Novillo','Vaquillona','Ternero','Ternera')),
  raza               TEXT        CHECK (char_length(raza) <= 50),
  potrero            TEXT        CHECK (char_length(potrero) <= 100),
  peso_actual        NUMERIC     CHECK (peso_actual > 0 AND peso_actual <= 2000),
  gdp                NUMERIC     CHECK (gdp >= -10 AND gdp <= 10),
  estado_sanitario   TEXT        NOT NULL DEFAULT 'Al día'
                                   CHECK (estado_sanitario IN ('Al día','Vacuna vencida','Vacuna próxima','Sin RFID')),
  tiene_rfid         BOOLEAN     NOT NULL DEFAULT false,
  fecha_nacimiento   DATE        CHECK (fecha_nacimiento <= CURRENT_DATE),
  observaciones      TEXT        CHECK (char_length(observaciones) <= 1000),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (establecimiento_id, caravana)
);
CREATE TRIGGER animales_upd BEFORE UPDATE ON animales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS pesadas (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  animal_id     UUID        NOT NULL REFERENCES animales(id) ON DELETE CASCADE,
  peso_kg       NUMERIC     NOT NULL CHECK (peso_kg > 0 AND peso_kg <= 2000),
  gdp           NUMERIC     CHECK (gdp >= -10 AND gdp <= 10),
  fecha         DATE        NOT NULL DEFAULT CURRENT_DATE CHECK (fecha <= CURRENT_DATE),
  metodo        TEXT        NOT NULL DEFAULT 'manual' CHECK (metodo IN ('manual','rfid','bascula')),
  operario      TEXT        CHECK (char_length(operario) <= 100),
  observaciones TEXT        CHECK (char_length(observaciones) <= 1000),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ════════════════════════════════════════════════════════════
-- MÓDULO LOTES & CULTIVOS
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS lotes (
  id                  UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  establecimiento_id  UUID        NOT NULL REFERENCES establecimientos(id) ON DELETE CASCADE,
  nombre              TEXT        NOT NULL CHECK (char_length(nombre) BETWEEN 1 AND 100),
  superficie          NUMERIC     NOT NULL CHECK (superficie > 0),
  uso                 TEXT        NOT NULL DEFAULT 'Agricola'
                                    CHECK (uso IN ('Agricola','Ganadero','Mixto')),
  estado              TEXT        NOT NULL DEFAULT 'Barbecho'
                                    CHECK (estado IN ('Sembrado','Barbecho','Cosechado','Con hacienda','En preparacion')),
  cultivo_actual      TEXT        CHECK (char_length(cultivo_actual) <= 50),
  variedad            TEXT        CHECK (char_length(variedad) <= 100),
  fecha_siembra       DATE,
  fecha_cosecha_estim DATE,
  rendimiento_estim   NUMERIC     CHECK (rendimiento_estim > 0),
  rendimiento_real    NUMERIC     CHECK (rendimiento_real > 0),
  hacienda_actual     INTEGER     CHECK (hacienda_actual >= 0),
  -- Coordenadas SVG para el mapa de lotes (viewport 120×90)
  pos_x               NUMERIC     NOT NULL DEFAULT 10,
  pos_y               NUMERIC     NOT NULL DEFAULT 10,
  ancho               NUMERIC     NOT NULL DEFAULT 25,
  alto                NUMERIC     NOT NULL DEFAULT 18,
  observaciones       TEXT        CHECK (char_length(observaciones) <= 1000),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER lotes_upd BEFORE UPDATE ON lotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS labores (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  lote_id     UUID        NOT NULL REFERENCES lotes(id) ON DELETE CASCADE,
  fecha       DATE        NOT NULL DEFAULT CURRENT_DATE,
  tipo        TEXT        NOT NULL
                            CHECK (tipo IN ('Siembra','Fertilizacion','Aplicacion','Cosecha','Pulverizacion','Labranza')),
  detalle     TEXT        NOT NULL CHECK (char_length(detalle) BETWEEN 1 AND 500),
  operario    TEXT        CHECK (char_length(operario) <= 100),
  cantidad    TEXT        CHECK (char_length(cantidad) <= 100),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ════════════════════════════════════════════════════════════
-- MÓDULO INVENTARIO
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS productos_inventario (
  id                 UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  establecimiento_id UUID        NOT NULL REFERENCES establecimientos(id) ON DELETE CASCADE,
  nombre             TEXT        NOT NULL CHECK (char_length(nombre) BETWEEN 1 AND 200),
  categoria          TEXT        NOT NULL
                                   CHECK (categoria IN ('Agroquimico','Semilla','Fertilizante','Veterinario',
                                                        'Herramienta','Combustible','Lubricante','Otro')),
  marca              TEXT        CHECK (char_length(marca) <= 100),
  unidad             TEXT        NOT NULL DEFAULT 'unidades'
                                   CHECK (unidad IN ('litros','kg','unidades','dosis','bolsas','tn','bidon')),
  stock              NUMERIC     NOT NULL DEFAULT 0 CHECK (stock >= 0),
  stock_minimo       NUMERIC     NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
  stock_maximo       NUMERIC     CHECK (stock_maximo > 0),
  precio_unitario    NUMERIC     CHECK (precio_unitario >= 0),
  deposito           TEXT        CHECK (char_length(deposito) <= 100),
  vencimiento        DATE,
  codigo             TEXT        CHECK (char_length(codigo) <= 50),
  observaciones      TEXT        CHECK (char_length(observaciones) <= 500),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER productos_inventario_upd BEFORE UPDATE ON productos_inventario
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS movimientos_inventario (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id UUID        NOT NULL REFERENCES productos_inventario(id) ON DELETE CASCADE,
  tipo        TEXT        NOT NULL CHECK (tipo IN ('Entrada','Salida','Ajuste')),
  cantidad    NUMERIC     NOT NULL CHECK (cantidad > 0),
  fecha       DATE        NOT NULL DEFAULT CURRENT_DATE,
  motivo      TEXT        CHECK (char_length(motivo) <= 200),
  referencia  TEXT        CHECK (char_length(referencia) <= 50),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ════════════════════════════════════════════════════════════
-- MÓDULO MAQUINARIA
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS maquinas (
  id                        UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  establecimiento_id        UUID        NOT NULL REFERENCES establecimientos(id) ON DELETE CASCADE,
  nombre                    TEXT        NOT NULL CHECK (char_length(nombre) BETWEEN 1 AND 100),
  tipo                      TEXT        NOT NULL
                                          CHECK (tipo IN ('Tractor','Cosechadora','Sembradora',
                                                          'Pulverizadora','Implemento','Camion','Otro')),
  marca                     TEXT        CHECK (char_length(marca) <= 50),
  modelo                    TEXT        CHECK (char_length(modelo) <= 100),
  ano                       INTEGER     CHECK (ano BETWEEN 1950 AND 2100),
  patente                   TEXT        CHECK (char_length(patente) <= 20),
  horometro                 NUMERIC     NOT NULL DEFAULT 0 CHECK (horometro >= 0),
  horometro_proximo_service NUMERIC     CHECK (horometro_proximo_service >= 0),
  estado                    TEXT        NOT NULL DEFAULT 'Operativa'
                                          CHECK (estado IN ('Operativa','En mantenimiento','Fuera de servicio')),
  combustible_actual        NUMERIC     CHECK (combustible_actual >= 0),
  capacidad_tanque          NUMERIC     CHECK (capacidad_tanque > 0),
  consumo_promedio          NUMERIC     CHECK (consumo_promedio > 0),
  ultimo_service            DATE,
  observaciones             TEXT        CHECK (char_length(observaciones) <= 1000),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER maquinas_upd BEFORE UPDATE ON maquinas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS mantenimientos (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  maquina_id  UUID        NOT NULL REFERENCES maquinas(id) ON DELETE CASCADE,
  fecha       DATE        NOT NULL DEFAULT CURRENT_DATE,
  tipo        TEXT        NOT NULL CHECK (tipo IN ('Preventivo','Correctivo','Service','Reparacion')),
  detalle     TEXT        NOT NULL CHECK (char_length(detalle) BETWEEN 1 AND 500),
  horometro   NUMERIC     CHECK (horometro >= 0),
  costo       NUMERIC     NOT NULL DEFAULT 0 CHECK (costo >= 0),
  operario    TEXT        CHECK (char_length(operario) <= 100),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cargas_combustible (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  maquina_id  UUID        NOT NULL REFERENCES maquinas(id) ON DELETE CASCADE,
  fecha       DATE        NOT NULL DEFAULT CURRENT_DATE,
  litros      NUMERIC     NOT NULL CHECK (litros > 0),
  horometro   NUMERIC     CHECK (horometro >= 0),
  costo       NUMERIC     NOT NULL DEFAULT 0 CHECK (costo >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ════════════════════════════════════════════════════════════
-- MÓDULO FLOTA (VEHÍCULOS)
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS vehiculos (
  id                 UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  establecimiento_id UUID        NOT NULL REFERENCES establecimientos(id) ON DELETE CASCADE,
  nombre             TEXT        NOT NULL CHECK (char_length(nombre) BETWEEN 1 AND 100),
  tipo               TEXT        NOT NULL DEFAULT 'Camioneta'
                                   CHECK (tipo IN ('Camioneta','Camion','Acoplado','Utilitario','Auto','Moto')),
  marca              TEXT        CHECK (char_length(marca) <= 50),
  modelo             TEXT        CHECK (char_length(modelo) <= 100),
  ano                INTEGER     CHECK (ano BETWEEN 1950 AND 2100),
  patente            TEXT        CHECK (char_length(patente) <= 20),
  chasis             TEXT        CHECK (char_length(chasis) <= 50),
  km                 NUMERIC     NOT NULL DEFAULT 0 CHECK (km >= 0),
  estado             TEXT        NOT NULL DEFAULT 'Operativo'
                                   CHECK (estado IN ('Operativo','En taller','Fuera de servicio')),
  consumo_promedio   NUMERIC     CHECK (consumo_promedio > 0),
  combustible_actual NUMERIC     CHECK (combustible_actual >= 0),
  capacidad_tanque   NUMERIC     CHECK (capacidad_tanque > 0),
  asignado_a         TEXT        CHECK (char_length(asignado_a) <= 200),
  -- Documentación
  vtv_vencimiento      DATE,
  seguro_vencimiento   DATE,
  patente_vencimiento  DATE,
  observaciones      TEXT        CHECK (char_length(observaciones) <= 1000),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER vehiculos_upd BEFORE UPDATE ON vehiculos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Cargas de combustible para vehículos (usa km, no horómetro)
CREATE TABLE IF NOT EXISTS cargas_combustible_vehiculos (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  vehiculo_id UUID        NOT NULL REFERENCES vehiculos(id) ON DELETE CASCADE,
  fecha       DATE        NOT NULL DEFAULT CURRENT_DATE,
  litros      NUMERIC     NOT NULL CHECK (litros > 0),
  km          NUMERIC     CHECK (km >= 0),
  costo       NUMERIC     NOT NULL DEFAULT 0 CHECK (costo >= 0),
  estacion    TEXT        CHECK (char_length(estacion) <= 100),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ════════════════════════════════════════════════════════════
-- MÓDULO CONTACTOS
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS contactos (
  id                 UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  establecimiento_id UUID        NOT NULL REFERENCES establecimientos(id) ON DELETE CASCADE,
  nombre             TEXT        NOT NULL CHECK (char_length(nombre) BETWEEN 1 AND 200),
  razon_social       TEXT        CHECK (char_length(razon_social) <= 200),
  tipo               TEXT        NOT NULL
                                   CHECK (tipo IN ('Cliente','Proveedor','Asesor','Contratista','Transportista','Otro')),
  subtipo            TEXT        CHECK (char_length(subtipo) <= 100),
  estado             TEXT        NOT NULL DEFAULT 'Activo'
                                   CHECK (estado IN ('Activo','Inactivo','Potencial')),
  cuit               TEXT        CHECK (char_length(cuit) <= 15),
  telefono           TEXT        CHECK (char_length(telefono) <= 30),
  email              TEXT        CHECK (char_length(email) <= 200),
  direccion          TEXT        CHECK (char_length(direccion) <= 300),
  ciudad             TEXT        CHECK (char_length(ciudad) <= 100),
  provincia          TEXT        CHECK (char_length(provincia) <= 50),
  contacto_principal TEXT        CHECK (char_length(contacto_principal) <= 100),
  total_operaciones  INTEGER     NOT NULL DEFAULT 0 CHECK (total_operaciones >= 0),
  monto_acumulado    NUMERIC     NOT NULL DEFAULT 0 CHECK (monto_acumulado >= 0),
  ultima_operacion   DATE,
  rating             INTEGER     CHECK (rating BETWEEN 1 AND 5),
  observaciones      TEXT        CHECK (char_length(observaciones) <= 1000),
  tags               TEXT[]      NOT NULL DEFAULT '{}',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER contactos_upd BEFORE UPDATE ON contactos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ════════════════════════════════════════════════════════════
-- MÓDULO VENTAS
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ventas (
  id                  UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  establecimiento_id  UUID        NOT NULL REFERENCES establecimientos(id) ON DELETE CASCADE,
  numero              TEXT        NOT NULL CHECK (char_length(numero) BETWEEN 1 AND 30),
  fecha               DATE        NOT NULL DEFAULT CURRENT_DATE,
  tipo                TEXT        NOT NULL CHECK (tipo IN ('Hacienda','Granos','Servicios')),
  contacto_id         UUID        REFERENCES contactos(id) ON DELETE SET NULL,
  cliente             TEXT        NOT NULL CHECK (char_length(cliente) BETWEEN 1 AND 200),
  estado              TEXT        NOT NULL DEFAULT 'Pendiente'
                                    CHECK (estado IN ('Pendiente','Confirmada','Liquidada','Cancelada')),
  -- Campos para tipo = 'Hacienda'
  categoria_hacienda  TEXT        CHECK (char_length(categoria_hacienda) <= 100),
  cabezas             INTEGER     CHECK (cabezas > 0),
  peso_promedio       NUMERIC     CHECK (peso_promedio > 0),
  peso_total          NUMERIC     CHECK (peso_total > 0),
  precio_kg           NUMERIC     CHECK (precio_kg > 0),
  -- Campos para tipo = 'Granos'
  producto_grano      TEXT        CHECK (char_length(producto_grano) <= 50),
  toneladas           NUMERIC     CHECK (toneladas > 0),
  precio_tonelada     NUMERIC     CHECK (precio_tonelada > 0),
  lote_origen         TEXT        CHECK (char_length(lote_origen) <= 100),
  -- Campos comunes
  total               NUMERIC     NOT NULL DEFAULT 0 CHECK (total >= 0),
  moneda              TEXT        NOT NULL DEFAULT 'USD' CHECK (moneda IN ('USD','ARS')),
  metodo_pago         TEXT        NOT NULL
                                    CHECK (metodo_pago IN ('Transferencia','Cheque','Efectivo','Forward')),
  fecha_pago          DATE,
  comisiones          NUMERIC     CHECK (comisiones >= 0),
  flete               NUMERIC     CHECK (flete >= 0),
  destino             TEXT        CHECK (char_length(destino) <= 300),
  observaciones       TEXT        CHECK (char_length(observaciones) <= 1000),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (establecimiento_id, numero)
);
CREATE TRIGGER ventas_upd BEFORE UPDATE ON ventas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ════════════════════════════════════════════════════════════
-- MÓDULO COMPRAS
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS compras (
  id                 UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  establecimiento_id UUID        NOT NULL REFERENCES establecimientos(id) ON DELETE CASCADE,
  numero             TEXT        NOT NULL CHECK (char_length(numero) BETWEEN 1 AND 30),
  fecha              DATE        NOT NULL DEFAULT CURRENT_DATE,
  fecha_entrega      DATE,
  contacto_id        UUID        REFERENCES contactos(id) ON DELETE SET NULL,
  proveedor          TEXT        NOT NULL CHECK (char_length(proveedor) BETWEEN 1 AND 200),
  categoria          TEXT        NOT NULL
                                   CHECK (categoria IN ('Agroquimico','Semilla','Fertilizante','Combustible',
                                                        'Veterinario','Servicios','Repuestos','Otro')),
  estado             TEXT        NOT NULL DEFAULT 'Borrador'
                                   CHECK (estado IN ('Borrador','Enviada','Confirmada','Recibida','Pagada','Cancelada')),
  subtotal           NUMERIC     NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  iva                NUMERIC     NOT NULL DEFAULT 0 CHECK (iva >= 0),
  total              NUMERIC     NOT NULL DEFAULT 0 CHECK (total >= 0),
  moneda             TEXT        NOT NULL DEFAULT 'USD' CHECK (moneda IN ('USD','ARS')),
  metodo_pago        TEXT        NOT NULL
                                   CHECK (metodo_pago IN ('Transferencia','Cheque','Cuenta corriente','Tarjeta','Forward')),
  fecha_pago         DATE,
  numero_factura     TEXT        CHECK (char_length(numero_factura) <= 50),
  destino_deposito   TEXT        CHECK (char_length(destino_deposito) <= 100),
  observaciones      TEXT        CHECK (char_length(observaciones) <= 1000),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (establecimiento_id, numero)
);
CREATE TRIGGER compras_upd BEFORE UPDATE ON compras
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS items_compra (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  compra_id       UUID        NOT NULL REFERENCES compras(id) ON DELETE CASCADE,
  descripcion     TEXT        NOT NULL CHECK (char_length(descripcion) BETWEEN 1 AND 300),
  cantidad        NUMERIC     NOT NULL CHECK (cantidad > 0),
  unidad          TEXT        NOT NULL DEFAULT 'unidades' CHECK (char_length(unidad) <= 20),
  precio_unitario NUMERIC     NOT NULL CHECK (precio_unitario >= 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ════════════════════════════════════════════════════════════
-- MÓDULO CONTABILIDAD
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS movimientos_contables (
  id                 UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  establecimiento_id UUID        NOT NULL REFERENCES establecimientos(id) ON DELETE CASCADE,
  fecha              DATE        NOT NULL DEFAULT CURRENT_DATE,
  tipo               TEXT        NOT NULL CHECK (tipo IN ('Ingreso','Egreso')),
  categoria          TEXT        NOT NULL
                                   CHECK (categoria IN (
                                     'Venta hacienda','Venta granos','Servicios',
                                     'Insumos','Combustible','Salarios','Servicios profesionales',
                                     'Maquinaria','Veterinaria','Impuestos','Financiero','Otros'
                                   )),
  detalle            TEXT        NOT NULL CHECK (char_length(detalle) BETWEEN 1 AND 500),
  contraparte        TEXT        CHECK (char_length(contraparte) <= 200),
  monto              NUMERIC     NOT NULL CHECK (monto >= 0),
  moneda             TEXT        NOT NULL DEFAULT 'USD' CHECK (moneda IN ('USD','ARS')),
  centro_costo       TEXT        CHECK (char_length(centro_costo) <= 100),
  campania           TEXT        CHECK (char_length(campania) <= 20),
  comprobante        TEXT        CHECK (char_length(comprobante) <= 50),
  metodo_pago        TEXT        CHECK (char_length(metodo_pago) <= 50),
  conciliado         BOOLEAN     NOT NULL DEFAULT false,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ════════════════════════════════════════════════════════════
-- MÓDULO RRHH
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS empleados (
  id                  UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  establecimiento_id  UUID        NOT NULL REFERENCES establecimientos(id) ON DELETE CASCADE,
  nombre              TEXT        NOT NULL CHECK (char_length(nombre) BETWEEN 1 AND 200),
  dni                 TEXT        CHECK (char_length(dni) <= 20),
  cuil                TEXT        CHECK (char_length(cuil) <= 20),
  fecha_nacimiento    DATE,
  fecha_ingreso       DATE        NOT NULL DEFAULT CURRENT_DATE,
  cargo               TEXT        NOT NULL
                                    CHECK (cargo IN ('Encargado','Tractorista','Peon general',
                                                     'Veterinario','Mecanico','Ordenador','Capataz','Otro')),
  tipo                TEXT        NOT NULL DEFAULT 'En blanco'
                                    CHECK (tipo IN ('En blanco','Jornalero','Contratista','Eventual')),
  estado              TEXT        NOT NULL DEFAULT 'Activo'
                                    CHECK (estado IN ('Activo','Licencia','Vacaciones','Inactivo')),
  telefono            TEXT        CHECK (char_length(telefono) <= 30),
  email               TEXT        CHECK (char_length(email) <= 200),
  direccion           TEXT        CHECK (char_length(direccion) <= 300),
  ciudad              TEXT        CHECK (char_length(ciudad) <= 100),
  sueldo_basico       NUMERIC     CHECK (sueldo_basico >= 0),
  jornal_diario       NUMERIC     CHECK (jornal_diario >= 0),
  dias_trabajados_mes INTEGER     CHECK (dias_trabajados_mes BETWEEN 0 AND 31),
  obra_social         TEXT        CHECK (char_length(obra_social) <= 100),
  art                 TEXT        CHECK (char_length(art) <= 100),
  art_vencimiento     DATE,
  observaciones       TEXT        CHECK (char_length(observaciones) <= 1000),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER empleados_upd BEFORE UPDATE ON empleados
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS liquidaciones (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  empleado_id UUID        NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
  mes         TEXT        NOT NULL
                            CHECK (mes IN ('Enero','Febrero','Marzo','Abril','Mayo','Junio',
                                          'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre')),
  ano         INTEGER     NOT NULL CHECK (ano BETWEEN 2020 AND 2100),
  bruto       NUMERIC     NOT NULL CHECK (bruto >= 0),
  descuentos  NUMERIC     NOT NULL DEFAULT 0 CHECK (descuentos >= 0),
  neto        NUMERIC     NOT NULL CHECK (neto >= 0),
  estado      TEXT        NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente','Pagada')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (empleado_id, mes, ano)
);


-- ════════════════════════════════════════════════════════════
-- MÓDULO IOT & RFID
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dispositivos_iot (
  id                 UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  establecimiento_id UUID        NOT NULL REFERENCES establecimientos(id) ON DELETE CASCADE,
  nombre             TEXT        NOT NULL CHECK (char_length(nombre) BETWEEN 1 AND 100),
  tipo               TEXT        NOT NULL
                                   CHECK (tipo IN ('Lector manga','Lector portatil','Bascula',
                                                   'Lector + Bascula','Collar GPS','Estacion meteo')),
  marca              TEXT        CHECK (char_length(marca) <= 50),
  modelo             TEXT        CHECK (char_length(modelo) <= 100),
  mac                TEXT        CHECK (char_length(mac) <= 30),
  estado             TEXT        NOT NULL DEFAULT 'Disponible'
                                   CHECK (estado IN ('Conectado','Disponible','Desconectado','Error')),
  bateria            INTEGER     CHECK (bateria BETWEEN 0 AND 100),
  ultima_conexion    TIMESTAMPTZ NOT NULL DEFAULT now(),
  ubicacion          TEXT        CHECK (char_length(ubicacion) <= 200),
  lecturas_hoy       INTEGER     NOT NULL DEFAULT 0 CHECK (lecturas_hoy >= 0),
  firmware           TEXT        CHECK (char_length(firmware) <= 50),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER dispositivos_iot_upd BEFORE UPDATE ON dispositivos_iot
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS sesiones_rfid (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  dispositivo_id   UUID        NOT NULL REFERENCES dispositivos_iot(id) ON DELETE CASCADE,
  inicio           TIMESTAMPTZ NOT NULL DEFAULT now(),
  fin              TIMESTAMPTZ,
  estado           TEXT        NOT NULL DEFAULT 'Activa'
                                 CHECK (estado IN ('Activa','Pausada','Finalizada')),
  animales_leidos  INTEGER     NOT NULL DEFAULT 0 CHECK (animales_leidos >= 0),
  alertas          INTEGER     NOT NULL DEFAULT 0 CHECK (alertas >= 0),
  duracion_minutos INTEGER     NOT NULL DEFAULT 0 CHECK (duracion_minutos >= 0),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lecturas_rfid (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  sesion_id      UUID        REFERENCES sesiones_rfid(id) ON DELETE SET NULL,
  dispositivo_id UUID        NOT NULL REFERENCES dispositivos_iot(id) ON DELETE CASCADE,
  animal_id      UUID        REFERENCES animales(id) ON DELETE SET NULL,
  hora           TIMESTAMPTZ NOT NULL DEFAULT now(),
  caravana       TEXT        NOT NULL CHECK (char_length(caravana) BETWEEN 1 AND 50),
  peso           NUMERIC     CHECK (peso > 0 AND peso <= 2000),
  estado         TEXT        NOT NULL DEFAULT 'OK'
                               CHECK (estado IN ('OK','Alerta','No registrado')),
  alerta_motivo  TEXT        CHECK (char_length(alerta_motivo) <= 200),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ════════════════════════════════════════════════════════════
-- ÍNDICES DE PERFORMANCE
-- ════════════════════════════════════════════════════════════

-- Claves foráneas (cubren JOINs y políticas RLS)
CREATE INDEX IF NOT EXISTS idx_perfil_usuarios_est    ON perfil_usuarios(establecimiento_id);
CREATE INDEX IF NOT EXISTS idx_animales_est           ON animales(establecimiento_id);
CREATE INDEX IF NOT EXISTS idx_pesadas_animal         ON pesadas(animal_id);
CREATE INDEX IF NOT EXISTS idx_lotes_est              ON lotes(establecimiento_id);
CREATE INDEX IF NOT EXISTS idx_labores_lote           ON labores(lote_id);
CREATE INDEX IF NOT EXISTS idx_productos_est          ON productos_inventario(establecimiento_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_inv_prod   ON movimientos_inventario(producto_id);
CREATE INDEX IF NOT EXISTS idx_maquinas_est           ON maquinas(establecimiento_id);
CREATE INDEX IF NOT EXISTS idx_mantenimientos_maq     ON mantenimientos(maquina_id);
CREATE INDEX IF NOT EXISTS idx_cargas_comb_maq        ON cargas_combustible(maquina_id);
CREATE INDEX IF NOT EXISTS idx_vehiculos_est          ON vehiculos(establecimiento_id);
CREATE INDEX IF NOT EXISTS idx_cargas_comb_veh        ON cargas_combustible_vehiculos(vehiculo_id);
CREATE INDEX IF NOT EXISTS idx_contactos_est          ON contactos(establecimiento_id);
CREATE INDEX IF NOT EXISTS idx_ventas_est             ON ventas(establecimiento_id);
CREATE INDEX IF NOT EXISTS idx_compras_est            ON compras(establecimiento_id);
CREATE INDEX IF NOT EXISTS idx_items_compra           ON items_compra(compra_id);
CREATE INDEX IF NOT EXISTS idx_mov_contables_est      ON movimientos_contables(establecimiento_id);
CREATE INDEX IF NOT EXISTS idx_empleados_est          ON empleados(establecimiento_id);
CREATE INDEX IF NOT EXISTS idx_liquidaciones_emp      ON liquidaciones(empleado_id);
CREATE INDEX IF NOT EXISTS idx_dispositivos_est       ON dispositivos_iot(establecimiento_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_disp          ON sesiones_rfid(dispositivo_id);
CREATE INDEX IF NOT EXISTS idx_lecturas_sesion        ON lecturas_rfid(sesion_id);
CREATE INDEX IF NOT EXISTS idx_lecturas_animal        ON lecturas_rfid(animal_id);

-- Búsquedas frecuentes por valor (filtros de UI y dashboard)
CREATE INDEX IF NOT EXISTS idx_animales_caravana      ON animales(caravana);
CREATE INDEX IF NOT EXISTS idx_mov_contables_fecha    ON movimientos_contables(fecha);
CREATE INDEX IF NOT EXISTS idx_lecturas_rfid_hora     ON lecturas_rfid(hora);
-- ventas(numero) y compras(numero) ya tienen índice implícito por UNIQUE(establecimiento_id, numero)
