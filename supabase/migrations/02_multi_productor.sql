-- ============================================================================
-- CampoOS · Módulo Asesor — Migración 02: acceso multi-productor
-- ----------------------------------------------------------------------------
-- Modelo: Asesor → Productores → Campos (establecimientos) → Lotes → Visitas.
-- Opción A (un campo ACTIVO por vez) + nivel Productor encima.
--
-- Aplicar en: Supabase → SQL Editor → pegar TODO → Run  (idempotente).
-- TOCA EL CORE: mi_est_id(), policies de establecimientos y un trigger en
-- perfil_usuarios (cierra una fuga entre tenants). Backward-compatible: un
-- usuario normal se comporta EXACTAMENTE igual que hoy.
-- ============================================================================


-- ─── 1. TABLA productores (dueño = el asesor) ───────────────────────────────
CREATE TABLE IF NOT EXISTS productores (
  id             UUID        PRIMARY KEY,                  -- UUID generado en el cliente
  asesor_id      UUID        NOT NULL DEFAULT auth.uid(),  -- dueño = asesor logueado
  nombre         TEXT        NOT NULL CHECK (char_length(nombre) BETWEEN 1 AND 200),
  razon_social   TEXT        CHECK (char_length(razon_social) <= 200),
  cuit           TEXT        CHECK (char_length(cuit) <= 15),
  telefono       TEXT        CHECK (char_length(telefono) <= 30),
  email          TEXT        CHECK (char_length(email) <= 200),
  localidad      TEXT        CHECK (char_length(localidad) <= 100),
  provincia      TEXT        CHECK (char_length(provincia) <= 50),
  observaciones  TEXT        CHECK (char_length(observaciones) <= 1000),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_productores_asesor ON productores(asesor_id);

-- Trigger: updated_at + blinda dueño/creación (inmutables)
CREATE OR REPLACE FUNCTION productores_guard()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  NEW.updated_at := now();
  NEW.asesor_id  := OLD.asesor_id;   -- inmutable
  NEW.created_at := OLD.created_at;   -- inmutable
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS productores_guard_trg ON productores;
CREATE TRIGGER productores_guard_trg
  BEFORE UPDATE ON productores
  FOR EACH ROW EXECUTE FUNCTION productores_guard();

-- RLS: cada asesor ve y maneja SOLO sus productores
ALTER TABLE productores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "productores_select" ON productores;
CREATE POLICY "productores_select" ON productores
  FOR SELECT USING (asesor_id = auth.uid());

DROP POLICY IF EXISTS "productores_insert" ON productores;
CREATE POLICY "productores_insert" ON productores
  FOR INSERT WITH CHECK (asesor_id = auth.uid());

DROP POLICY IF EXISTS "productores_update" ON productores;
CREATE POLICY "productores_update" ON productores
  FOR UPDATE USING (asesor_id = auth.uid());

DROP POLICY IF EXISTS "productores_delete" ON productores;
CREATE POLICY "productores_delete" ON productores
  FOR DELETE USING (asesor_id = auth.uid());


-- ─── 2. establecimientos.productor_id (un productor → varios campos) ─────────
ALTER TABLE establecimientos
  ADD COLUMN IF NOT EXISTS productor_id UUID REFERENCES productores(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_establecimientos_productor ON establecimientos(productor_id);


-- ─── 3. perfil_usuarios.establecimiento_activo_id (el "campo activo") ────────
ALTER TABLE perfil_usuarios
  ADD COLUMN IF NOT EXISTS establecimiento_activo_id UUID REFERENCES establecimientos(id) ON DELETE SET NULL;


-- ─── 4. HELPERS de permiso (SECURITY DEFINER → sin recursión de RLS) ─────────

-- ¿El campo est_id pertenece a alguno de MIS productores (soy el asesor)?
CREATE OR REPLACE FUNCTION es_campo_de_mi_productor(est_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.establecimientos e
    JOIN public.productores p ON e.productor_id = p.id
    WHERE p.asesor_id = auth.uid() AND e.id = est_id
  );
$$;

-- ¿Tengo permiso sobre el campo est_id? (mi propio perfil O un campo de mi productor)
CREATE OR REPLACE FUNCTION es_mi_establecimiento(est_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = '' AS $$
  SELECT
    EXISTS (
      SELECT 1 FROM public.perfil_usuarios
      WHERE user_id = auth.uid() AND establecimiento_id = est_id
    )
    OR public.es_campo_de_mi_productor(est_id);
$$;


-- ─── 5. mi_est_id() REESCRITA — devuelve el campo ACTIVO (re-validado) ───────
-- Doble capa de seguridad: aunque alguien ponga un UUID ajeno como "activo",
-- acá se re-valida el permiso y NO se devuelve (cae al comportamiento actual).
CREATE OR REPLACE FUNCTION mi_est_id()
RETURNS UUID LANGUAGE sql SECURITY DEFINER STABLE SET search_path = '' AS $$
  SELECT COALESCE(
    -- 1) el campo activo, SOLO si el usuario tiene permiso sobre él
    (
      SELECT pu.establecimiento_activo_id
      FROM public.perfil_usuarios pu
      WHERE pu.user_id = auth.uid()
        AND pu.establecimiento_activo_id IS NOT NULL
        AND public.es_mi_establecimiento(pu.establecimiento_activo_id)
    ),
    -- 2) fallback: el establecimiento del perfil (comportamiento de siempre)
    (SELECT establecimiento_id FROM public.perfil_usuarios WHERE user_id = auth.uid() LIMIT 1)
  );
$$;


-- ─── 6. POLICIES de establecimientos (extendidas para el asesor) ────────────

-- CREAR — cualquiera logueado; si adjunta productor_id, tiene que ser SUYO
DROP POLICY IF EXISTS "crear_establecimiento" ON establecimientos;
CREATE POLICY "crear_establecimiento" ON establecimientos
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      productor_id IS NULL
      OR productor_id IN (SELECT id FROM productores WHERE asesor_id = auth.uid())
    )
  );

