# Resumen del bloque — HDU-01 a HDU-06

**Sprint:** Sprint 1
**Fecha de cierre del bloque:** entorno local de desarrollo (validación técnica, no productiva)

## 1. Estado de HDU-01 a HDU-06

| HDU | Título | Estado |
|---|---|---|
| HDU-01 | Iniciar sesión | Aprobada funcionalmente en entorno local de desarrollo |
| HDU-02 | Cerrar sesión | Aprobada funcionalmente en entorno local de desarrollo |
| HDU-03 | Recuperar contraseña | Aprobada funcionalmente en entorno local de desarrollo |
| HDU-04 | Registrar cuenta de usuario | Aprobada funcionalmente en entorno local de desarrollo |
| HDU-05 | Listar cuentas de usuario | Aprobada funcionalmente en entorno local de desarrollo (incluye prueba de autorización por rol) |
| HDU-06 | Actualizar cuenta de usuario | Aprobada funcionalmente en entorno local, dentro del alcance de actualización de datos personales |

Todas las aprobaciones son técnicas y locales; ninguna cuenta con validación del Product Owner ni del tutor todavía.

## 2. Funcionalidades implementadas

- Inicio y cierre de sesión con JWT.
- Recuperación de contraseña mediante token de un solo uso, con expiración, enviado por correo.
- Registro, listado y actualización (datos personales) de cuentas de usuario, restringido a rol Administrador.
- Protección de `GET /api/roles` (antes pública) con autenticación y autorización de rol.

## 3. Archivos creados o modificados (acumulado del bloque)

**Nuevos:**
- `backend/src/controllers/password-reset.controller.ts`
- `backend/src/services/password-reset.service.ts`
- `backend/src/services/email.service.ts`
- `backend/src/repositories/password-reset.repository.ts`
- `backend/src/validators/password-reset.validator.ts`

**Modificados:**
- `backend/src/routes/auth.routes.ts`
- `backend/src/routes/role.routes.ts`
- `backend/src/repositories/auth.repository.ts`
- `backend/.env.example`

**Sin cambios:** esquema SQL (`tokens_recuperacion` ya existía en `001_sprint_01_schema.sql`).

## 4. Pruebas ejecutadas y resultados

- `npx tsc --noEmit`: sin errores en todo el bloque.
- HDU-01: 3 casos funcionales (login correcto, contraseña incorrecta, correo inexistente) — todos aprobados.
- HDU-02: 2 casos (logout con/sin token) — todos aprobados.
- HDU-03: 11 casos (respuesta genérica, invalidación de tokens previos, token inválido, expirado, contraseña débil, restablecimiento correcto, token reutilizado, contraseña anterior rechazada, contraseña nueva aceptada) — todos aprobados.
- HDU-04: 3 casos (registro válido, correo duplicado, sin autenticación) — todos aprobados.
- HDU-05: 3 casos (sin autenticación, como Administrador, con rol no Administrador) — todos aprobados.
- HDU-06: 3 casos (actualización válida, usuario inexistente, sin autenticación) — todos aprobados.
- `GET /api/roles`: 3 casos (sin token, rol no Administrador, Administrador) — todos aprobados.

## 5. Decisiones tomadas

- HDU-02, HDU-04 y HDU-05 quedan aprobadas en entorno local.
- HDU-06 se considera completa dentro de su alcance: solo actualiza datos personales permitidos de la cuenta.
- El cambio de rol pertenece a HDU-07.
- La desactivación de cuenta pertenece a HDU-08.
- `GET /api/roles` debía protegerse con autenticación y rol Administrador — implementado y verificado.

## 6. Riesgos no bloqueantes

- No existe mecanismo de límite de intentos (rate limiting) ni en login ni en la solicitud de recuperación de contraseña.
- Posible mitigación pendiente de diferencias temporales (timing attack leve) en la comparación de credenciales de login.
- El listado de usuarios (HDU-05) no tiene paginación ni filtros.
- Pruebas automatizadas (framework de testing) todavía no configuradas en el proyecto.

## 7. Evidencias pendientes

En las seis historias: capturas visuales de cada caso de prueba, registro o actualización en Trello, referencia del commit de GitHub, y validación formal del Product Owner y del tutor. Documentado individualmente en cada archivo `HDU-0X-*.md` dentro de `docs/sprints/sprint-01/`.

## 8. Estado del correo

HDU-03 fue validada localmente con transporte de prueba (`jsonTransport` de Nodemailer, que construye el mensaje sin enviarlo por red). El envío real mediante un servidor SMTP configurado continúa pendiente de prueba.

## 9. Siguiente bloque

HDU-07 a HDU-09 (no iniciado en esta sesión).
