-- ============================================================
-- CampoOS — Row Level Security (RLS) completo
-- Aplicar DESPUÉS de schema.sql
-- ============================================================
-- Patrón: cada usuario accede solo a los datos de su establecimiento.
-- La tabla perfil_usuarios vincula auth.uid() con establecimiento_id.
-- ============================================================

-- ─── HABILITAR RLS EN TODAS LAS TABLAS ───────────────────────────────────────

ALTER TABLE establecimientos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfil_usuarios         ENABLE ROW LEVEL SECURITY;
ALTER TABLE animales                ENABLE ROW LEVEL SECURITY;
ALTER TABLE pesadas                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE lotes                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE labores                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos_inventario    ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_inventario  ENABLE ROW LEVEL SECURITY;
ALTER TABLE maquinas                ENABLE ROW LEVEL SECURITY;
ALTER TABLE mantenimientos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE cargas_combustible      ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehiculos                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE cargas_combustible_vehiculos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE contactos               ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE compras                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE items_compra            ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_contables   ENABLE ROW LEVEL SECURITY;
ALTER TABLE empleados               ENABLE ROW LEVEL SECURITY;
ALTER TABLE liquidaciones           ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispositivos_iot        ENABLE ROW LEVEL SECURITY;
ALTER TABLE sesiones_rfid           ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecturas_rfid           ENABLE ROW LEVEL SECURITY;


-- ════════════════════════════════════════════════════════════
-- ESTABLECIMIENTOS
-- El dueño del establecimiento es quien tiene un perfil_usuarios
-- apuntando a él. Solo los usuarios vinculados pueden ver/editar.
-- ════════════════════════════════════════════════════════════

