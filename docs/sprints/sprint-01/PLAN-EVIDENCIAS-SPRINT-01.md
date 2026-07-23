# Plan de evidencias — Sprint 1 (HDU-01 a HDU-13)

Este documento organiza las capturas y evidencias **reales** que el estudiante debe obtener manualmente (herramienta HTTP como Postman/Insomnia/Thunder Client, navegador, terminal, Trello y GitHub) para cerrar formalmente el Sprint 1. Ninguna captura fue generada ni insertada todavía; todas quedan como **Pendiente** hasta que se adjunten los archivos reales.

**Convención de nombres de archivo:** `docs/sprints/sprint-01/evidencias/<archivo-sugerido>` (la carpeta `evidencias/` no existe todavía; créala al guardar la primera captura real).

## 1. Autenticación (HDU-01, HDU-02)

| # | Nombre sugerido | Pantalla o resultado que debe mostrar | Información a ocultar | HDU | Estado |
|---|---|---|---|---|---|
| 1.1 | `hdu01-login-correcto.png` | Respuesta `200` de `POST /api/auth/login` con credenciales válidas, mostrando `status: ok` y el objeto `usuario` (sin exponer el `token` completo ni la contraseña enviada) | Contraseña del cuerpo de la petición, token JWT completo | HDU-01 | Pendiente |
| 1.2 | `hdu01-login-password-incorrecta.png` | Respuesta `401` con mensaje "Correo o contraseña incorrectos" | Contraseña de prueba usada | HDU-01 | Pendiente |
| 1.3 | `hdu01-login-correo-inexistente.png` | Respuesta `401` con el mismo mensaje genérico, para un correo que no existe | — | HDU-01 | Pendiente |
| 1.4 | `hdu02-logout-con-token.png` | Respuesta `200` de `POST /api/auth/logout` autenticado | Token usado en el header `Authorization` | HDU-02 | Pendiente |
| 1.5 | `hdu02-logout-sin-token.png` | Respuesta `401` al cerrar sesión sin token | — | HDU-02 | Pendiente |

## 2. Recuperación de contraseña (HDU-03)

| # | Nombre sugerido | Pantalla o resultado que debe mostrar | Información a ocultar | HDU | Estado |
|---|---|---|---|---|---|
| 2.1 | `hdu03-forgot-password-respuesta-generica.png` | Respuesta `200` de `POST /api/auth/forgot-password`, igual para correo existente e inexistente | Correo electrónico usado en la prueba | HDU-03 | Pendiente |
| 2.2 | `hdu03-reset-password-correcto.png` | Respuesta `200` de `POST /api/auth/reset-password` con token válido y contraseña nueva | Token de recuperación, contraseña nueva | HDU-03 | Pendiente |
| 2.3 | `hdu03-reset-password-token-invalido.png` | Respuesta de error con token inválido o expirado | Token usado | HDU-03 | Pendiente |
| 2.4 | `hdu03-reset-password-token-reutilizado.png` | Respuesta de error al reutilizar un token ya usado | Token usado | HDU-03 | Pendiente |
| 2.5 | `hdu03-correo-transporte-local.png` (opcional) | Salida de consola del backend mostrando el mensaje construido por `jsonTransport` (evidencia de que HDU-03 se probó con transporte local, no envío real) | Cualquier dato personal visible en el cuerpo del correo simulado | HDU-03 | Pendiente |

## 3. Gestión de cuentas de usuario (HDU-04, HDU-05, HDU-06)

| # | Nombre sugerido | Pantalla o resultado que debe mostrar | Información a ocultar | HDU | Estado |
|---|---|---|---|---|---|
| 3.1 | `hdu04-registro-usuario-valido.png` | Respuesta `201` de `POST /api/users` con el usuario creado, sin `password_hash` | Contraseña enviada en la petición | HDU-04 | Pendiente |
| 3.2 | `hdu04-correo-duplicado.png` | Respuesta `409` al registrar con un correo ya existente | — | HDU-04 | Pendiente |
| 3.3 | `hdu05-listado-usuarios.png` | Respuesta `200` de `GET /api/users` como Administrador, mostrando varios registros sin `password_hash` | Correos reales si se desea, o difuminarlos | HDU-05 | Pendiente |
| 3.4 | `hdu05-listado-rechazado-rol-no-autorizado.png` | Respuesta `403` al listar usuarios con un rol distinto de Administrador | — | HDU-05 | Pendiente |
| 3.5 | `hdu06-actualizacion-valida.png` | Respuesta `200` de `PATCH /api/users/:id` con datos personales actualizados | — | HDU-06 | Pendiente |
| 3.6 | `hdu06-usuario-inexistente.png` | Respuesta `404` al actualizar un ID inexistente | — | HDU-06 | Pendiente |

