# HDU-03 — Recuperar contraseña

## 1. Identificación

- **Sprint:** Sprint 1
- **Historia de usuario:** HDU-03
- **Título:** Recuperar contraseña
- **Estado:** Aprobada funcionalmente en el entorno local de desarrollo.

## 2. Objetivo de la historia

Permitir que un usuario recupere el acceso a su cuenta cuando olvida su contraseña, mediante una solicitud por correo electrónico que genera un enlace de un solo uso, con expiración, para establecer una nueva contraseña de forma segura.

## 3. Archivos del backend relacionados (creados o modificados en este bloque)

- `backend/src/routes/auth.routes.ts` (modificado: nuevas rutas)
- `backend/src/controllers/password-reset.controller.ts` (nuevo)
- `backend/src/services/password-reset.service.ts` (nuevo)
- `backend/src/services/email.service.ts` (nuevo)
- `backend/src/repositories/password-reset.repository.ts` (nuevo)
- `backend/src/repositories/auth.repository.ts` (modificado: `findActiveUserIdByEmail`)
- `backend/src/validators/password-reset.validator.ts` (nuevo)
- `backend/.env.example` (modificado: variables SMTP y de recuperación)
- `database/001_sprint_01_schema.sql` (tabla `tokens_recuperacion`, ya existente, sin cambios de esquema)

## 4. Flujo implementado

1. **Solicitud** — `POST /api/auth/forgot-password` recibe `correo`.
2. Se busca un usuario **activo** con ese correo. Si no existe o está inactivo, no se genera ningún token ni se envía correo, pero la respuesta es idéntica a la del caso exitoso.
3. Si el usuario existe y está activo:
   - Se invalidan (marcan como usados) los tokens vigentes anteriores del mismo usuario.
   - Se genera un token aleatorio criptográficamente seguro (`crypto.randomBytes(32)`).
   - Se almacena únicamente el **hash SHA-256** del token en `tokens_recuperacion`, junto con su fecha de expiración (`PASSWORD_RESET_EXPIRES_MINUTES`, por defecto 30 minutos).
   - Se envía un correo (vía `email.service.ts`, Nodemailer) con un enlace que incluye el token en texto plano — el token nunca se guarda en texto plano ni se devuelve en la respuesta HTTP.
4. **Confirmación** — `POST /api/auth/reset-password` recibe `token` y `password` (nueva).
5. Se valida el formato de la contraseña (mínimo 8 caracteres) antes de tocar la base de datos.
6. Se calcula el hash del token recibido y se busca un registro **no usado y no expirado** con ese hash.
7. Si no se encuentra, se rechaza con `400` y un mensaje que no distingue "inválido" de "expirado" ni de "ya usado" (todos caen en la misma consulta de "token válido").
8. Si se encuentra, se actualiza `password_hash` del usuario y se marca el token como usado, **dentro de una transacción** (`BEGIN`/`COMMIT`/`ROLLBACK` con un cliente dedicado del pool).

## 5. Servicio de correo

`backend/src/services/email.service.ts` es un módulo separado y reutilizable:

- Si `SMTP_HOST` está configurado, usa un transporte SMTP real con Nodemailer.
- Si `SMTP_HOST` **no** está configurado (como en este entorno local de pruebas), usa automáticamente el transporte `jsonTransport` de Nodemailer, que **construye el mensaje pero no lo envía por red**. Esto permitió ejecutar todas las pruebas sin enviar correos reales y sin necesitar credenciales SMTP.

## 6. Variables de entorno añadidas (solo en `.env.example`, sin valores reales)

`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`, `PASSWORD_RESET_URL`, `PASSWORD_RESET_EXPIRES_MINUTES`. No se modificó el archivo `.env` real ni se incluyeron credenciales SMTP reales.

## 7. Tabla de pruebas ejecutadas

| Caso | Descripción | HTTP esperado | HTTP obtenido | Resultado |
|---|---|---|---|---|
| A | Solicitud con correo existente y activo | 200 | 200 | Aprobado |
| B | Solicitud con correo inexistente | 200 | 200 | Aprobado |
| C | Mensaje idéntico entre A y B | — | Idéntico confirmado | Aprobado |
| D | Reutilización de un token invalidado por una solicitud posterior (requisito 8) | 400 | 400 | Aprobado |
| E | Token inválido / inexistente | 400 | 400 | Aprobado |
| F | Contraseña nueva que no cumple las reglas (menos de 8 caracteres) | 400 | 400 | Aprobado |
| G | Restablecimiento correcto con token vigente | 200 | 200 | Aprobado |
| H | Reutilización del mismo token ya usado | 400 | 400 | Aprobado |
| I | Token expirado (expiración forzada en BD para la prueba) | 400 | 400 | Aprobado |
| J | Login con la contraseña anterior tras el cambio | 401 | 401 | Aprobado |
| K | Login con la contraseña nueva tras el cambio | 200 | 200 | Aprobado |

## 8. Resultado obtenido

- El token nunca se imprimió, devolvió al cliente ni se almacenó en texto plano; se capturó únicamente dentro del proceso de prueba mediante un parámetro opcional de callback (`onTokenGenerated`) del servicio, usado solo para fines de prueba y no expuesto por ningún controlador ni ruta pública.
- Las respuestas de `forgot-password` fueron indistinguibles entre correo existente e inexistente, en código HTTP y en mensaje.
- La actualización de contraseña y el marcado del token como usado se verificaron como transaccionales (mismo bloque `BEGIN`/`COMMIT`).
- Tras el restablecimiento, la contraseña anterior dejó de funcionar y la nueva contraseña permitió iniciar sesión correctamente.
- No se expuso `password_hash`, tokens ni correos en ninguna respuesta HTTP mostrada como evidencia.

## 9. Resultado final

**HDU-03 aprobada funcionalmente en el entorno local de desarrollo.**

El cierre completo de la historia queda sujeto a la incorporación de las
evidencias visuales, la referencia del commit de GitHub, la actualización de
Trello y la validación correspondiente del Product Owner y del tutor. Adicionalmente, queda pendiente una prueba de entrega real de correo contra un servidor SMTP válido, ya que en este entorno se utilizó el transporte de prueba (`jsonTransport`) de Nodemailer, que no envía correos por red.

## 10. Alcance de la validación

- Prueba realizada en entorno local.
- Backend ejecutado en `localhost:3000`.
- Conexión correcta con PostgreSQL.
- Envío de correo simulado mediante `jsonTransport` (sin SMTP real configurado); no se probó la entrega real de correo.
- Pruebas automatizadas (framework de testing) aún pendientes.
- Validación del Product Owner y tutor aún pendiente.

## 11. Riesgos y observaciones no bloqueantes

- No se probó el envío real de correo contra un servidor SMTP (fuera del alcance autorizado de este bloque, ya que no se debía enviar correo real sin configuración válida).
- No existe límite de frecuencia (rate limiting) para solicitudes repetidas de recuperación sobre el mismo correo; riesgo menor, ya señalado también para HDU-01.
- La cuenta de prueba utilizada (creada durante la evidencia de HDU-04) quedó con una contraseña distinta a la original como resultado directo y esperado de esta prueba.

## 12. Evidencias pendientes de insertar

- Captura de solicitud de recuperación: **Pendiente**
- Captura de restablecimiento correcto: **Pendiente**
- Captura de intento con token inválido/expirado/usado: **Pendiente**
- Prueba de entrega real de correo con SMTP configurado: **Pendiente**
- Captura o registro de Trello: **Pendiente**
- Enlace o referencia del commit de GitHub: **Pendiente**
