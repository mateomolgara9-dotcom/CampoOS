-- ============================================================================
-- CampoOS · Módulo Asesor — Migración 03: Manejo Técnico por campaña
-- ----------------------------------------------------------------------------
-- Basado en la planilla real del asesor (hoja "Manejo Tecnico"): bitácora de
-- labores/aplicaciones por CAMPAÑA, con productos, comprobante y responsable.
--
-- Aplicar en: Supabase → SQL Editor → pegar TODO → Run  (idempotente).
-- Evoluciona visitas_campo (Fase 1) — segura porque la tabla está vacía.
-- ============================================================================


-- ─── 1. TABLA campanias (la unidad de organización) ─────────────────────────
CREATE TABLE IF NOT EXISTS campanias (
  id                 UUID        PRIMARY KEY,                  -- UUID del cliente
  establecimiento_id UUID        NOT NULL REFERENCES establecimientos(id) ON DELETE CASCADE,
  asesor_id          UUID        NOT NULL DEFAULT auth.uid(),  -- autor (auditoría)
  lote_id            UUID        REFERENCES lotes(id) ON DELETE SET NULL,
  nombre             TEXT        NOT NULL CHECK (char_length(nombre) BETWEEN 1 AND 50),  -- "2024-2025"
  cultivo            TEXT        CHECK (char_length(cultivo) <= 50),
  variedad           TEXT        CHECK (char_length(variedad) <= 100),
  superficie         NUMERIC     CHECK (superficie > 0),
  fecha_inicio       DATE,
  fecha_fin          DATE,
  estado             TEXT        NOT NULL DEFAULT 'En curso' CHECK (estado IN ('En curso','Cerrada')),
  observaciones      TEXT        CHECK (char_length(observaciones) <= 2000),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT campania_fechas CHECK (fecha_fin IS NULL OR fecha_inicio IS NULL OR fecha_fin >= fecha_inicio)
);
CREATE INDEX IF NOT EXISTS idx_campanias_est  ON campanias(establecimiento_id);
CREATE INDEX IF NOT EXISTS idx_campanias_lote ON campanias(lote_id);

-- Guard: updated_at + blinda auditoría/tenant
CREATE OR REPLACE FUNCTION campanias_guard()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  NEW.updated_at         := now();
  NEW.asesor_id          := OLD.asesor_id;
  NEW.created_at         := OLD.created_at;
  NEW.establecimiento_id := OLD.establecimiento_id;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS campanias_guard_trg ON campanias;
CREATE TRIGGER campanias_guard_trg
  BEFORE UPDATE ON campanias
  FOR EACH ROW EXECUTE FUNCTION campanias_guard();

-- RLS (mismo blindaje que visitas_campo)
ALTER TABLE campanias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "campanias_select" ON campanias;
CREATE POLICY "campanias_select" ON campanias
  FOR SELECT USING (establecimiento_id = mi_est_id());

DROP POLICY IF EXISTS "campanias_insert" ON campanias;
CREATE POLICY "campanias_insert" ON campanias
  FOR INSERT WITH CHECK (
        establecimiento_id = mi_est_id()
    AND asesor_id = auth.uid()
    AND (SELECT rol FROM perfil_usuarios WHERE user_id = auth.uid()) IN ('admin','operario')
    AND (lote_id IS NULL OR lote_id IN (SELECT id FROM lotes WHERE establecimiento_id = mi_est_id()))
  );

DROP POLICY IF EXISTS "campanias_update" ON campanias;
CREATE POLICY "campanias_update" ON campanias
  FOR UPDATE
  USING (
        establecimiento_id = mi_est_id()
    AND (SELECT rol FROM perfil_usuarios WHERE user_id = auth.uid()) IN ('admin','operario')
  )
  WITH CHECK (
        establecimiento_id = mi_est_id()
    AND (lote_id IS NULL OR lote_id IN (SELECT id FROM lotes WHERE establecimiento_id = mi_est_id()))
  );

DROP POLICY IF EXISTS "campanias_delete" ON campanias;
CREATE POLICY "campanias_delete" ON campanias
  FOR DELETE USING (
        establecimiento_id = mi_est_id()
    AND (
          (SELECT rol FROM perfil_usuarios WHERE user_id = auth.uid()) = 'admin'
       OR asesor_id = auth.uid()
    )
  );


-- ─── 2. EVOLUCIONAR visitas_campo → evento/labor de la campaña ──────────────
ALTER TABLE visitas_campo ADD COLUMN IF NOT EXISTS campania_id UUID REFERENCES campanias(id) ON DELETE CASCADE;
ALTER TABLE visitas_campo ADD COLUMN IF NOT EXISTS tipo        TEXT CHECK (char_length(tipo) <= 100);
ALTER TABLE visitas_campo ADD COLUMN IF NOT EXISTS comprobante TEXT CHECK (char_length(comprobante) <= 50);
ALTER TABLE visitas_campo ADD COLUMN IF NOT EXISTS responsable TEXT CHECK (char_length(responsable) <= 150);
ALTER TABLE visitas_campo DROP COLUMN IF EXISTS cultivo;   -- ahora vive en campanias
ALTER TABLE visitas_campo DROP COLUMN IF EXISTS labores;   -- reemplazado por visita_productos + tipo
CREATE INDEX IF NOT EXISTS idx_visitas_campania ON visitas_campo(campania_id);