## 4. Cambio de rol (HDU-07)

| # | Nombre sugerido | Pantalla o resultado que debe mostrar | Información a ocultar | HDU | Estado |
|---|---|---|---|---|---|
| 4.1 | `hdu07-cambio-rol-valido.png` | Respuesta `200` de `PATCH /api/users/:id/role` sobre otro usuario, mostrando el nuevo rol | — | HDU-07 | Pendiente |
| 4.2 | `hdu07-auto-cambio-rol-rechazado.png` | Respuesta `403` "Un administrador no puede cambiar su propio rol" | Correo/ID del administrador si se prefiere ocultarlo | HDU-07 | Pendiente |
| 4.3 | `hdu07-rol-inexistente.png` | Respuesta `400` al enviar un `id_rol` que no existe o está inactivo | — | HDU-07 | Pendiente |

## 5. Desactivación de cuentas (HDU-08)

| # | Nombre sugerido | Pantalla o resultado que debe mostrar | Información a ocultar | HDU | Estado |
|---|---|---|---|---|---|
| 5.1 | `hdu08-desactivacion-valida.png` | Respuesta `200` de `PATCH /api/users/:id/deactivate` con `estado: INACTIVO` | — | HDU-08 | Pendiente |
| 5.2 | `hdu08-desactivacion-repetida.png` | Respuesta `409` "La cuenta de usuario ya se encuentra inactiva" | — | HDU-08 | Pendiente |
| 5.3 | `hdu08-auto-desactivacion-rechazada.png` | Respuesta `403` "Un administrador no puede desactivar su propia cuenta" | — | HDU-08 | Pendiente |
| 5.4 | `hdu08-login-rechazado-cuenta-inactiva.png` | Respuesta `403` al intentar iniciar sesión con una cuenta desactivada | Correo usado en la prueba | HDU-08 | Pendiente |

## 6. Consulta de perfil (HDU-09)

| # | Nombre sugerido | Pantalla o resultado que debe mostrar | Información a ocultar | HDU | Estado |
|---|---|---|---|---|---|
| 6.1 | `hdu09-perfil-autenticado.png` | Respuesta `200` de `GET /api/auth/profile`, sin `password_hash` | Token usado en el header | HDU-09 | Pendiente |
| 6.2 | `hdu09-perfil-sin-token.png` | Respuesta `401` sin header `Authorization` | — | HDU-09 | Pendiente |
| 6.3 | `hdu09-perfil-rol-inactivo.png` | Respuesta `403` "El rol asignado se encuentra inactivo" | — | HDU-09 | Pendiente |

## 7. Registro de socios (HDU-10)

| # | Nombre sugerido | Pantalla o resultado que debe mostrar | Información a ocultar | HDU | Estado |
|---|---|---|---|---|---|
| 7.1 | `hdu10-registro-socio-valido.png` | Respuesta `201` de `POST /api/socios` mostrando el `codigo_socio` generado (ej. `SOC-000001`) | CI/correo si son datos reales de prueba sensibles | HDU-10 | Pendiente |
| 7.2 | `hdu10-ci-duplicado.png` | Respuesta `409` al registrar un CI ya usado por otro socio | — | HDU-10 | Pendiente |
| 7.3 | `hdu10-vinculo-usuario-socio.png` | Respuesta `201` con `id_usuario` vinculado, y luego `409` al repetir el mismo `id_usuario` en otro registro | — | HDU-10 | Pendiente |

## 8. Listado y búsqueda de socios (HDU-11)

