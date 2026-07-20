# Resumen consolidado — Sprint 1 (HDU-01 a HDU-13)

**Sprint:** Sprint 1
**Alcance:** Autenticación y gestión de usuarios (HDU-01 a HDU-09), gestión de socios (HDU-10 a HDU-13)
**Naturaleza de la validación:** técnica y local (entorno de desarrollo), no productiva. Ninguna historia cuenta todavía con validación formal del Product Owner ni del tutor.

## 1. Estado final de HDU-01 a HDU-13

| HDU | Título | Estado |
|---|---|---|
| HDU-01 | Iniciar sesión | Aprobada funcionalmente en local |
| HDU-02 | Cerrar sesión | Aprobada funcionalmente en local |
| HDU-03 | Recuperar contraseña | Aprobada funcionalmente en local (SMTP real pendiente) |
| HDU-04 | Registrar cuenta de usuario | Aprobada funcionalmente en local |
| HDU-05 | Listar cuentas de usuario | Aprobada funcionalmente en local |
| HDU-06 | Actualizar cuenta de usuario | Aprobada funcionalmente en local (datos personales) |
| HDU-07 | Asignar o cambiar rol | Aprobada funcionalmente en local, incluyendo protecciones administrativas |
| HDU-08 | Desactivar cuenta de usuario | Aprobada funcionalmente en local, incluyendo protecciones administrativas |
| HDU-09 | Consultar perfil | Aprobada funcionalmente en local |
| HDU-10 | Registrar socio | Aprobada funcionalmente en local |
| HDU-11 | Listar socios | Aprobada funcionalmente en local |
| HDU-12 | Actualizar socio | Aprobada funcionalmente en local (datos personales) |
| HDU-13 | Desactivar socio | Aprobada funcionalmente en local |

## 2. Archivos creados o modificados en esta sesión (HDU-07 a HDU-13)

**Modificados (protecciones administrativas HDU-07/HDU-08):**
- `backend/src/services/user.service.ts`
- `backend/src/controllers/user.controller.ts`
- `backend/src/repositories/user.repository.ts`

**Nuevos (módulo de socios, HDU-10 a HDU-13):**
- `backend/src/routes/socio.routes.ts`
- `backend/src/controllers/socio.controller.ts`
- `backend/src/services/socio.service.ts`
- `backend/src/repositories/socio.repository.ts`
- `backend/src/validators/socio.validator.ts`

**Modificados (registro de la nueva ruta):**
- `backend/src/app.ts`

**Sin cambios:** esquema SQL. Ninguna historia de este bloque requirió modificar `database/001_sprint_01_schema.sql`.

## 3. Pruebas ejecutadas y resultados

- `npx tsc --noEmit`: sin errores en todo el bloque (protecciones + módulo de socios).
- **Login administrativo:** confirmado con las credenciales ya configuradas, sin exponer correo, contraseña, token ni hash. No se modificó ninguna contraseña de cuenta real.
- **HDU-07 (protecciones):** 3 casos nuevos (auto-cambio de rol rechazado, cambio de rol de otro Administrador aprobado, degradar al último Administrador rechazado) — todos aprobados.
- **HDU-08 (protecciones):** 3 casos nuevos (auto-desactivación rechazada, desactivación de otro Administrador aprobada, desactivar al último Administrador rechazada) — todos aprobados.
- **HDU-09:** 1 caso nuevo (usuario con rol inactivo → perfil `403`) — aprobado.
- **HDU-10:** 8 casos (registro válido, CI duplicado, correo duplicado, datos inválidos, sin autenticación, vínculo a usuario, relación única usuario-socio, usuario inexistente) — todos aprobados.
- **HDU-11:** 8 casos (listado, búsqueda, filtro por estado, sin autenticación, detalle existente/inexistente, autorización Recepcionista, rechazo rol Socio) — todos aprobados.
- **HDU-12:** 4 casos (actualización válida, socio inexistente, sin autenticación, correo duplicado) — todos aprobados.
- **HDU-13:** 5 casos (desactivación válida, repetida, socio inexistente, rechazo rol Socio, persistencia lógica del registro) — todos aprobados.

**Nota sobre la regla "último Administrador activo":** por diseño, todos los endpoints de gestión de usuarios exigen que el actor tenga rol Administrador. Esto hace que, cuando solo queda un Administrador activo, el único actor capaz de operar sobre esa cuenta sea él mismo — el escenario "un tercero degrada/desactiva al último Administrador" es estructuralmente inalcanzable por HTTP sin coincidir con el caso de auto-modificación. Esta regla se verificó de forma aislada invocando los servicios `changeUserRole` y `deactivateUser` directamente (bypass del actor HTTP), confirmando el rechazo `409` **antes de cualquier escritura en la base de datos** — el Administrador real nunca fue modificado. Detalle completo en `HDU-07-cambiar-rol-usuario.md` y `HDU-08-desactivar-cuenta-usuario.md`, sección 6.2.

