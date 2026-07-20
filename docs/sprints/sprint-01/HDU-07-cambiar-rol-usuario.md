# HDU-07 — Asignar o cambiar rol de usuario

## 1. Identificación

- **Sprint:** Sprint 1
- **Historia de usuario:** HDU-07
- **Título:** Asignar o cambiar rol de una cuenta de usuario
- **Estado:** Aprobada funcionalmente en el entorno local de desarrollo, incluyendo protecciones administrativas.

## 2. Objetivo de la historia

Permitir que un Administrador cambie el rol asignado a una cuenta de usuario existente, validando que el usuario y el rol destino existan, que el rol se encuentre activo, y protegiendo al sistema contra la pérdida de administradores activos.

## 3. Endpoint

`PATCH /api/users/:id/role`

Body: `{ "id_rol": number }`

Acceso: requiere autenticación y rol Administrador.

## 4. Archivos del backend relacionados

**Modificados (bloque original + protecciones de esta sesión):**
- `backend/src/routes/user.routes.ts`
- `backend/src/controllers/user.controller.ts`
- `backend/src/services/user.service.ts`
- `backend/src/repositories/user.repository.ts`
- `backend/src/validators/user.validator.ts`

**Sin cambios:** esquema SQL (`usuarios.id_rol` ya existía en `001_sprint_01_schema.sql`).

## 5. Criterios de aceptación verificados

1. Solo un usuario autenticado con rol Administrador puede cambiar el rol de otra cuenta. ✅ Cumplido
2. Se valida que el usuario destino exista. ✅ Cumplido
3. Se valida que el rol destino exista y se encuentre activo. ✅ Cumplido
4. La respuesta no expone `password_hash`. ✅ Cumplido
5. El cambio de rol no modifica otros datos de la cuenta (nombres, apellidos, correo, estado). ✅ Cumplido
6. **Un Administrador no puede cambiar su propio rol.** ✅ Cumplido (agregado en esta sesión)
7. **No se permite dejar al sistema sin al menos un Administrador activo** al cambiar el rol de un Administrador hacia otro rol. ✅ Cumplido (agregado en esta sesión)

## 6. Tabla de pruebas ejecutadas

### 6.1 Pruebas del bloque original (HDU-07 a HDU-09, sesión anterior)

| Caso | Descripción | HTTP esperado | HTTP obtenido | Mensaje obtenido | Resultado |
|---|---|---|---|---|---|
| A | Cambio de rol válido (Socio → Recepcionista) | 200 | 200 | "Rol de usuario actualizado correctamente" | Aprobado |
| B | Usuario destino inexistente | 404 | 404 | "El usuario seleccionado no existe" | Aprobado |
| C | Rol destino inexistente | 400 | 400 | "El rol seleccionado no existe o se encuentra inactivo" | Aprobado |
| D | Sin autenticación | 401 | 401 | "Token de autenticación requerido" | Aprobado |
| E | Body inválido (`id_rol` faltante) | 400 | 400 | "Los datos enviados no son válidos" | Aprobado |

### 6.2 Pruebas de protecciones administrativas (esta sesión)

| Caso | Descripción | HTTP esperado | HTTP obtenido | Mensaje obtenido | Resultado |
|---|---|---|---|---|---|
| F | Administrador intenta cambiar su propio rol (id 1 sobre sí mismo) | 403 | 403 | "Un administrador no puede cambiar su propio rol" | Aprobado |
| G | Administrador cambia el rol de otro Administrador de prueba (id 4, no es el último activo) | 200 | 200 | "Rol de usuario actualizado correctamente" | Aprobado |
| H | Intento de degradar al último Administrador activo (prueba a nivel de servicio, ver nota) | 409 | 409 | "No es posible completar la operación: el sistema debe mantener al menos un Administrador activo" | Aprobado |

**Nota sobre el caso H:** en este sistema, todos los endpoints de gestión de usuarios exigen que el actor tenga rol Administrador (`authorizeRoles("Administrador")`). Esto implica que, si solo queda **un** Administrador activo en el sistema, el único actor capaz de invocar el endpoint es ese mismo Administrador — es decir, el escenario "un tercero degrada al último Administrador" es estructuralmente imposible de alcanzar por HTTP sin que coincida con el caso de auto-modificación (caso F). Para verificar la regla de "último Administrador activo" de forma aislada (independiente del bloqueo de auto-modificación), se invocó la función `changeUserRole` directamente a nivel de servicio, con un `actingUserId` distinto al usuario objetivo, en un estado donde solo quedaba un Administrador activo (`id_usuario = 1`, el Administrador real). La operación fue rechazada con `409` **antes de escribir en la base de datos**; se verificó por consulta directa que el registro del Administrador real no sufrió ningún cambio de rol ni de estado.

## 7. Resultado obtenido

- El cambio de rol válido sobre otro usuario (no el actor, no el último Administrador) actualizó `id_rol` y devolvió el registro sin `password_hash`.
- Las validaciones de usuario y rol inexistente respondieron con los códigos y mensajes esperados.
- La petición sin token fue rechazada antes de llegar al controlador.
- Un Administrador no puede cambiar su propio rol, sin importar cuántos Administradores activos existan.
- El sistema rechaza cualquier cambio de rol que dejaría cero Administradores activos.

## 8. Alcance de la validación

- Prueba realizada en entorno local (`localhost:3000`), conexión correcta con PostgreSQL.
- Se usó la cuenta Administrador real (solo para confirmar login y para los casos de auto-bloqueo, que no modifican su estado) y cuentas Administrador de prueba creadas específicamente para este bloque (`qa.hdu07.admina.*`, `qa.hdu07.adminb.*`), identificables por su correo.
- **No se cambió la contraseña del Administrador real ni de ninguna cuenta preexistente en esta sesión.** Solo se confirmó que el login administrativo ya configurado sigue funcionando.
- Pruebas automatizadas aún pendientes.
- Validación del Product Owner y tutor aún pendiente.

## 9. Riesgos y observaciones no bloqueantes

- El cambio de rol no invalida tokens JWT ya emitidos con el rol anterior: un token vigente conserva el rol con el que fue emitido hasta que expire o el usuario vuelva a iniciar sesión. Mismo comportamiento estructural que el resto del sistema (no hay lista de revocación de tokens).
- La regla de "último Administrador activo" y la regla de "auto-modificación" se solapan estructuralmente cuando solo queda un Administrador (ver nota del caso H). Ambas reglas están implementadas de forma independiente en el código (`user.service.ts`) por razones de robustez, aunque en la práctica actual de este sistema no existe una ruta HTTP donde solo se dispare la segunda sin la primera.
- Pruebas automatizadas todavía no configuradas.

## 10. Evidencias pendientes de insertar

- Captura de cambio de rol válido: **Pendiente**
- Captura de usuario inexistente: **Pendiente**
- Captura de rol inexistente: **Pendiente**
- Captura de auto-bloqueo de cambio de rol: **Pendiente**
- Captura o registro de Trello: **Pendiente**
- Enlace o referencia del commit de GitHub: **Pendiente**
