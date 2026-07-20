# Resumen del bloque — HDU-07 a HDU-09

**Sprint:** Sprint 1
**Fecha de cierre del bloque:** entorno local de desarrollo (validación técnica, no productiva)

## 1. Estado de HDU-07 a HDU-09

| HDU | Título | Estado |
|---|---|---|
| HDU-07 | Asignar o cambiar rol de usuario | Aprobada funcionalmente en entorno local de desarrollo |
| HDU-08 | Desactivar cuenta de usuario | Aprobada funcionalmente en entorno local de desarrollo |
| HDU-09 | Consultar perfil | Aprobada funcionalmente en entorno local de desarrollo (implementada en sesión previa, verificada en esta sesión) |

Todas las aprobaciones son técnicas y locales; ninguna cuenta con validación del Product Owner ni del tutor todavía.

## 2. Funcionalidades implementadas

- `PATCH /api/users/:id/role`: cambio de rol de una cuenta, restringido a rol Administrador, validando existencia del usuario y del rol destino (activo).
- `PATCH /api/users/:id/deactivate`: baja lógica de una cuenta (`estado = 'INACTIVO'`), restringido a rol Administrador, con verificación de existencia y de estado previo (evita desactivar dos veces).
- `GET /api/auth/profile`: consulta del perfil de la cuenta autenticada (ya existente), verificada en este bloque junto con su interacción con la desactivación de cuentas.

## 3. Archivos creados o modificados (este bloque)

**Modificados:**
- `backend/src/routes/user.routes.ts`
- `backend/src/controllers/user.controller.ts`
- `backend/src/services/user.service.ts`
- `backend/src/repositories/user.repository.ts`
- `backend/src/validators/user.validator.ts`

**Sin cambios:** `backend/src/routes/auth.routes.ts`, `backend/src/controllers/profile.controller.ts`, `backend/src/services/profile.service.ts`, `backend/src/repositories/profile.repository.ts` (HDU-09 ya estaba implementada de una sesión anterior; no requirió cambios).

**Sin cambios:** esquema SQL (`usuarios.id_rol` y `usuarios.estado` ya existían en `001_sprint_01_schema.sql`).

## 4. Pruebas ejecutadas y resultados

- `npx tsc --noEmit`: sin errores en todo el bloque.
- HDU-07: 5 casos (cambio de rol válido, usuario inexistente, rol inexistente, sin autenticación, body inválido) — todos aprobados.
- HDU-08: 6 casos (desactivación válida, desactivación repetida, usuario inexistente, sin autenticación, login rechazado tras desactivación, perfil rechazado con token vigente tras desactivación) — todos aprobados.
- HDU-09: 4 casos (consulta autenticada, sin autenticación, token inválido, token vigente de cuenta desactivada) — todos aprobados.

Las pruebas se ejecutaron con `curl` contra el backend corriendo en `localhost:3000`, usando la cuenta Administrador y la cuenta de prueba creada durante HDU-04. Los datos de prueba (estado y rol del usuario 3) fueron restaurados a su valor original al finalizar.

## 5. Decisiones tomadas

- El cambio de rol y la desactivación son endpoints independientes de `PATCH /api/users/:id` (que solo actualiza datos personales), conforme a lo ya documentado en HDU-06.
- La desactivación es lógica, no física, conforme a la regla técnica del proyecto de evitar eliminaciones físicas con información histórica relacionada.
- No se implementó protección contra que un Administrador cambie su propio rol o desactive su propia cuenta, por no haber sido solicitado como requisito explícito de estas historias. Queda documentado como riesgo pendiente de decisión en HDU-07 y HDU-08.
- No se implementó endpoint de reactivación de cuenta (fuera del alcance textual de HDU-08, que es exclusivamente "desactivar").

## 6. Riesgos no bloqueantes

- Ningún administrador está protegido contra auto-cambio de rol o autodesactivación (ver HDU-07 sección 9 y HDU-08 sección 9).
- No existe endpoint de reactivación de cuenta.
- No existe lista de revocación de tokens JWT; la protección contra cuentas desactivadas depende de que cada endpoint sensible revalide el estado contra la base de datos (como lo hace `/profile`), no de invalidar el token en sí.
- Pruebas automatizadas (framework de testing) todavía no configuradas en el proyecto.
- No se probó el caso de rol inactivo en la consulta de perfil (HDU-09) con una petición HTTP real.

## 7. Evidencias pendientes

En las tres historias: capturas visuales de cada caso de prueba, registro o actualización en Trello, referencia del commit de GitHub, y validación formal del Product Owner y del tutor. Documentado individualmente en `HDU-07-cambiar-rol-usuario.md`, `HDU-08-desactivar-cuenta-usuario.md` y `HDU-09-consultar-perfil.md`.

## 8. Siguiente bloque

HDU-10 (no iniciado en esta sesión, por instrucción explícita).
