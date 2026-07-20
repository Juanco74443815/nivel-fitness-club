# HDU-10 — Registrar socio

## 1. Identificación

- **Sprint:** Sprint 1
- **Historia de usuario:** HDU-10
- **Título:** Registrar socio
- **Estado:** Aprobada funcionalmente en el entorno local de desarrollo.

## 2. Objetivo de la historia

Permitir que un Administrador o Recepcionista registre un nuevo socio (ficha de gimnasio), con generación automática de un código de socio único, validación de duplicidad de CI y correo, y vínculo opcional y único con una cuenta de usuario existente.

## 3. Endpoint

`POST /api/socios`

Body: `{ nombres, apellidos, ci?, telefono?, correo?, fecha_nacimiento?, id_usuario? }`

Acceso: requiere autenticación y rol Administrador o Recepcionista.

## 4. Archivos del backend relacionados (nuevos)

- `backend/src/routes/socio.routes.ts`
- `backend/src/controllers/socio.controller.ts`
- `backend/src/services/socio.service.ts`
- `backend/src/repositories/socio.repository.ts`
- `backend/src/validators/socio.validator.ts`
- `backend/src/app.ts` (registro de la nueva ruta `/api/socios`)

**Sin cambios:** esquema SQL (tabla `socios` ya existía en `001_sprint_01_schema.sql`; no fue necesario modificarla).

## 5. Diseño de `codigo_socio`

La tabla `socios.codigo_socio` es `NOT NULL UNIQUE` sin valor por defecto en el esquema. Para generarlo sin modificar el esquema y sin condiciones de carrera entre registros concurrentes, `createSocio` en `socio.repository.ts` ejecuta, dentro de una transacción:

1. `pg_advisory_xact_lock(<clave fija>)` — serializa la generación del código entre peticiones concurrentes.
2. `SELECT COALESCE(MAX(id_socio), 0) + 1` — calcula el siguiente número.
3. Inserta el socio con `codigo_socio = 'SOC-' || número con ceros a la izquierda (6 dígitos)`.

El código no está garantizado a coincidir exactamente con `id_socio` (son generados por mecanismos independientes), pero sí garantiza unicidad y ausencia de colisiones bajo concurrencia.

## 6. Criterios de aceptación verificados

1. Solo Administrador o Recepcionista pueden registrar un socio. ✅ Cumplido
2. Se genera un `codigo_socio` único automáticamente. ✅ Cumplido
3. Se rechaza CI duplicado. ✅ Cumplido
4. Se rechaza correo duplicado. ✅ Cumplido
5. Se valida que los datos obligatorios (nombres, apellidos) estén presentes. ✅ Cumplido
6. La vinculación con `id_usuario` es opcional; si se envía, se valida que el usuario exista. ✅ Cumplido
7. La relación usuario-socio es única: no se permite vincular el mismo `id_usuario` a más de un socio. ✅ Cumplido

## 7. Tabla de pruebas ejecutadas

| Caso | Descripción | HTTP esperado | HTTP obtenido | Mensaje obtenido | Resultado |
|---|---|---|---|---|---|
| A | Registro válido de socio (sin vínculo a usuario) | 201 | 201 | "Socio registrado correctamente" (código `SOC-000001`) | Aprobado |
| B | CI duplicado | 409 | 409 | "Ya existe un socio registrado con ese CI" | Aprobado |
| C | Correo duplicado | 409 | 409 | "Ya existe un socio registrado con ese correo" | Aprobado |
| D | Datos inválidos (nombres vacíos) | 400 | 400 | "Los datos enviados no son válidos" | Aprobado |
| E | Sin autenticación | 401 | 401 | "Token de autenticación requerido" | Aprobado |
| F | Registro vinculado a un usuario existente (`id_usuario`) | 201 | 201 | "Socio registrado correctamente" (código `SOC-000002`) | Aprobado |
| G | Relación única usuario-socio: repetir el mismo `id_usuario` en otro registro | 409 | 409 | "Ese usuario ya está vinculado a otro socio" | Aprobado |
| H | `id_usuario` inexistente | 400 | 400 | "El usuario indicado para vincular no existe" | Aprobado |

## 8. Resultado obtenido

- El primer socio de prueba recibió el código `SOC-000001`; el segundo, vinculado a un usuario existente, recibió `SOC-000002` (secuencia correcta y sin colisión).
- Las validaciones de duplicidad de CI y correo, y de datos inválidos, respondieron con los códigos y mensajes esperados.
- La vinculación opcional a un usuario funcionó y respetó la unicidad de la relación.

## 9. Alcance de la validación

- Prueba realizada en entorno local (`localhost:3000`), conexión correcta con PostgreSQL.
- Se usaron datos de prueba identificables (`QA HDU10 ...`, correos `qa.hdu10.*@example.com`, CI `QA-CI-<timestamp>-1`).
- No se probó concurrencia real (múltiples registros simultáneos); la protección contra condiciones de carrera se basa en el uso de `pg_advisory_xact_lock`, verificado por revisión de código.
- Pruebas automatizadas aún pendientes.
- Validación del Product Owner y tutor aún pendiente.

## 10. Riesgos y observaciones no bloqueantes

- No se probó el registro concurrente real (dos peticiones simultáneas) para confirmar empíricamente la ausencia de colisión de `codigo_socio`; la garantía actual es por diseño (bloqueo de transacción), no por prueba de carga.
- El formato del código (`SOC-000001`) es una decisión técnica de esta sesión, no especificada previamente en la documentación del proyecto; queda sujeta a confirmación por el Product Owner o el tutor.
- La fecha de nacimiento se valida como fecha ISO (`YYYY-MM-DD`) y no puede ser futura (restricción ya existente en el esquema SQL); no se probó explícitamente con una petición HTTP el rechazo por fecha futura en esta sesión.
- Pruebas automatizadas todavía no configuradas.

## 11. Evidencias pendientes de insertar

- Captura de registro válido: **Pendiente**
- Captura de CI/correo duplicado: **Pendiente**
- Captura de vínculo único usuario-socio: **Pendiente**
- Captura o registro de Trello: **Pendiente**
- Enlace o referencia del commit de GitHub: **Pendiente**