| # | Nombre sugerido | Pantalla o resultado que debe mostrar | Información a ocultar | HDU | Estado |
|---|---|---|---|---|---|
| 8.1 | `hdu11-listado-socios.png` | Respuesta `200` de `GET /api/socios` con varios registros | — | HDU-11 | Pendiente |
| 8.2 | `hdu11-busqueda-por-texto.png` | Respuesta `200` de `GET /api/socios?q=<texto>` con resultados filtrados | — | HDU-11 | Pendiente |
| 8.3 | `hdu11-listado-rechazado-rol-socio.png` | Respuesta `403` al listar socios autenticado con rol Socio | — | HDU-11 | Pendiente |

## 9. Actualización de socios (HDU-12)

| # | Nombre sugerido | Pantalla o resultado que debe mostrar | Información a ocultar | HDU | Estado |
|---|---|---|---|---|---|
| 9.1 | `hdu12-actualizacion-valida.png` | Respuesta `200` de `PATCH /api/socios/:id` con datos personales actualizados | — | HDU-12 | Pendiente |
| 9.2 | `hdu12-correo-duplicado.png` | Respuesta `409` al asignar un correo ya usado por otro socio | — | HDU-12 | Pendiente |

## 10. Desactivación de socios (HDU-13)

| # | Nombre sugerido | Pantalla o resultado que debe mostrar | Información a ocultar | HDU | Estado |
|---|---|---|---|---|---|
| 10.1 | `hdu13-desactivacion-valida.png` | Respuesta `200` de `PATCH /api/socios/:id/deactivate` con `estado: INACTIVO` | — | HDU-13 | Pendiente |
| 10.2 | `hdu13-desactivacion-repetida.png` | Respuesta `409` "El socio ya se encuentra inactivo" | — | HDU-13 | Pendiente |

## 11. Conexión con PostgreSQL

| # | Nombre sugerido | Pantalla o resultado que debe mostrar | Información a ocultar | HDU | Estado |
|---|---|---|---|---|---|
| 11.1 | `infra-conexion-postgresql.png` | Respuesta `200` de `GET /api/health/database`, o consola del backend mostrando "PostgreSQL conectado" al iniciar | Nombre de usuario de la base de datos si se considera sensible; nunca la contraseña | Transversal | Pendiente |

## 12. Compilación sin errores

| # | Nombre sugerido | Pantalla o resultado que debe mostrar | Información a ocultar | HDU | Estado |
|---|---|---|---|---|---|
| 12.1 | `infra-tsc-sin-errores.png` | Terminal ejecutando `npx tsc --noEmit` en `backend/` sin salida de errores | Rutas absolutas del equipo si se prefiere recortarlas | Transversal | Pendiente |

## 13. Tablero de Trello

| # | Nombre sugerido | Pantalla o resultado que debe mostrar | Información a ocultar | HDU | Estado |
|---|---|---|---|---|---|
| 13.1 | `trello-tablero-sprint-01.png` | Tablero de Trello con las tarjetas HDU-01 a HDU-13 movidas a la columna correspondiente (ej. "Hecho" o "En revisión") | Información de otros proyectos o tarjetas no relacionadas con este sprint, si el tablero es compartido | Transversal | Pendiente |

## 14. Rama y commit en GitHub

| # | Nombre sugerido | Pantalla o resultado que debe mostrar | Información a ocultar | HDU | Estado |
|---|---|---|---|---|---|
| 14.1 | `github-rama-commit-sprint-01.png` | Vista en GitHub de la rama `sprint-01-autenticacion-usuarios-socios` con el commit `dd5cb8c` visible en el historial | — | Transversal | Pendiente |

## Notas

- Ninguna de las filas anteriores fue marcada como capturada: todas quedan en **Pendiente** hasta que el estudiante adjunte el archivo real y lo referencie desde el documento `HDU-XX-*.md` correspondiente.
- Al insertar cada captura, actualizar también la línea "Captura de ... : Pendiente" en el documento HDU correspondiente, reemplazándola por la ruta relativa del archivo insertado.
- No se debe capturar ni compartir: contraseñas, hashes (`password_hash`), tokens JWT completos, ni el archivo `.env` real.
- Este plan no inventa evidencia: es solo la lista organizada de lo que falta por capturar.
