-- ============================================================================
-- CampoOS · Módulo Asesor — Migración 01: tabla visitas_campo
-- ----------------------------------------------------------------------------
-- Aplicar en: Supabase → SQL Editor → pegar TODO → Run
-- Es IDEMPOTENTE: se puede correr más de una vez sin romper nada.
-- NO toca ninguna tabla existente ni la función mi_est_id().
-- ============================================================================

-- ─── 1. TABLA ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS visitas_campo (
  id                 UUID        PRIMARY KEY,                  -- UUID generado en el cliente
  establecimiento_id UUID        NOT NULL
                       REFERENCES establecimientos(id) ON DELETE CASCADE,
  asesor_id          UUID        NOT NULL DEFAULT auth.uid(),  -- autor de la visita (auditoría)
  lote_id            UUID        REFERENCES lotes(id) ON DELETE SET NULL,
  fecha              DATE        NOT NULL DEFAULT CURRENT_DATE
                       CHECK (fecha <= CURRENT_DATE),
  cultivo            TEXT        CHECK (char_length(cultivo) <= 100),
  estado_fenologico  TEXT        CHECK (char_length(estado_fenologico) <= 100),
  labores            TEXT        CHECK (char_length(labores) <= 4000),
  observaciones      TEXT        CHECK (char_length(observaciones) <= 4000),
  analisis           TEXT        CHECK (char_length(analisis) <= 4000),
  recomendaciones    TEXT        CHECK (char_length(recomendaciones) <= 4000),
  proxima_visita     DATE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- La próxima visita no puede ser anterior a la fecha de la visita
  CONSTRAINT visitas_proxima_coherente
    CHECK (proxima_visita IS NULL OR proxima_visita >= fecha)
);

-- ─── 2. ÍNDICES ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_visitas_est    ON visitas_campo(establecimiento_id);
CREATE INDEX IF NOT EXISTS idx_visitas_lote   ON visitas_campo(lote_id);
CREATE INDEX IF NOT EXISTS idx_visitas_asesor ON visitas_campo(asesor_id);
CREATE INDEX IF NOT EXISTS idx_visitas_fecha  ON visitas_campo(fecha DESC);

-- ─── 3. TRIGGER: updated_at + blindaje de campos sensibles ──────────────────
-- Mantiene updated_at y BLINDA los campos de auditoría/tenant: una vez creada la
-- visita, nadie puede cambiar quién la creó, cuándo, ni de qué establecimiento es
-- (aunque el cliente mande esos campos en un UPDATE, se ignoran).
-- search_path = '' evita ataques de secuestro de search_path en la función.
CREATE OR REPLACE FUNCTION visitas_campo_guard()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  NEW.updated_at         := now();
  NEW.asesor_id          := OLD.asesor_id;           -- inmutable
  NEW.created_at         := OLD.created_at;           -- inmutable
  NEW.establecimiento_id := OLD.establecimiento_id;   -- inmutable (no se migra de tenant)
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS visitas_campo_guard_trg ON visitas_campo;
CREATE TRIGGER visitas_campo_guard_trg
  BEFORE UPDATE ON visitas_campo
  FOR EACH ROW EXECUTE FUNCTION visitas_campo_guard();

-- ─── 4. ROW LEVEL SECURITY ──────────────────────────────────────────────────
ALTER TABLE visitas_campo ENABLE ROW LEVEL SECURITY;

-- SELECT — cualquier usuario del establecimiento ve sus visitas (igual que lotes)
DROP POLICY IF EXISTS "visitas_campo_select" ON visitas_campo;
CREATE POLICY "visitas_campo_select" ON visitas_campo
  FOR SELECT USING (establecimiento_id = mi_est_id());

-- INSERT — mismo establecimiento + autor real (anti-falsificación) + rol con
--          permiso de escritura + el lote (si hay) tiene que ser del mismo establecimiento
DROP POLICY IF EXISTS "visitas_campo_insert" ON visitas_campo;
CREATE POLICY "visitas_campo_insert" ON visitas_campo
  FOR INSERT WITH CHECK (
        establecimiento_id = mi_est_id()
    AND asesor_id = auth.uid()
    AND (SELECT rol FROM perfil_usuarios WHERE user_id = auth.uid()) IN ('admin','operario')
    AND (lote_id IS NULL OR lote_id IN (SELECT id FROM lotes WHERE establecimiento_id = mi_est_id()))
  );

-- UPDATE — mismo establecimiento + rol con permiso; no permite reasignar a un lote ajeno
DROP POLICY IF EXISTS "visitas_campo_update" ON visitas_campo;
CREATE POLICY "visitas_campo_update" ON visitas_campo
  FOR UPDATE
  USING (
        establecimiento_id = mi_est_id()
    AND (SELECT rol FROM perfil_usuarios WHERE user_id = auth.uid()) IN ('admin','operario')
  )
  WITH CHECK (
        establecimiento_id = mi_est_id()
    AND (lote_id IS NULL OR lote_id IN (SELECT id FROM lotes WHERE establecimiento_id = mi_est_id()))
  );

-- DELETE — más estricto que lotes A PROPÓSITO: solo el admin del establecimiento o el autor
DROP POLICY IF EXISTS "visitas_campo_delete" ON visitas_campo;
CREATE POLICY "visitas_campo_delete" ON visitas_campo
  FOR DELETE USING (
        establecimiento_id = mi_est_id()
    AND (
          (SELECT rol FROM perfil_usuarios WHERE user_id = auth.uid()) = 'admin'
       OR asesor_id = auth.uid()
    )
  );

-- ─── 5. VERIFICACIÓN (opcional — corré esto después de aplicar) ──────────────
-- Confirmá que quedaron las 4 policies y el RLS activo:
--   SELECT policyname, cmd FROM pg_policies WHERE tablename = 'visitas_campo' ORDER BY cmd;
--   SELECT relrowsecurity FROM pg_class WHERE relname = 'visitas_campo';  -- debe dar 't'
