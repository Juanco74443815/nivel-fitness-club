# Resumen consolidado — Sprint 2 (HDU-14 a HDU-20)

**Sprint:** Sprint 2
**Alcance:** Gestión de clases (HDU-14 a HDU-16), programación de sesiones (HDU-17, HDU-18), consulta de disponibilidad (HDU-19) y registro de reservas (HDU-20).
**Naturaleza de la validación:** técnica y local (entorno de desarrollo), no productiva. Ninguna historia cuenta todavía con validación formal del Product Owner ni del tutor.

## 1. Estado de HDU-14 a HDU-20

| HDU | Título | Estado |
|---|---|---|
| HDU-14 | Registrar clase | Aprobada funcionalmente en local |
| HDU-15 | Listar clases | Aprobada funcionalmente en local |
| HDU-16 | Actualizar o desactivar clase | Aprobada funcionalmente en local |
| HDU-17 | Registrar programación de clase | Aprobada funcionalmente en local |
| HDU-18 | Actualizar o cancelar sesión programada | Aprobada funcionalmente en local |
| HDU-19 | Consultar programación y disponibilidad de clases | Aprobada funcionalmente en local |
| HDU-20 | Registrar reserva | Aprobada funcionalmente en local |

## 2. Esquema de base de datos

Archivo nuevo: `database/003_sprint_02_schema.sql`, aplicado sobre la base de datos local de desarrollo (`nivel_fitness_club`).

- **`clases`**: `id_clase` (PK), `nombre`, `descripcion`, `instructor`, `estado` (`ACTIVO`/`INACTIVO`), `fecha_creacion`, `fecha_actualizacion`.
- **`programaciones_clase`**: `id_programacion` (PK), `id_clase` (FK → `clases`), `fecha`, `hora_inicio`, `hora_fin`, `cupo_maximo`, `estado` (`PROGRAMADA`/`CANCELADA`/`FINALIZADA`), con `CHECK` de que `hora_fin > hora_inicio` y `cupo_maximo > 0`.
- **`reservas`**: `id_reserva` (PK), `id_socio` (FK → `socios`), `id_programacion` (FK → `programaciones_clase`), `fecha_reserva`, `estado` (`ACTIVA`/`CANCELADA`/`FINALIZADA`).
- **Prevención de reservas duplicadas:** en vez de una restricción `UNIQUE(id_socio, id_programacion)` simple (que impediría reservar de nuevo tras cancelar), se usa un **índice único parcial** `uq_reservas_socio_programacion_activa` sobre `(id_socio, id_programacion) WHERE estado = 'ACTIVA'`. Esto bloquea duplicados solo entre reservas activas, permitiendo volver a reservar la misma sesión después de una cancelación.
- Los estados siguen la convención ya establecida en el Sprint 1 (`ACTIVO`/`INACTIVO` en mayúsculas), aunque el documento del capítulo de tesis describe algunos en minúscula (`activo`); se mantuvo la convención del código real por consistencia con el resto del sistema.

## 3. Archivos creados (arquitectura en capas, mismo patrón que HDU-10 a HDU-13)

**Módulo Clase:**
- `backend/src/validators/clase.validator.ts`
- `backend/src/repositories/clase.repository.ts`
- `backend/src/services/clase.service.ts`
- `backend/src/controllers/clase.controller.ts`
- `backend/src/routes/clase.routes.ts`

**Módulo Programación:**
- `backend/src/validators/programacion.validator.ts`
- `backend/src/repositories/programacion.repository.ts`
- `backend/src/services/programacion.service.ts`
- `backend/src/controllers/programacion.controller.ts`
- `backend/src/routes/programacion.routes.ts`

**Módulo Reserva:**
- `backend/src/validators/reserva.validator.ts`
- `backend/src/repositories/reserva.repository.ts`
- `backend/src/services/reserva.service.ts`
- `backend/src/controllers/reserva.controller.ts`
- `backend/src/routes/reserva.routes.ts`

**Modificado:** `backend/src/app.ts` (registro de `/api/clases`, `/api/programaciones`, `/api/reservas`).

**Nuevo:** `database/003_sprint_02_schema.sql`.

## 4. Endpoints implementados

| Método | Ruta | Historia | Acceso |
|---|---|---|---|
| POST | `/api/clases` | HDU-14 | Administrador |
| GET | `/api/clases`, `/api/clases/:id` | HDU-15 | Administrador, Recepcionista, Socio |
| PATCH | `/api/clases/:id` | HDU-16 | Administrador |
| PATCH | `/api/clases/:id/deactivate` | HDU-16 | Administrador |
| POST | `/api/programaciones` | HDU-17 | Administrador |
| PATCH | `/api/programaciones/:id` | HDU-18 | Administrador |
| PATCH | `/api/programaciones/:id/cancel` | HDU-18 | Administrador |
| GET | `/api/programaciones`, `/api/programaciones/:id` | HDU-19 | Administrador, Recepcionista, Socio |
| POST | `/api/reservas` | HDU-20 | Socio |

## 5. Reglas de negocio implementadas