-- VER — mi establecimiento (como hoy) O los campos de mis productores
DROP POLICY IF EXISTS "ver_mi_establecimiento" ON establecimientos;
CREATE POLICY "ver_mi_establecimiento" ON establecimientos
  FOR SELECT USING (es_mi_establecimiento(id));

-- EDITAR — admin de mi propio campo (como hoy) O los campos de mis productores
DROP POLICY IF EXISTS "editar_mi_establecimiento" ON establecimientos;
CREATE POLICY "editar_mi_establecimiento" ON establecimientos
  FOR UPDATE USING (
    id IN (
      SELECT establecimiento_id FROM perfil_usuarios
       WHERE user_id = auth.uid() AND rol = 'admin'
    )
    OR es_campo_de_mi_productor(id)
  );


-- ─── 7. FIX DE SEGURIDAD — blindar perfil_usuarios ──────────────────────────
-- Cierra la fuga entre tenants: hace inmutables establecimiento_id, rol y
-- user_id vía auto-servicio. Se PUEDE cambiar establecimiento_activo_id (el
-- switcher) y nombre_completo/avatar. Additive: nada en la app actualiza estos
-- campos hoy. (El trigger de updated_at existente sigue funcionando aparte.)
CREATE OR REPLACE FUNCTION perfil_usuarios_guard()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  NEW.user_id            := OLD.user_id;             -- inmutable
  NEW.establecimiento_id := OLD.establecimiento_id;   -- inmutable (cierra fuga entre tenants)
  NEW.rol                := OLD.rol;                   -- inmutable (evita auto-ascenso a admin)
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS perfil_usuarios_guard_trg ON perfil_usuarios;
CREATE TRIGGER perfil_usuarios_guard_trg
  BEFORE UPDATE ON perfil_usuarios
  FOR EACH ROW EXECUTE FUNCTION perfil_usuarios_guard();


-- ─── 8. VERIFICACIÓN (opcional — corré después de aplicar) ──────────────────
-- Columnas nuevas:
--   SELECT column_name FROM information_schema.columns
--    WHERE table_name='establecimientos' AND column_name='productor_id';
--   SELECT column_name FROM information_schema.columns
--    WHERE table_name='perfil_usuarios' AND column_name='establecimiento_activo_id';
-- Tabla productores + RLS + policies:
--   SELECT relrowsecurity FROM pg_class WHERE relname='productores';           -- t
--   SELECT policyname, cmd FROM pg_policies WHERE tablename='productores' ORDER BY cmd;
-- Funciones:
--   SELECT proname FROM pg_proc
--    WHERE proname IN ('mi_est_id','es_mi_establecimiento','es_campo_de_mi_productor');