## 4. Datos de prueba creados y limpieza realizada

Todos los datos de prueba de esta sesión son identificables por el prefijo `qa.` en el correo o `QA` en nombres/CI, y quedaron en estado `INACTIVO` (baja lógica) al finalizar — no se realizó ninguna eliminación física, conforme a la regla técnica del proyecto.

| Entidad | Identificador | Uso en la prueba | Estado final |
|---|---|---|---|
| Usuario | `qa.hdu07.admina.*` (id 4) | Administrador de prueba → degradado a Recepcionista → desactivado | INACTIVO |
| Usuario | `qa.hdu07.adminb.*` (id 5) | Administrador de prueba → desactivado directamente | INACTIVO |
| Usuario | `qa.hdu09.socio.*` (id 6) | Socio de prueba para caso de rol inactivo → desactivado | INACTIVO |
| Usuario | `qa.hdu11.recep.*` (id 7) | Recepcionista de prueba para autorización de socios → desactivado | INACTIVO |
| Usuario | `qa.hdu11.socio.*` (id 8) | Socio de prueba para rechazo de autorización → desactivado | INACTIVO |
| Socio | `SOC-000001` (`qa.hdu10.socio1.*`) | Registro, actualización y desactivación de socio | INACTIVO |
| Socio | `SOC-000002` (`qa.hdu10.vinculado.*`, vinculado a `id_usuario=2`) | Relación única usuario-socio | INACTIVO |
| Rol | `Socio` (id 3) | Alternado temporalmente a `INACTIVO` y restaurado a `ACTIVO` de inmediato, para probar HDU-09 caso E | ACTIVO (restaurado) |

No se modificó la contraseña de ninguna cuenta preexistente (Administrador real, `maria.elena@nivelfitness.com`, ni el usuario `qa.hdu04.*` de la sesión anterior). El usuario `maria.elena@nivelfitness.com` (id 2) permanece sin cambios excepto por quedar vinculado como prueba de socio con `id_usuario=2` — el registro de socio asociado (`SOC-000002`) fue desactivado al finalizar, pero **el vínculo `id_usuario=2` permanece en la tabla `socios` como parte del historial de la baja lógica**; el usuario `maria.elena` en sí no fue alterado.

## 5. Documentos de evidencia creados o actualizados

**Actualizados (protecciones administrativas):**
- `docs/sprints/sprint-01/HDU-07-cambiar-rol-usuario.md`
- `docs/sprints/sprint-01/HDU-08-desactivar-cuenta-usuario.md`
- `docs/sprints/sprint-01/HDU-09-consultar-perfil.md`

**Nuevos (módulo de socios):**
- `docs/sprints/sprint-01/HDU-10-registrar-socio.md`
- `docs/sprints/sprint-01/HDU-11-listar-socios.md`
- `docs/sprints/sprint-01/HDU-12-actualizar-socio.md`
- `docs/sprints/sprint-01/HDU-13-desactivar-socio.md`
- `docs/sprints/sprint-01/RESUMEN-CONSOLIDADO-SPRINT-01.md` (este documento)

## 6. Riesgos y pendientes reales

- **Reservas, pagos y membresías** todavía no existen como módulos: los criterios de HDU-12/HDU-13 relacionados con "no alterar historial de reservas/pagos/membresías" y "bloqueo de nuevas operaciones para socio inactivo" no se pudieron verificar de forma funcional por no ser aplicables todavía. Deben revisarse explícitamente cuando esos módulos se implementen.
- No existe endpoint de reactivación para cuentas de usuario ni para socios (ambas historias, HDU-08 y HDU-13, son exclusivamente de desactivación).
- El formato de `codigo_socio` (`SOC-000001`) es una decisión técnica tomada en esta sesión por no existir una especificación previa; no se probó bajo concurrencia real, solo se diseñó con `pg_advisory_xact_lock` para prevenir colisiones.
- No existe lista de revocación de tokens JWT en ningún módulo; la protección contra cuentas/roles inactivos depende de que cada endpoint sensible revalide contra la base de datos (ya verificado en `/profile`).
- El listado de socios, igual que el de usuarios (HDU-05), no tiene paginación.
- Pruebas automatizadas (framework de testing) todavía no configuradas en el proyecto — riesgo heredado de sesiones anteriores, sigue vigente.
- Ninguna historia de HDU-01 a HDU-13 cuenta con capturas visuales insertadas, registro de Trello, referencia de commit de GitHub, ni validación formal del Product Owner o del tutor.
- Existen registros QA de sesiones anteriores en la base de datos local (ver sección 9); no se han eliminado, solo auditado. Ver procedimiento de limpieza propuesto en la sección 9.
- ~~`backend/src/app.ts` registraba `roleRouter` dos veces~~ — **corregido en el cierre técnico de esta sesión** (ver sección 9.1).

