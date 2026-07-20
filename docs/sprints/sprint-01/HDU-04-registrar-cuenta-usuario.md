# HDU-04 — Registrar cuenta de usuario

## 1. Identificación

- **Sprint:** Sprint 1
- **Historia de usuario:** HDU-04
- **Título:** Registrar cuenta de usuario
- **Estado:** Aprobada funcionalmente en el entorno local de desarrollo.

## 2. Objetivo de la historia

Permitir que un Administrador registre nuevas cuentas de usuario, asignando un rol activo, validando datos obligatorios y evitando duplicidad de correo y CI.

## 3. Archivos del backend relacionados

- `backend/src/routes/user.routes.ts`
- `backend/src/controllers/user.controller.ts`
- `backend/src/services/user.service.ts`
- `backend/src/repositories/user.repository.ts`
- `backend/src/validators/user.validator.ts`
- `backend/src/middlewares/auth.middleware.ts`
- `backend/src/routes/role.routes.ts`
- `backend/src/controllers/role.controller.ts`
- `database/001_sprint_01_schema.sql`

## 4. Criterios de aceptación verificados

1. Solo un usuario con rol Administrador y autenticado puede registrar cuentas. ✅ Cumplido
2. Se valida que el rol asignado exista y esté activo. ✅ Cumplido
3. Se valida formato y obligatoriedad de correo, nombres, apellidos y contraseña (mínimo 8 caracteres). ✅ Cumplido
4. Se previene duplicidad de correo electrónico. ✅ Cumplido
5. Se previene duplicidad de CI cuando se proporciona. ✅ Cumplido (verificado por revisión de código; no se ejecutó caso de prueba específico de CI duplicado)
6. La contraseña se almacena como hash (`bcrypt`, factor de costo 12), nunca en texto plano. ✅ Cumplido
7. La respuesta no expone `password_hash`. ✅ Cumplido

## 5. Tabla de pruebas ejecutadas

| Caso | Descripción | HTTP esperado | HTTP obtenido | Mensaje obtenido | Datos sensibles expuestos | Resultado |
|---|---|---|---|---|---|---|
| A | Registro válido con correo único y rol activo | 201 | 201 | "Usuario registrado correctamente" | No | Aprobado |
| B | Registro con correo ya existente (mismo correo del caso A) | 409 | 409 | "Ya existe un usuario registrado con ese correo" | No | Aprobado |
| C | Registro sin autenticación | 401 | 401 | "Token de autenticación requerido" | No | Aprobado |

## 6. Resultado obtenido

- El registro válido devolvió el usuario creado con su `id_usuario`, sin exponer `password_hash`.
- El intento de duplicar el mismo correo fue rechazado con `409` y mensaje claro.
- El intento sin token de administrador fue rechazado con `401` antes de llegar al controlador.
- Se confirmó, mediante `GET /api/roles`, que el listado de roles activos está disponible para seleccionar el rol al registrar (rol "Socio" localizado correctamente).

## 7. Resultado final

**HDU-04 aprobada funcionalmente en el entorno local de desarrollo.**

El cierre completo de la historia queda sujeto a la incorporación de las
evidencias visuales, la referencia del commit de GitHub, la actualización de
Trello y la validación correspondiente del Product Owner y del tutor.

## 8. Alcance de la validación

- Prueba realizada en entorno local.
- Backend ejecutado en `localhost:3000`.
- Conexión correcta con PostgreSQL.
- Se creó un usuario de prueba real (correo de tipo `qa.hdu04.<marca-de-tiempo>@example.com`) como parte necesaria de la prueba; permanece en la base de datos del entorno local.
- Pruebas automatizadas aún pendientes.
- Validación del Product Owner y tutor aún pendiente.

## 9. Riesgos y observaciones no bloqueantes

- El endpoint `GET /api/roles` no exige autenticación (es público). No es un defecto de HDU-04 en sí, pero es relevante porque expone el listado de roles del sistema sin login. Se registra como observación para revisión conjunta, no como corrección de este bloque salvo que se decida incluirlo en la propuesta.
- No se probó el caso de CI duplicado con una petición real (se verificó solo por lectura de código).
- Pruebas automatizadas todavía no configuradas.

## 10. Evidencias pendientes de insertar

- Captura de registro correcto: **Pendiente**
- Captura de correo duplicado: **Pendiente**
- Captura de intento sin autenticación: **Pendiente**
- Captura o registro de Trello: **Pendiente**
- Enlace o referencia del commit de GitHub: **Pendiente**
