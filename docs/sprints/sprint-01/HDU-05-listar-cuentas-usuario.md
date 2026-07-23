# HDU-05 — Listar cuentas de usuario

## 1. Identificación

- **Sprint:** Sprint 1
- **Historia de usuario:** HDU-05
- **Título:** Listar cuentas de usuario
- **Estado:** Aprobada funcionalmente en el entorno local de desarrollo.

## 2. Objetivo de la historia

Permitir que un Administrador consulte el listado completo de cuentas de usuario del sistema, con su rol asociado, sin exponer información sensible.

## 3. Archivos del backend relacionados

- `backend/src/routes/user.routes.ts`
- `backend/src/controllers/user.controller.ts`
- `backend/src/services/user.service.ts`
- `backend/src/repositories/user.repository.ts`
- `backend/src/middlewares/auth.middleware.ts`

## 4. Criterios de aceptación verificados

1. Solo un usuario autenticado con rol Administrador puede listar cuentas. ✅ Cumplido
2. El listado incluye el rol asociado a cada usuario (mediante `JOIN` con `roles`). ✅ Cumplido
3. La respuesta no expone `password_hash`. ✅ Cumplido
4. Un usuario autenticado con un rol distinto de Administrador recibe acceso denegado. ✅ Cumplido

## 5. Tabla de pruebas ejecutadas

| Caso | Descripción | HTTP esperado | HTTP obtenido | Datos sensibles expuestos | Resultado |
|---|---|---|---|---|---|
| A | Listado sin autenticación | 401 | 401 | No aplica | Aprobado |
| B | Listado como Administrador autenticado | 200 | 200 | No | Aprobado |
| C | Listado con token autenticado de rol no Administrador (Socio) | 403 | 403 | No aplica | Aprobado |

## 6. Resultado obtenido

- Sin token, la petición fue rechazada antes de llegar al controlador.
- Con token de administrador, se obtuvo el listado de usuarios registrados (incluye al menos el administrador de prueba y el usuario creado durante la prueba de HDU-04), sin `password_hash` en ninguna fila.
- Con un token válido pero de rol Socio (generado internamente solo para esta prueba de autorización, sin exponer su valor), la petición fue rechazada con `403` y el mensaje "No tiene permisos para realizar esta acción".

## 7. Resultado final

**HDU-05 aprobada funcionalmente en el entorno local de desarrollo.**

El cierre completo de la historia queda sujeto a la incorporación de las
evidencias visuales, la referencia del commit de GitHub, la actualización de
Trello y la validación correspondiente del Product Owner y del tutor.

## 8. Alcance de la validación

- Prueba realizada en entorno local.
- Backend ejecutado en `localhost:3000`.
- Conexión correcta con PostgreSQL.
- Pruebas automatizadas aún pendientes.
- Validación del Product Owner y tutor aún pendiente.

## 9. Riesgos y observaciones no bloqueantes

- El listado no tiene paginación ni filtros (por rol, estado, texto). No estaba definido como criterio obligatorio para HDU-05 y el volumen de datos actual es bajo, pero conviene decidir si se agrega en un sprint posterior si la cantidad de usuarios crece.
- Pruebas automatizadas todavía no configuradas.

## 10. Evidencias pendientes de insertar

- Captura de listado sin autenticación: **Pendiente**
- Captura de listado como Administrador: **Pendiente**
- Captura de listado con rol no Administrador (403): **Pendiente**
- Captura o registro de Trello: **Pendiente**
- Rama de GitHub: `sprint-01-autenticacion-usuarios-socios`
- Commit de cierre técnico del Sprint 1: `dd5cb8c`
- Estado del push: exitoso (rama actualizada en el remoto)
- Pull Request: **Pendiente** (todavía no existe)
- Merge: **Pendiente**
