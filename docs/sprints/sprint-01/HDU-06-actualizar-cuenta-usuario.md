# HDU-06 — Actualizar cuenta de usuario

## 1. Identificación

- **Sprint:** Sprint 1
- **Historia de usuario:** HDU-06
- **Título:** Actualizar cuenta de usuario
- **Estado:** Aprobada funcionalmente en el entorno local dentro del alcance de actualización de datos personales.

## 2. Objetivo de la historia

Permitir que un Administrador actualice los datos personales de una cuenta de usuario existente (nombres, apellidos, CI, teléfono, correo), validando duplicidad y existencia del usuario.

## 3. Archivos del backend relacionados

- `backend/src/routes/user.routes.ts`
- `backend/src/controllers/user.controller.ts`
- `backend/src/services/user.service.ts`
- `backend/src/repositories/user.repository.ts`
- `backend/src/validators/user.validator.ts`
- `backend/src/middlewares/auth.middleware.ts`
- `database/001_sprint_01_schema.sql`

## 4. Criterios de aceptación verificados

1. Solo un usuario autenticado con rol Administrador puede actualizar cuentas. ✅ Cumplido
2. Se valida que el usuario a actualizar exista. ✅ Cumplido
3. Se valida duplicidad de correo excluyendo al propio usuario. ✅ Cumplido (verificado por revisión de código; no se ejecutó caso de prueba específico)
4. Se valida duplicidad de CI excluyendo al propio usuario. ✅ Cumplido (verificado por revisión de código; no se ejecutó caso de prueba específico)
5. La respuesta no expone `password_hash`. ✅ Cumplido
6. Los campos no enviados conservan su valor actual (actualización parcial). ✅ Cumplido (verificado por revisión de código)

## 5. Tabla de pruebas ejecutadas

| Caso | Descripción | HTTP esperado | HTTP obtenido | Mensaje obtenido | Datos sensibles expuestos | Resultado |
|---|---|---|---|---|---|---|
| A | Actualización válida (teléfono) sobre usuario existente | 200 | 200 | "Usuario actualizado correctamente" | No | Aprobado |
| B | Actualización de usuario inexistente | 404 | 404 | "El usuario seleccionado no existe" | No aplica | Aprobado |
| C | Actualización sin autenticación | 401 | 401 | "Token de autenticación requerido" | No aplica | Aprobado |

## 6. Resultado obtenido

- La actualización válida modificó el teléfono del usuario de prueba y devolvió el registro actualizado sin `password_hash`.
- La actualización sobre un ID inexistente fue rechazada con `404` y mensaje claro.
- La actualización sin token fue rechazada con `401` antes de llegar al controlador.

## 7. Resultado final

**HDU-06 aprobada funcionalmente en el entorno local dentro del alcance de actualización de datos personales.**

El cierre completo de la historia queda sujeto a la incorporación de las
evidencias visuales, la referencia del commit de GitHub, la actualización de
Trello y la validación correspondiente del Product Owner y del tutor.

## 8. Alcance de la validación

- Prueba realizada en entorno local.
- Backend ejecutado en `localhost:3000`.
- Conexión correcta con PostgreSQL.
- La prueba se realizó sobre el usuario de prueba creado durante la validación de HDU-04.
- Pruebas automatizadas aún pendientes.
- Validación del Product Owner y tutor aún pendiente.

## 9. Riesgos y observaciones no bloqueantes

- `PATCH /api/users/:id` **no permite cambiar `id_rol` ni `estado`** por diseño. Confirmado: el cambio de rol corresponde a HDU-07 y la desactivación de cuenta corresponde a HDU-08; ambas se verificarán en esas historias, no en HDU-06.
- No se probó explícitamente el conflicto de correo/CI duplicado en actualización con una petición real (verificado solo por lectura de código).
- Pruebas automatizadas todavía no configuradas.

## 10. Evidencias pendientes de insertar

- Captura de actualización válida: **Pendiente**
- Captura de actualización de usuario inexistente: **Pendiente**
- Captura de actualización sin autenticación: **Pendiente**
- Captura o registro de Trello: **Pendiente**
- Rama de GitHub: `sprint-01-autenticacion-usuarios-socios`
- Commit de cierre técnico del Sprint 1: `dd5cb8c`
- Estado del push: exitoso (rama actualizada en el remoto)
- Pull Request: **Pendiente** (todavía no existe)
- Merge: **Pendiente**