## 7. Estado general del Sprint 1

Las 13 historias de usuario del Sprint 1 (HDU-01 a HDU-13) están **aprobadas funcionalmente en el entorno local de desarrollo**. El backend cubre: autenticación con JWT, recuperación de contraseña, gestión completa de cuentas de usuario (registro, listado, actualización, cambio de rol, desactivación, consulta de perfil) con protecciones administrativas contra pérdida de administradores, y gestión completa de socios (registro con código único, listado con búsqueda, actualización, desactivación), con control de acceso por rol verificado en cada módulo.

Ningún cambio fue enviado a control de versiones durante esta sesión (no se ejecutó `git commit`, `git push` ni se creó Pull Request), conforme a la instrucción explícita recibida.

No se avanzó al Sprint 2.

## 8. Decisiones técnicas confirmadas y aclaraciones (cierre técnico)

### 8.1 Formato de `codigo_socio`

- El código de socio sigue el formato `SOC-000001`, `SOC-000002`, etc. (prefijo fijo `SOC-` + número secuencial de 6 dígitos con ceros a la izquierda).
- El código es **único** (restricción `UNIQUE` ya existente en `socios.codigo_socio`, reforzada por la validación de generación).
- La generación utiliza **control transaccional** (`BEGIN` / `pg_advisory_xact_lock` / cálculo del siguiente número / `INSERT` / `COMMIT`, con `ROLLBACK` ante error) para evitar duplicados bajo peticiones concurrentes, sin requerir cambios al esquema SQL.
- **Esta decisión queda confirmada** para el resto del proyecto y solo se revisará si el gimnasio (Product Owner / caso de estudio Nivel Fitness Club) solicita explícitamente un formato distinto.

### 8.2 Estado del correo (HDU-03)

- HDU-03 (recuperación de contraseña) fue probada con **transporte de correo local** (`jsonTransport` de Nodemailer), que construye el mensaje sin enviarlo por red.
- El **envío real mediante un servidor SMTP configurado continúa pendiente** de prueba; las variables `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` ya existen en `backend/.env.example` como plantilla, sin credenciales reales.

### 8.3 Criterios históricos de HDU-12 y HDU-13

- Los criterios "actualización sin alterar reservas, pagos o membresías históricas" (HDU-12) y "bloqueo de nuevas operaciones para un socio inactivo" (HDU-13) **se verificarán nuevamente cuando existan los módulos de reservas, membresías y pagos**, ya que actualmente no existen en el esquema ni en el backend. Esta sesión solo confirmó que `PATCH /api/socios/:id` no altera la identidad del socio (`id_socio`, `codigo_socio`, `id_usuario`, `fecha_inscripcion`, `estado`).

## 9. Cierre técnico del Sprint 1 (esta sesión)

### 9.1 Revisión final de código

- Se revisaron `git status` y `git diff` de todos los archivos modificados y nuevos; no se encontraron scripts temporales, archivos de prueba, tokens, contraseñas ni archivos `.env` incluidos en los cambios. `backend/.env` y `frontend/.env` existen localmente pero están excluidos por `.gitignore` (confirmado con `git check-ignore -v`) y nunca aparecieron en `git status`.
- Se corrigió el registro duplicado de `roleRouter` en `backend/src/app.ts`: antes se registraba `app.use("/api/roles", roleRouter)` dos veces (una **antes** de los middlewares `helmet`/`cors`/`express.json`, y otra después). Se eliminó la primera declaración, dejando una única declaración de `roleRouter` y una única asociación de ruta, después de los middlewares de seguridad y parseo, igual que el resto de routers.
- `npx tsc --noEmit` ejecutado después de la corrección: **sin errores**.
- Prueba rápida de salud y autenticación tras la corrección (sin exponer secretos):
  - `GET /api/health` → `200 OK`.
  - `GET /api/health/database` → `200 OK` (conexión con PostgreSQL confirmada).
  - `POST /api/auth/login` con las credenciales administrativas ya configuradas → `200 OK` (sin cambiar ni mostrar la contraseña).
  - `GET /api/roles` sin token → `401` (confirma que la ruta única sigue protegida correctamente tras eliminar la duplicada).
  - **Sin regresiones detectadas.**