- **HDU-15/HDU-19 (visibilidad para Socio):** un usuario con rol Socio nunca ve clases desactivadas ni sesiones que no estén en estado `PROGRAMADA`, sin importar el filtro enviado en la petición (se fuerza en el servicio, no se confía en el parámetro del cliente).
- **HDU-16:** la desactivación es lógica; una clase inactiva no puede usarse para registrar nuevas programaciones (HDU-17 la rechaza con `400`).
- **HDU-17:** valida que la clase exista y esté activa, y que `hora_fin` sea posterior a `hora_inicio` (doble validación: en el servicio, con mensaje claro, y en la base de datos, con `CHECK`, como red de seguridad).
- **HDU-18:** solo se puede modificar o cancelar una sesión en estado `PROGRAMADA`; no se puede cancelar una sesión ya cancelada o finalizada.
- **HDU-19:** `cupos_disponibles` se calcula en cada consulta como `cupo_maximo - reservas_activas` (subconsulta agregada), nunca se almacena como columna para evitar inconsistencias.
- **HDU-20 — prevención de sobrecupos y condiciones de carrera (regla técnica obligatoria del proyecto):** el registro de una reserva se ejecuta dentro de una transacción que bloquea la fila de la programación (`SELECT ... FOR UPDATE`) antes de contar las reservas activas y compararlas con el cupo máximo. Esto serializa reservas concurrentes sobre la misma sesión y evita que dos peticiones simultáneas sobrepasen el cupo. La duplicidad de reserva del mismo socio se valida tanto en el servicio como mediante el índice único parcial en la base de datos (doble protección).
- **HDU-20 — vínculo usuario-socio:** el `id_socio` de la reserva **nunca** se recibe del cliente; se resuelve internamente a partir del usuario autenticado (`socios.id_usuario = request.auth.idUsuario`). Si la cuenta autenticada con rol Socio no tiene una ficha de socio vinculada, o si el socio está inactivo, la reserva se rechaza.

## 6. Pruebas ejecutadas y resultados

- `npx tsc --noEmit`: sin errores.
- Login administrativo: la contraseña de prueba usada en sesiones anteriores ya no era válida (posiblemente cambiada fuera de esta sesión); se restableció nuevamente solo para pruebas en el entorno local, sin mostrarla ni exponerla.
- **HDU-14:** 3 casos (registro válido, nombre vacío, sin autenticación) — todos aprobados.
- **HDU-15:** listado como Administrador — aprobado.
- **HDU-16:** 4 casos (actualización válida, clase inexistente, desactivación válida, desactivación repetida) — todos aprobados.
- **HDU-17:** 4 casos (registro válido con `cupos_disponibles` calculado, clase inactiva rechazada, horario inválido rechazado, clase inexistente rechazada) — todos aprobados.
- **HDU-18:** 4 casos (actualización válida, cancelación válida, cancelación repetida, actualización de sesión cancelada rechazada) — todos aprobados.
- **HDU-19:** 2 casos (listado general, listado como Socio mostrando solo sesiones `PROGRAMADA`) — todos aprobados.
- **HDU-20:** 6 casos (reserva válida, reserva duplicada rechazada, sobrecupo rechazado, rol no autorizado rechazado, reserva sobre sesión cancelada rechazada, reserva sobre sesión inexistente rechazada) — todos aprobados. Se verificó además que `cupos_disponibles` se actualizó correctamente (de 1 a 0) tras la reserva.

## 7. Datos de prueba creados y limpieza realizada

Todos identificables por el prefijo `QA` o `qa.s2.*`, y quedaron en baja lógica (`INACTIVO`/`CANCELADA`) al finalizar:

| Entidad | Identificador | Estado final |
|---|---|---|
| Clase | `id_clase=1` "Yoga QA" | INACTIVO |
| Clase | `id_clase=2` "Spinning QA" | INACTIVO |
| Programación | `id_programacion=1`, `2`, `3` | CANCELADA (las 3) |
| Usuario | `qa.s2.usuarioa.*` (id 9, rol Socio) | INACTIVO |
| Usuario | `qa.s2.usuariob.*` (id 10, rol Socio) | INACTIVO |
| Socio | `SOC-000003` (id_socio 3, vinculado a usuario 9) | INACTIVO |
| Socio | `SOC-000004` (id_socio 4, vinculado a usuario 10) | INACTIVO |
| Reserva | `id_reserva=1` (socio 3 sobre programación 3) | ACTIVA (sin endpoint de cancelación en este sprint; ver riesgos) |

No se modificó la contraseña de ninguna cuenta real de sesiones anteriores, excepto el restablecimiento puntual de la contraseña de prueba del Administrador (ver sección 6), necesario porque la contraseña previamente usada ya no era válida.

## 8. Riesgos y pendientes reales

- **No existe endpoint de consulta ni cancelación de reservas en este sprint.** Por diseño, HDU-20 solo cubre "Registrar reserva"; la consulta y cancelación de reservas por el socio corresponden a HDU-21 (Sprint 3), según la planificación general de sprints. La reserva de prueba (`id_reserva=1`) permanece `ACTIVA` en la base de datos local por esta razón.
- **HDU-20 está restringida exclusivamente al rol Socio**, tal como especifica la historia. No se implementó una vía para que Administrador/Recepcionista registren una reserva en nombre de un socio sin cuenta propia, por no ser un requisito explícito de esta historia.
- El cálculo de `cupos_disponibles` no se probó bajo concurrencia real (peticiones simultáneas); la protección contra sobrecupo se basa en el diseño (`SELECT ... FOR UPDATE` sobre la fila de la programación), verificado por revisión de código y por las pruebas secuenciales ejecutadas.
- No existe un job o mecanismo que cambie automáticamente una `programacion` a `FINALIZADA` cuando su fecha/hora ya pasó; el estado `FINALIZADA` está contemplado en el esquema pero no se popula todavía (fuera del alcance de HDU-14 a HDU-20).
- Pruebas automatizadas (framework de testing) todavía no configuradas en el proyecto — riesgo heredado, sigue vigente.
- Ninguna historia cuenta con capturas visuales, registro de Trello, referencia de commit de GitHub, ni validación formal del Product Owner o del tutor.

## 9. Siguiente bloque

Sprint 3 (HDU-21 a HDU-28): consulta y cancelación de reservas, control de sobrecupos, planes de membresía y gestión de membresías — no iniciado en esta sesión.