-- Cualquier usuario autenticado puede crear su primer establecimiento.
-- El perfil_usuarios se inserta justo después (en el flujo de onboarding).
CREATE POLICY "crear_establecimiento" ON establecimientos
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Solo ven el establecimiento al que pertenecen.
CREATE POLICY "ver_mi_establecimiento" ON establecimientos
  FOR SELECT USING (
    id IN (
      SELECT establecimiento_id FROM perfil_usuarios WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "editar_mi_establecimiento" ON establecimientos
  FOR UPDATE USING (
    id IN (
      SELECT establecimiento_id FROM perfil_usuarios
       WHERE user_id = auth.uid() AND rol = 'admin'
    )
  );


-- ════════════════════════════════════════════════════════════
-- PERFIL DE USUARIOS
-- Cada usuario solo ve y edita su propio perfil.
-- ════════════════════════════════════════════════════════════

CREATE POLICY "ver_mi_perfil" ON perfil_usuarios
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "insertar_mi_perfil" ON perfil_usuarios
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "editar_mi_perfil" ON perfil_usuarios
  FOR UPDATE USING (user_id = auth.uid());


-- ════════════════════════════════════════════════════════════
-- TABLAS CON establecimiento_id DIRECTO
-- Patrón uniforme: filtrar por el establecimiento del usuario.
-- ════════════════════════════════════════════════════════════

-- Helper: devuelve el establecimiento_id del usuario autenticado.
-- Se usa en todas las políticas de tablas hijas.
CREATE OR REPLACE FUNCTION mi_est_id()
RETURNS UUID LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT establecimiento_id FROM perfil_usuarios WHERE user_id = auth.uid() LIMIT 1
$$;


-- ─── ANIMALES ────────────────────────────────────────────────

CREATE POLICY "animales_select" ON animales
  FOR SELECT USING (establecimiento_id = mi_est_id());

CREATE POLICY "animales_insert" ON animales
  FOR INSERT WITH CHECK (establecimiento_id = mi_est_id());

CREATE POLICY "animales_update" ON animales
  FOR UPDATE USING (establecimiento_id = mi_est_id());

CREATE POLICY "animales_delete" ON animales
  FOR DELETE USING (
    establecimiento_id = mi_est_id()
    AND (SELECT rol FROM perfil_usuarios WHERE user_id = auth.uid()) IN ('admin','operario')
  );


-- ─── LOTES ───────────────────────────────────────────────────

CREATE POLICY "lotes_select" ON lotes
  FOR SELECT USING (establecimiento_id = mi_est_id());

CREATE POLICY "lotes_insert" ON lotes
  FOR INSERT WITH CHECK (establecimiento_id = mi_est_id());

CREATE POLICY "lotes_update" ON lotes
  FOR UPDATE USING (establecimiento_id = mi_est_id());

CREATE POLICY "lotes_delete" ON lotes
  FOR DELETE USING (establecimiento_id = mi_est_id());


-- ─── INVENTARIO ──────────────────────────────────────────────

CREATE POLICY "productos_select" ON productos_inventario
  FOR SELECT USING (establecimiento_id = mi_est_id());

CREATE POLICY "productos_insert" ON productos_inventario
  FOR INSERT WITH CHECK (establecimiento_id = mi_est_id());

CREATE POLICY "productos_update" ON productos_inventario
  FOR UPDATE USING (establecimiento_id = mi_est_id());

CREATE POLICY "productos_delete" ON productos_inventario
  FOR DELETE USING (establecimiento_id = mi_est_id());


-- ─── MAQUINARIA ──────────────────────────────────────────────

CREATE POLICY "maquinas_select" ON maquinas
  FOR SELECT USING (establecimiento_id = mi_est_id());

CREATE POLICY "maquinas_insert" ON maquinas
  FOR INSERT WITH CHECK (establecimiento_id = mi_est_id());

CREATE POLICY "maquinas_update" ON maquinas
  FOR UPDATE USING (establecimiento_id = mi_est_id());

CREATE POLICY "maquinas_delete" ON maquinas
  FOR DELETE USING (establecimiento_id = mi_est_id());


-- ─── FLOTA ───────────────────────────────────────────────────

CREATE POLICY "vehiculos_select" ON vehiculos
  FOR SELECT USING (establecimiento_id = mi_est_id());

CREATE POLICY "vehiculos_insert" ON vehiculos
  FOR INSERT WITH CHECK (establecimiento_id = mi_est_id());

CREATE POLICY "vehiculos_update" ON vehiculos
  FOR UPDATE USING (establecimiento_id = mi_est_id());

CREATE POLICY "vehiculos_delete" ON vehiculos
  FOR DELETE USING (establecimiento_id = mi_est_id());


-- ─── CARGAS COMBUSTIBLE VEHÍCULOS (vía vehiculos) ────────────

CREATE POLICY "cargas_comb_veh_select" ON cargas_combustible_vehiculos
  FOR SELECT USING (
    vehiculo_id IN (SELECT id FROM vehiculos WHERE establecimiento_id = mi_est_id())
  );

CREATE POLICY "cargas_comb_veh_insert" ON cargas_combustible_vehiculos
  FOR INSERT WITH CHECK (
    vehiculo_id IN (SELECT id FROM vehiculos WHERE establecimiento_id = mi_est_id())
  );

CREATE POLICY "cargas_comb_veh_update" ON cargas_combustible_vehiculos
  FOR UPDATE USING (
    vehiculo_id IN (SELECT id FROM vehiculos WHERE establecimiento_id = mi_est_id())
  );

CREATE POLICY "cargas_comb_veh_delete" ON cargas_combustible_vehiculos
  FOR DELETE USING (
    vehiculo_id IN (SELECT id FROM vehiculos WHERE establecimiento_id = mi_est_id())
  );


-- ─── CONTACTOS ───────────────────────────────────────────────

CREATE POLICY "contactos_select" ON contactos
  FOR SELECT USING (establecimiento_id = mi_est_id());

CREATE POLICY "contactos_insert" ON contactos
  FOR INSERT WITH CHECK (establecimiento_id = mi_est_id());

CREATE POLICY "contactos_update" ON contactos
  FOR UPDATE USING (establecimiento_id = mi_est_id());

CREATE POLICY "contactos_delete" ON contactos
  FOR DELETE USING (establecimiento_id = mi_est_id());


-- ─── VENTAS ──────────────────────────────────────────────────

CREATE POLICY "ventas_select" ON ventas
  FOR SELECT USING (establecimiento_id = mi_est_id());

CREATE POLICY "ventas_insert" ON ventas
  FOR INSERT WITH CHECK (establecimiento_id = mi_est_id());

CREATE POLICY "ventas_update" ON ventas
  FOR UPDATE USING (establecimiento_id = mi_est_id());

CREATE POLICY "ventas_delete" ON ventas
  FOR DELETE USING (establecimiento_id = mi_est_id());


-- ─── COMPRAS ─────────────────────────────────────────────────

CREATE POLICY "compras_select" ON compras
  FOR SELECT USING (establecimiento_id = mi_est_id());

CREATE POLICY "compras_insert" ON compras
  FOR INSERT WITH CHECK (establecimiento_id = mi_est_id());

CREATE POLICY "compras_update" ON compras
  FOR UPDATE USING (establecimiento_id = mi_est_id());

CREATE POLICY "compras_delete" ON compras
  FOR DELETE USING (establecimiento_id = mi_est_id());


-- ─── CONTABILIDAD ────────────────────────────────────────────

CREATE POLICY "mov_cont_select" ON movimientos_contables
  FOR SELECT USING (establecimiento_id = mi_est_id());

CREATE POLICY "mov_cont_insert" ON movimientos_contables
  FOR INSERT WITH CHECK (establecimiento_id = mi_est_id());

CREATE POLICY "mov_cont_update" ON movimientos_contables
  FOR UPDATE USING (establecimiento_id = mi_est_id());

CREATE POLICY "mov_cont_delete" ON movimientos_contables
  FOR DELETE USING (establecimiento_id = mi_est_id());


-- ─── RRHH ────────────────────────────────────────────────────

CREATE POLICY "empleados_select" ON empleados
  FOR SELECT USING (establecimiento_id = mi_est_id());

CREATE POLICY "empleados_insert" ON empleados
  FOR INSERT WITH CHECK (establecimiento_id = mi_est_id());

CREATE POLICY "empleados_update" ON empleados
  FOR UPDATE USING (establecimiento_id = mi_est_id());

CREATE POLICY "empleados_delete" ON empleados
  FOR DELETE USING (establecimiento_id = mi_est_id());


-- ─── IOT ─────────────────────────────────────────────────────

CREATE POLICY "dispositivos_select" ON dispositivos_iot
  FOR SELECT USING (establecimiento_id = mi_est_id());

CREATE POLICY "dispositivos_insert" ON dispositivos_iot
  FOR INSERT WITH CHECK (establecimiento_id = mi_est_id());

CREATE POLICY "dispositivos_update" ON dispositivos_iot
  FOR UPDATE USING (establecimiento_id = mi_est_id());

CREATE POLICY "dispositivos_delete" ON dispositivos_iot
  FOR DELETE USING (establecimiento_id = mi_est_id());


-- ════════════════════════════════════════════════════════════
-- TABLAS HIJAS (sin establecimiento_id directo)
-- Acceso a través de la tabla padre.
-- ════════════════════════════════════════════════════════════

-- ─── PESADAS (vía animales) ──────────────────────────────────

CREATE POLICY "pesadas_select" ON pesadas
  FOR SELECT USING (
    animal_id IN (SELECT id FROM animales WHERE establecimiento_id = mi_est_id())
  );

CREATE POLICY "pesadas_insert" ON pesadas
  FOR INSERT WITH CHECK (
    animal_id IN (SELECT id FROM animales WHERE establecimiento_id = mi_est_id())
  );

CREATE POLICY "pesadas_update" ON pesadas
  FOR UPDATE USING (
    animal_id IN (SELECT id FROM animales WHERE establecimiento_id = mi_est_id())
  );

CREATE POLICY "pesadas_delete" ON pesadas
  FOR DELETE USING (
    animal_id IN (SELECT id FROM animales WHERE establecimiento_id = mi_est_id())
  );


-- ─── LABORES (vía lotes) ─────────────────────────────────────

CREATE POLICY "labores_select" ON labores
  FOR SELECT USING (
    lote_id IN (SELECT id FROM lotes WHERE establecimiento_id = mi_est_id())
  );

CREATE POLICY "labores_insert" ON labores
  FOR INSERT WITH CHECK (
    lote_id IN (SELECT id FROM lotes WHERE establecimiento_id = mi_est_id())
  );

CREATE POLICY "labores_update" ON labores
  FOR UPDATE USING (
    lote_id IN (SELECT id FROM lotes WHERE establecimiento_id = mi_est_id())
  );

CREATE POLICY "labores_delete" ON labores
  FOR DELETE USING (
    lote_id IN (SELECT id FROM lotes WHERE establecimiento_id = mi_est_id())
  );


-- ─── MOVIMIENTOS INVENTARIO (vía productos_inventario) ───────

CREATE POLICY "mov_inv_select" ON movimientos_inventario
  FOR SELECT USING (
    producto_id IN (SELECT id FROM productos_inventario WHERE establecimiento_id = mi_est_id())
  );

CREATE POLICY "mov_inv_insert" ON movimientos_inventario
  FOR INSERT WITH CHECK (
    producto_id IN (SELECT id FROM productos_inventario WHERE establecimiento_id = mi_est_id())
  );

CREATE POLICY "mov_inv_update" ON movimientos_inventario
  FOR UPDATE USING (
    producto_id IN (SELECT id FROM productos_inventario WHERE establecimiento_id = mi_est_id())
  );

CREATE POLICY "mov_inv_delete" ON movimientos_inventario
  FOR DELETE USING (
    producto_id IN (SELECT id FROM productos_inventario WHERE establecimiento_id = mi_est_id())
  );


-- ─── MANTENIMIENTOS (vía maquinas) ───────────────────────────

CREATE POLICY "mantenimientos_select" ON mantenimientos
  FOR SELECT USING (
    maquina_id IN (SELECT id FROM maquinas WHERE establecimiento_id = mi_est_id())
  );

CREATE POLICY "mantenimientos_insert" ON mantenimientos
  FOR INSERT WITH CHECK (
    maquina_id IN (SELECT id FROM maquinas WHERE establecimiento_id = mi_est_id())
  );

CREATE POLICY "mantenimientos_update" ON mantenimientos
  FOR UPDATE USING (
    maquina_id IN (SELECT id FROM maquinas WHERE establecimiento_id = mi_est_id())
  );

CREATE POLICY "mantenimientos_delete" ON mantenimientos
  FOR DELETE USING (
    maquina_id IN (SELECT id FROM maquinas WHERE establecimiento_id = mi_est_id())
  );


-- ─── CARGAS COMBUSTIBLE (vía maquinas) ───────────────────────

CREATE POLICY "cargas_comb_select" ON cargas_combustible
  FOR SELECT USING (
    maquina_id IN (SELECT id FROM maquinas WHERE establecimiento_id = mi_est_id())
  );

CREATE POLICY "cargas_comb_insert" ON cargas_combustible
  FOR INSERT WITH CHECK (
    maquina_id IN (SELECT id FROM maquinas WHERE establecimiento_id = mi_est_id())
  );

CREATE POLICY "cargas_comb_update" ON cargas_combustible
  FOR UPDATE USING (
    maquina_id IN (SELECT id FROM maquinas WHERE establecimiento_id = mi_est_id())
  );

CREATE POLICY "cargas_comb_delete" ON cargas_combustible
  FOR DELETE USING (
    maquina_id IN (SELECT id FROM maquinas WHERE establecimiento_id = mi_est_id())
  );


-- ─── ITEMS COMPRA (vía compras) ──────────────────────────────

CREATE POLICY "items_compra_select" ON items_compra
  FOR SELECT USING (
    compra_id IN (SELECT id FROM compras WHERE establecimiento_id = mi_est_id())
  );

CREATE POLICY "items_compra_insert" ON items_compra
  FOR INSERT WITH CHECK (
    compra_id IN (SELECT id FROM compras WHERE establecimiento_id = mi_est_id())
  );

CREATE POLICY "items_compra_update" ON items_compra
  FOR UPDATE USING (
    compra_id IN (SELECT id FROM compras WHERE establecimiento_id = mi_est_id())
  );

CREATE POLICY "items_compra_delete" ON items_compra
  FOR DELETE USING (
    compra_id IN (SELECT id FROM compras WHERE establecimiento_id = mi_est_id())
  );


-- ─── LIQUIDACIONES (vía empleados) ───────────────────────────

CREATE POLICY "liquidaciones_select" ON liquidaciones
  FOR SELECT USING (
    empleado_id IN (SELECT id FROM empleados WHERE establecimiento_id = mi_est_id())
  );

CREATE POLICY "liquidaciones_insert" ON liquidaciones
  FOR INSERT WITH CHECK (
    empleado_id IN (SELECT id FROM empleados WHERE establecimiento_id = mi_est_id())
  );

CREATE POLICY "liquidaciones_update" ON liquidaciones
  FOR UPDATE USING (
    empleado_id IN (SELECT id FROM empleados WHERE establecimiento_id = mi_est_id())
  );

CREATE POLICY "liquidaciones_delete" ON liquidaciones
  FOR DELETE USING (
    empleado_id IN (SELECT id FROM empleados WHERE establecimiento_id = mi_est_id())
  );


-- ─── SESIONES RFID (vía dispositivos_iot) ────────────────────

CREATE POLICY "sesiones_rfid_select" ON sesiones_rfid
  FOR SELECT USING (
    dispositivo_id IN (SELECT id FROM dispositivos_iot WHERE establecimiento_id = mi_est_id())
  );

CREATE POLICY "sesiones_rfid_insert" ON sesiones_rfid
  FOR INSERT WITH CHECK (
    dispositivo_id IN (SELECT id FROM dispositivos_iot WHERE establecimiento_id = mi_est_id())
  );

CREATE POLICY "sesiones_rfid_update" ON sesiones_rfid
  FOR UPDATE USING (
    dispositivo_id IN (SELECT id FROM dispositivos_iot WHERE establecimiento_id = mi_est_id())
  );

CREATE POLICY "sesiones_rfid_delete" ON sesiones_rfid
  FOR DELETE USING (
    dispositivo_id IN (SELECT id FROM dispositivos_iot WHERE establecimiento_id = mi_est_id())
  );


-- ─── LECTURAS RFID (vía dispositivos_iot) ────────────────────

CREATE POLICY "lecturas_rfid_select" ON lecturas_rfid
  FOR SELECT USING (
    dispositivo_id IN (SELECT id FROM dispositivos_iot WHERE establecimiento_id = mi_est_id())
  );

CREATE POLICY "lecturas_rfid_insert" ON lecturas_rfid
  FOR INSERT WITH CHECK (
    dispositivo_id IN (SELECT id FROM dispositivos_iot WHERE establecimiento_id = mi_est_id())
  );

CREATE POLICY "lecturas_rfid_update" ON lecturas_rfid
  FOR UPDATE USING (
    dispositivo_id IN (SELECT id FROM dispositivos_iot WHERE establecimiento_id = mi_est_id())
  );

CREATE POLICY "lecturas_rfid_delete" ON lecturas_rfid
  FOR DELETE USING (
    dispositivo_id IN (SELECT id FROM dispositivos_iot WHERE establecimiento_id = mi_est_id())
  );