-- Policies de insert/update: sumar integridad de campaña (del mismo establecimiento)
DROP POLICY IF EXISTS "visitas_campo_insert" ON visitas_campo;
CREATE POLICY "visitas_campo_insert" ON visitas_campo
  FOR INSERT WITH CHECK (
        establecimiento_id = mi_est_id()
    AND asesor_id = auth.uid()
    AND (SELECT rol FROM perfil_usuarios WHERE user_id = auth.uid()) IN ('admin','operario')
    AND (lote_id     IS NULL OR lote_id     IN (SELECT id FROM lotes     WHERE establecimiento_id = mi_est_id()))
    AND (campania_id IS NULL OR campania_id IN (SELECT id FROM campanias WHERE establecimiento_id = mi_est_id()))
  );

DROP POLICY IF EXISTS "visitas_campo_update" ON visitas_campo;
CREATE POLICY "visitas_campo_update" ON visitas_campo
  FOR UPDATE
  USING (
        establecimiento_id = mi_est_id()
    AND (SELECT rol FROM perfil_usuarios WHERE user_id = auth.uid()) IN ('admin','operario')
  )
  WITH CHECK (
        establecimiento_id = mi_est_id()
    AND (lote_id     IS NULL OR lote_id     IN (SELECT id FROM lotes     WHERE establecimiento_id = mi_est_id()))
    AND (campania_id IS NULL OR campania_id IN (SELECT id FROM campanias WHERE establecimiento_id = mi_est_id()))
  );
-- (las policies select/delete de Fase 1 siguen valiendo tal cual)


-- ─── 3. TABLA visita_productos (los productos de cada labor) ─────────────────
CREATE TABLE IF NOT EXISTS visita_productos (
  id         UUID        PRIMARY KEY,                  -- UUID del cliente
  visita_id  UUID        NOT NULL REFERENCES visitas_campo(id) ON DELETE CASCADE,
  producto   TEXT        NOT NULL CHECK (char_length(producto) BETWEEN 1 AND 150),
  cantidad   NUMERIC     CHECK (cantidad >= 0),
  unidad     TEXT        CHECK (char_length(unidad) <= 20),  -- lt, kg, dosis, bolsas...
  orden      INTEGER,                                        -- para conservar el orden de la lista
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_visita_productos_visita ON visita_productos(visita_id);

-- RLS vía la visita padre (patrón labores/pesadas) + escritura solo admin/operario
ALTER TABLE visita_productos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "visita_productos_select" ON visita_productos;
CREATE POLICY "visita_productos_select" ON visita_productos
  FOR SELECT USING (
    visita_id IN (SELECT id FROM visitas_campo WHERE establecimiento_id = mi_est_id())
  );

DROP POLICY IF EXISTS "visita_productos_insert" ON visita_productos;
CREATE POLICY "visita_productos_insert" ON visita_productos
  FOR INSERT WITH CHECK (
    visita_id IN (SELECT id FROM visitas_campo WHERE establecimiento_id = mi_est_id())
    AND (SELECT rol FROM perfil_usuarios WHERE user_id = auth.uid()) IN ('admin','operario')
  );

DROP POLICY IF EXISTS "visita_productos_update" ON visita_productos;
CREATE POLICY "visita_productos_update" ON visita_productos
  FOR UPDATE USING (
    visita_id IN (SELECT id FROM visitas_campo WHERE establecimiento_id = mi_est_id())
    AND (SELECT rol FROM perfil_usuarios WHERE user_id = auth.uid()) IN ('admin','operario')
  );

DROP POLICY IF EXISTS "visita_productos_delete" ON visita_productos;
CREATE POLICY "visita_productos_delete" ON visita_productos
  FOR DELETE USING (
    visita_id IN (SELECT id FROM visitas_campo WHERE establecimiento_id = mi_est_id())
    AND (SELECT rol FROM perfil_usuarios WHERE user_id = auth.uid()) IN ('admin','operario')
  );


-- ─── 4. VERIFICACIÓN (opcional) ─────────────────────────────────────────────
-- SELECT table_name FROM information_schema.tables
--  WHERE table_name IN ('campanias','visita_productos');            -- 2 filas
-- SELECT column_name FROM information_schema.columns
--  WHERE table_name='visitas_campo' AND column_name IN ('campania_id','tipo','comprobante','responsable');  -- 4
-- SELECT tablename, count(*) FROM pg_policies
--  WHERE tablename IN ('campanias','visita_productos') GROUP BY tablename;  -- 4 y 4
