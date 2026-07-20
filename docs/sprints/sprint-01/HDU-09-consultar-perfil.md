# HDU-09 — Consultar perfil

## 1. Identificación

- **Sprint:** Sprint 1
- **Historia de usuario:** HDU-09
- **Título:** Consultar perfil de la cuenta autenticada
- **Estado:** Aprobada funcionalmente en el entorno local de desarrollo.

## 2. Objetivo de la historia

Permitir que cualquier usuario autenticado (Administrador, Recepcionista o Socio) consulte los datos de su propia cuenta y su rol, revalidando en cada consulta que la cuenta y el rol sigan activos.

## 3. Endpoint

`GET /api/auth/profile`

Acceso: requiere autenticación (cualquier rol).

## 4. Archivos del backend relacionados

Esta historia ya estaba implementada de una sesión anterior (commit `f4b7853 — feat: proteger rutas y consultar perfil autenticado`); en esta sesión se revisó y se ejecutaron pruebas adicionales, sin modificar código.

- `backend/src/routes/auth.routes.ts`
- `backend/src/controllers/profile.controller.ts`
- `backend/src/services/profile.service.ts`
- `backend/src/repositories/profile.repository.ts`
- `backend/src/middlewares/auth.middleware.ts`

## 5. Criterios de aceptación verificados

1. Solo un usuario autenticado puede consultar su perfil. ✅ Cumplido
2. El perfil devuelto corresponde al usuario del token (`request.auth.idUsuario`), no a un ID arbitrario. ✅ Cumplido
3. Se revalida el estado de la cuenta en cada consulta (no solo en el login). ✅ Cumplido
4. Se revalida el estado del rol asignado en cada consulta. ✅ Cumplido
5. La respuesta no expone `password_hash`. ✅ Cumplido

## 6. Tabla de pruebas ejecutadas

| Caso | Descripción | HTTP esperado | HTTP obtenido | Mensaje obtenido | Resultado |
|---|---|---|---|---|---|
| A | Consulta de perfil autenticado (Administrador) | 200 | 200 | "Perfil consultado correctamente" | Aprobado |
| B | Consulta sin autenticación | 401 | 401 | "Token de autenticación requerido" | Aprobado |
| C | Consulta con token inválido/mal formado | 401 | 401 | "Token inválido o expirado" | Aprobado |
| D | Consulta con token vigente de una cuenta desactivada después de emitido el token | 403 | 403 | "La cuenta de usuario se encuentra inactiva" | Aprobado |
| E | Consulta de perfil de un usuario cuyo **rol** está inactivo (`roles.estado = 'INACTIVO'`) | 403 | 403 | "El rol asignado se encuentra inactivo" | Aprobado (verificado en esta sesión) |

## 7. Resultado obtenido

- La consulta autenticada devolvió nombres, apellidos, CI, teléfono, correo, estado, fechas y rol del usuario del token, sin `password_hash`.
- Las peticiones sin token o con token inválido fueron rechazadas antes de llegar al controlador de perfil.
- El caso D (compartido con la prueba de HDU-08) confirmó que el perfil no depende únicamente de la validez criptográfica del JWT: consulta el estado actual de la cuenta y el rol en la base de datos en cada petición.
- El caso E confirmó que la revalidación del rol también funciona: se creó un usuario de prueba con rol Socio, se desactivó temporalmente el rol `Socio` en la tabla `roles` (dato de referencia, no información histórica de un usuario), se confirmó el rechazo `403`, y se restauró el rol a `ACTIVO` inmediatamente después de la prueba.

## 8. Alcance de la validación

- Prueba realizada en entorno local (`localhost:3000`), conexión correcta con PostgreSQL.
- Se usó la cuenta Administrador real (sin modificar su contraseña) y cuentas de prueba identificables creadas en esta sesión (`qa.hdu09.socio.*`) y en la sesión anterior (`qa.hdu04.*`).
- Pruebas automatizadas aún pendientes.
- Validación del Product Owner y tutor aún pendiente.

## 9. Riesgos y observaciones no bloqueantes

- La verificación del rol inactivo (caso E) requirió alternar temporalmente el estado del rol `Socio` en la tabla `roles`; se restauró a `ACTIVO` inmediatamente después de la prueba y se confirmó que el rol quedó operativo para el resto de usuarios que lo usan.
- Pruebas automatizadas todavía no configuradas.

## 10. Evidencias pendientes de insertar

- Captura de consulta de perfil autenticado: **Pendiente**
- Captura de consulta sin autenticación: **Pendiente**
- Captura de rechazo por rol inactivo: **Pendiente**
- Captura o registro de Trello: **Pendiente**
- Enlace o referencia del commit de GitHub: **Pendiente**
