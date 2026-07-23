# HDU-12 — Actualizar socio

## 1. Identificación

- **Sprint:** Sprint 1
- **Historia de usuario:** HDU-12
- **Título:** Actualizar socio
- **Estado:** Aprobada funcionalmente en el entorno local de desarrollo, dentro del alcance de datos personales.

## 2. Objetivo de la historia

Permitir que un Administrador o Recepcionista actualice los datos personales de un socio existente (nombres, apellidos, CI, teléfono, correo, fecha de nacimiento), validando duplicidad y existencia del socio.

## 3. Endpoint

`PATCH /api/socios/:id`

Body: campos opcionales `{ nombres?, apellidos?, ci?, telefono?, correo?, fecha_nacimiento? }` (actualización parcial).

Acceso: requiere autenticación y rol Administrador o Recepcionista.

## 4. Archivos del backend relacionados

- `backend/src/routes/socio.routes.ts`
- `backend/src/controllers/socio.controller.ts`
- `backend/src/services/socio.service.ts`
- `backend/src/repositories/socio.repository.ts`
- `backend/src/validators/socio.validator.ts`

## 5. Criterios de aceptación verificados

1. Solo Administrador o Recepcionista pueden actualizar un socio. ✅ Cumplido
2. Se valida que el socio a actualizar exista. ✅ Cumplido
3. Se valida duplicidad de correo excluyendo al propio socio. ✅ Cumplido
4. Se valida duplicidad de CI excluyendo al propio socio. ✅ Cumplido (verificado por revisión de código, mismo patrón que el correo)
5. Los campos no enviados conservan su valor actual (actualización parcial). ✅ Cumplido
6. `PATCH /api/socios/:id` **no permite cambiar `id_usuario`, `codigo_socio` ni `estado`** (por diseño; el cambio de estado corresponde a HDU-13). ✅ Cumplido

## 6. Tabla de pruebas ejecutadas

| Caso | Descripción | HTTP esperado | HTTP obtenido | Mensaje obtenido | Resultado |
|---|---|---|---|---|---|
| A | Actualización válida (teléfono) por Recepcionista | 200 | 200 | "Socio actualizado correctamente" | Aprobado |
| B | Socio inexistente | 404 | 404 | "El socio seleccionado no existe" | Aprobado |
| C | Sin autenticación | 401 | 401 | "Token de autenticación requerido" | Aprobado |
| D | Correo duplicado (tomar el correo de otro socio existente) | 409 | 409 | "Ya existe otro socio registrado con ese correo" | Aprobado |

## 7. Resultado obtenido

- La actualización válida modificó el teléfono del socio de prueba y devolvió el registro actualizado, con `codigo_socio` y `estado` sin cambios.
- La actualización sobre un ID inexistente fue rechazada con `404`.
- El intento de asignar un correo ya usado por otro socio fue rechazado con `409`.

## 8. Alcance de la validación

- Prueba realizada en entorno local (`localhost:3000`), conexión correcta con PostgreSQL.
- Se usaron los socios de prueba creados durante HDU-10.
- **Sobre "actualización sin alterar reservas, pagos o membresías históricas":** en el estado actual del Sprint 1, los módulos de reservas, pagos y membresías **todavía no están implementados** (no existen tablas ni endpoints para ellos en el esquema actual). Este criterio no se pudo verificar de forma funcional en esta sesión por no ser aplicable todavía; queda pendiente de verificación cuando esos módulos se implementen en sprints posteriores. Lo que sí se verificó es que `PATCH /api/socios/:id` no modifica `id_socio`, `codigo_socio`, `id_usuario`, `fecha_inscripcion` ni `estado`, preservando la identidad e historial propio del socio.
- Pruebas automatizadas aún pendientes.
- Validación del Product Owner y tutor aún pendiente.

## 9. Riesgos y observaciones no bloqueantes

- El criterio "no alterar reservas, pagos o membresías históricas" no pudo verificarse de extremo a extremo porque esos módulos no existen todavía en el sistema (fuera del alcance de Sprint 1, historias HDU-01 a HDU-13). Riesgo a revisar explícitamente cuando se implementen esas historias.
- No se probó explícitamente el conflicto de CI duplicado en actualización con una petición HTTP real en esta sesión (solo el de correo); la lógica es idéntica a la ya verificada en `updateUser` (HDU-06) y en el registro de socios (HDU-10).
- Pruebas automatizadas todavía no configuradas.

## 10. Evidencias pendientes de insertar

- Captura de actualización válida: **Pendiente**
- Captura de socio inexistente: **Pendiente**
- Captura de correo duplicado: **Pendiente**
- Captura o registro de Trello: **Pendiente**
- Rama de GitHub: `sprint-01-autenticacion-usuarios-socios`
- Commit de cierre técnico del Sprint 1: `dd5cb8c`
- Estado del push: exitoso (rama actualizada en el remoto)
- Pull Request: **Pendiente** (todavía no existe)
- Merge: **Pendiente**