### 9.2 Auditoría de datos QA (solo lectura)

Se ejecutó una consulta de solo lectura contra `usuarios` y `socios`, identificando registros por patrones de nombre/correo/CI con prefijo `qa`/`QA` (sin exponer correos, contraseñas, hashes ni otros datos personales):

| Tabla | Total de registros | Identificados como QA | Preexistentes / reales |
|---|---|---|---|
| `usuarios` | 8 | 6 (`id_usuario` 3, 4, 5, 6, 7, 8) | 2 (`id_usuario` 1 y 2: Administrador real y Recepcionista real) |
| `socios` | 2 | 2 (`id_socio` 1 y 2) | 0 |

De los 6 usuarios QA, 1 permanece `ACTIVO` (`id_usuario = 3`, creado en la sesión de HDU-04, nunca desactivado por diseño de esa sesión) y 5 están `INACTIVO`. Los 2 socios QA están `INACTIVO`. Ningún registro QA fue eliminado en esta sesión.

**Nota de vínculo:** el socio QA `id_socio = 2` está vinculado a `id_usuario = 2` (la cuenta Recepcionista real, `maria.elena@nivelfitness.com`), usada únicamente para probar la relación única usuario-socio en HDU-10. El usuario real en sí no fue alterado; solo el registro de socio (dato de prueba) quedó vinculado a él y luego desactivado.

### 9.3 Procedimiento seguro propuesto para limpiar los datos QA (a ejecutar en una sesión posterior, con aprobación explícita)

1. Confirmar nuevamente, antes de ejecutar cualquier limpieza, que ningún registro QA fue reutilizado como dato real (por ejemplo, que ningún socio o usuario real terminó usando un correo `qa.*`).
2. Para los usuarios QA (`id_usuario` 3 a 8): dado que el sistema no permite eliminación física de usuarios (regla técnica del proyecto) y ya están mayormente `INACTIVO`, la limpieza recomendada es:
   - Desactivar el único usuario QA que sigue `ACTIVO` (`id_usuario = 3`) mediante `PATCH /api/users/3/deactivate`, autenticado como Administrador.
   - Dejar los demás usuarios QA tal como están (`INACTIVO`), ya que la baja lógica ya cumple el objetivo de que no puedan iniciar sesión ni operar en el sistema.
3. Para los socios QA (`id_socio` 1 y 2): ya están `INACTIVO`; no requieren acción adicional bajo la misma regla de no eliminación física.
4. Si en el futuro se requiere una limpieza más profunda (por ejemplo, antes de una entrega final o de una demo), evaluar con el Product Owner/tutor si se justifica una eliminación física controlada, ejecutada manualmente sobre la base de datos de **desarrollo local únicamente**, filtrando estrictamente por los patrones `correo LIKE 'qa.%'` y `ci LIKE 'QA-%'`, con respaldo previo (`pg_dump`) y nunca sobre un entorno con datos reales de producción.
5. No se propone ni se ejecuta ninguna eliminación en este cierre técnico; esta sección es solo una propuesta de procedimiento para aprobación posterior.

## 10. Resumen para el documento Word (capítulo de desarrollo / resultados)

> Durante el Sprint 1 se implementó y validó funcionalmente, en un entorno local de desarrollo, el módulo de autenticación y gestión de usuarios del sistema (inicio y cierre de sesión con JWT, recuperación de contraseña por token de un solo uso, registro/listado/actualización de cuentas, asignación y cambio de rol, desactivación de cuentas y consulta de perfil), así como el módulo de gestión de socios (registro con generación automática de código único, listado con búsqueda y filtros, actualización de datos personales y desactivación lógica). Se incorporaron protecciones administrativas específicas para evitar que el propio Administrador se despoje de sus permisos o desactive su cuenta, y para impedir que el sistema quede sin al menos un Administrador activo. Todas las operaciones de baja son lógicas (cambio de estado), sin eliminación física de información, conforme a los lineamientos técnicos del proyecto. El control de acceso por rol (Administrador, Recepcionista, Socio) se verificó en cada endpoint mediante autenticación JWT y autorización por rol en el backend. Las 13 historias de usuario planificadas para este sprint (HDU-01 a HDU-13) quedaron aprobadas técnicamente en el entorno local; su cierre formal está pendiente de evidencias visuales, registro en la herramienta de gestión de tareas (Trello), y validación del Product Owner y del tutor del proyecto.
