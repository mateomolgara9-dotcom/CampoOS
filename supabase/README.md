# CampoOS — Guía de aplicación del schema

## Orden de ejecución

Ir a **Supabase → SQL Editor** y ejecutar en este orden:

1. `schema.sql` — Todas las tablas, triggers e índices
2. `policies.sql` — RLS habilitado + todas las políticas

Cada archivo es idempotente (`IF NOT EXISTS`, `CREATE OR REPLACE`).

---

## Descripción de tablas

| Tabla | Módulo | Descripción |
|---|---|---|
| `establecimientos` | Núcleo | Un campo/empresa agropecuaria |
| `perfil_usuarios` | Auth | Vincula auth.uid() con su establecimiento y rol |
| `animales` | Animales | Rodeo completo con RFID y estado sanitario |
| `pesadas` | Animales | Historial de pesadas por animal |
| `lotes` | Lotes | Lotes del campo con mapa SVG (pos_x/y/ancho/alto) |
| `labores` | Lotes | Historial de labores por lote |
| `productos_inventario` | Inventario | Stock de insumos, semillas, veterinarios, etc. |
| `movimientos_inventario` | Inventario | Entradas, salidas y ajustes de stock |
| `maquinas` | Maquinaria | Parque de maquinaria agrícola |
| `mantenimientos` | Maquinaria | Historial de mantenimientos por máquina |
| `cargas_combustible` | Maquinaria | Registro de cargas de combustible |
| `vehiculos` | Flota | Vehículos utilitarios (VTV, seguro, km) |
| `contactos` | Contactos | Clientes, proveedores, asesores, etc. |
| `ventas` | Ventas | Ventas de hacienda, granos o servicios |
| `compras` | Compras | Órdenes de compra con ítems |
| `items_compra` | Compras | Líneas de ítem por compra |
| `movimientos_contables` | Contabilidad | Libro diario de ingresos y egresos |
| `empleados` | RRHH | Personal del establecimiento |
| `liquidaciones` | RRHH | Liquidaciones mensuales de sueldo |
| `dispositivos_iot` | IoT | Lectores RFID, básculas, collares GPS |
| `sesiones_rfid` | IoT | Sesiones de lectura masiva de caravanas |
| `lecturas_rfid` | IoT | Cada caravana leída, con peso y estado |

---

## Multi-tenancy

```
auth.users (Supabase Auth)
    ↓
perfil_usuarios (user_id → establecimiento_id, rol)
    ↓
[todas las tablas filtran por establecimiento_id = mi_est_id()]
```

La función `mi_est_id()` se ejecuta con `SECURITY DEFINER` para
resolver el establecimiento del usuario autenticado sin exponer la
tabla `perfil_usuarios` directamente.

### Roles

| Rol | Permisos |
|---|---|
| `admin` | CRUD completo + delete animales |
| `operario` | CRUD completo, sin gestión de usuarios |
| `solo_lectura` | Solo SELECT |

---

## Datos de prueba (opcional)

```sql
-- 1. Crear establecimiento
INSERT INTO establecimientos (nombre, provincia, superficie)
VALUES ('La Esperanza', 'Buenos Aires', 1500);

-- 2. El perfil se crea automáticamente al registrarse (Phase 2)

-- 3. Insertar animales de prueba
-- (después de crear el establecimiento y vincularlo al usuario)
```
