# HDU-08 — Desactivar cuenta de usuario

## 1. Identificación

- **Sprint:** Sprint 1
- **Historia de usuario:** HDU-08
- **Título:** Desactivar cuenta de usuario
- **Estado:** Aprobada funcionalmente en el entorno local de desarrollo, incluyendo protecciones administrativas.

## 2. Objetivo de la historia

Permitir que un Administrador desactive una cuenta de usuario existente (baja lógica, sin eliminar el registro), impidiendo que la cuenta pueda iniciar sesión o consultar su perfil mientras permanezca inactiva, y protegiendo al sistema contra la pérdida de administradores activos.

## 3. Endpoint

`PATCH /api/users/:id/deactivate`

Sin body. Acceso: requiere autenticación y rol Administrador.

## 4. Archivos del backend relacionados

**Modificados:**
- `backend/src/routes/user.routes.ts`
- `backend/src/controllers/user.controller.ts`
- `backend/src/services/user.service.ts`
- `backend/src/repositories/user.repository.ts`

**Sin cambios:** esquema SQL (`usuarios.estado` ya existía en `001_sprint_01_schema.sql`; la eliminación es lógica, no física, conforme a la regla técnica del proyecto).

## 5. Criterios de aceptación verificados

1. Solo un usuario autenticado con rol Administrador puede desactivar una cuenta. ✅ Cumplido
2. Se valida que el usuario a desactivar exista. ✅ Cumplido
3. Se rechaza la desactivación si la cuenta ya está inactiva (evita operación redundante). ✅ Cumplido
4. La desactivación es lógica (`estado = 'INACTIVO'`), no elimina el registro. ✅ Cumplido
5. Una cuenta inactiva no puede iniciar sesión. ✅ Cumplido (verificado también en HDU-01/login)
6. Una cuenta inactiva no puede consultar su perfil aunque presente un token JWT vigente emitido antes de la desactivación. ✅ Cumplido
7. La respuesta no expone `password_hash`. ✅ Cumplido
8. **Un Administrador no puede desactivar su propia cuenta.** ✅ Cumplido (agregado en esta sesión)
9. **No se permite dejar al sistema sin al menos un Administrador activo** al desactivar la cuenta de un Administrador. ✅ Cumplido (agregado en esta sesión)

## 6. Tabla de pruebas ejecutadas

### 6.1 Pruebas del bloque original (sesión anterior)

| Caso | Descripción | HTTP esperado | HTTP obtenido | Mensaje obtenido | Resultado |
|---|---|---|---|---|---|
| A | Desactivación válida de cuenta activa | 200 | 200 | "Usuario desactivado correctamente" | Aprobado |
| B | Desactivación de una cuenta ya inactiva | 409 | 409 | "La cuenta de usuario ya se encuentra inactiva" | Aprobado |
| C | Usuario inexistente | 404 | 404 | "El usuario seleccionado no existe" | Aprobado |
| D | Sin autenticación | 401 | 401 | "Token de autenticación requerido" | Aprobado |
| E | Intento de login con cuenta inactiva | 403 | 403 | "La cuenta de usuario se encuentra inactiva" | Aprobado |
| F | Consulta de perfil con token vigente emitido antes de la desactivación | 403 | 403 | "La cuenta de usuario se encuentra inactiva" | Aprobado |

### 6.2 Pruebas de protecciones administrativas (esta sesión)

| Caso | Descripción | HTTP esperado | HTTP obtenido | Mensaje obtenido | Resultado |
|---|---|---|---|---|---|
| G | Administrador intenta desactivar su propia cuenta (id 1 sobre sí mismo) | 403 | 403 | "Un administrador no puede desactivar su propia cuenta" | Aprobado |
| H | Administrador desactiva a otro Administrador de prueba (id 5, no es el último activo) | 200 | 200 | "Usuario desactivado correctamente" | Aprobado |
| I | Intento de desactivar al último Administrador activo (prueba a nivel de servicio, ver nota) | 409 | 409 | "No es posible completar la operación: el sistema debe mantener al menos un Administrador activo" | Aprobado |

**Nota sobre el caso I:** por la misma razón estructural documentada en HDU-07 (todos los endpoints de gestión de usuarios exigen actor con rol Administrador), no es posible alcanzar por HTTP el escenario "un tercero desactiva al último Administrador" sin que coincida con el caso de auto-desactivación (caso G). Se verificó la regla de forma aislada invocando `deactivateUser` directamente a nivel de servicio con un `actingUserId` distinto al usuario objetivo, en un estado donde solo quedaba un Administrador activo (el Administrador real, `id_usuario = 1`). La operación fue rechazada con `409` antes de escribir en la base de datos; se confirmó por consulta directa que el registro del Administrador real no cambió su `estado`.

## 7. Resultado obtenido

- La desactivación válida cambió `estado` a `INACTIVO` y devolvió el registro actualizado sin `password_hash`.
- Repetir la desactivación sobre la misma cuenta fue rechazada con `409`.
- Tras la desactivación, el intento de login con la cuenta afectada fue rechazado con `403` (verificado en `auth.service.ts`, ruta ya existente de HDU-01).
- Un token JWT emitido **antes** de la desactivación siguió siendo criptográficamente válido, pero `GET /api/auth/profile` lo rechazó con `403` porque `profile.service.ts` revalida el estado de la cuenta en cada consulta, no solo en el login.
- Un Administrador no puede desactivar su propia cuenta, sin importar cuántos Administradores activos existan.
- El sistema rechaza cualquier desactivación que dejaría cero Administradores activos.

## 8. Alcance de la validación

- Prueba realizada en entorno local (`localhost:3000`), conexión correcta con PostgreSQL.
- Se usó la cuenta Administrador real (solo para confirmar login y para los casos de auto-bloqueo, sin modificar su estado) y cuentas de prueba creadas específicamente para este bloque (`qa.hdu07.admina.*`, `qa.hdu07.adminb.*`, `qa.hdu09.socio.*`), identificables por su correo.
- **No se cambió la contraseña del Administrador real ni de ninguna cuenta preexistente en esta sesión.**
- Todas las cuentas de prueba creadas en esta sesión quedaron desactivadas (baja lógica) al finalizar, como limpieza de datos de prueba.
- Pruebas automatizadas aún pendientes.
- Validación del Product Owner y tutor aún pendiente.

## 9. Riesgos y observaciones no bloqueantes

- No existe endpoint de reactivación de cuenta (fuera del alcance textual de HDU-08, que es exclusivamente "desactivar"). Las cuentas de prueba quedaron inactivas de forma permanente en este entorno local; no se reactivaron por no ser necesario para historias posteriores.
- No existe lista de revocación de tokens JWT: un token emitido antes de la desactivación deja de ser aceptado en endpoints que revalidan estado contra la base de datos (`/profile`), pero seguiría siendo válido en endpoints que solo verifican la firma del token sin consultar el estado actual del usuario. No se detectaron endpoints con ese patrón en el código actual, pero es un riesgo a vigilar en historias futuras.
- La regla de "último Administrador activo" y la regla de "auto-desactivación" se solapan estructuralmente cuando solo queda un Administrador (ver nota del caso I), por la misma razón documentada en HDU-07.
- Pruebas automatizadas todavía no configuradas.

## 10. Evidencias pendientes de insertar

- Captura de desactivación válida: **Pendiente**
- Captura de desactivación repetida (409): **Pendiente**
- Captura de login rechazado tras desactivación: **Pendiente**
- Captura de auto-bloqueo de desactivación: **Pendiente**
- Captura o registro de Trello: **Pendiente**
- Enlace o referencia del commit de GitHub: **Pendiente**
