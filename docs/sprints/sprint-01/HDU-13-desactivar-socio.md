# HDU-13 — Desactivar socio

## 1. Identificación

- **Sprint:** Sprint 1
- **Historia de usuario:** HDU-13
- **Título:** Desactivar socio
- **Estado:** Aprobada funcionalmente en el entorno local de desarrollo.

## 2. Objetivo de la historia

Permitir que un Administrador o Recepcionista desactive un socio (baja lógica, sin eliminar el registro).

## 3. Endpoint

`PATCH /api/socios/:id/deactivate`

Sin body. Acceso: requiere autenticación y rol Administrador o Recepcionista.

## 4. Archivos del backend relacionados

- `backend/src/routes/socio.routes.ts`
- `backend/src/controllers/socio.controller.ts`
- `backend/src/services/socio.service.ts`
- `backend/src/repositories/socio.repository.ts`

**Sin cambios:** esquema SQL (`socios.estado` ya existía en `001_sprint_01_schema.sql`; la desactivación es lógica, no física).

## 5. Criterios de aceptación verificados

1. Solo Administrador o Recepcionista pueden desactivar un socio. ✅ Cumplido
2. Se valida que el socio a desactivar exista. ✅ Cumplido
3. Se rechaza la desactivación si el socio ya está inactivo. ✅ Cumplido
4. La desactivación es lógica (`estado = 'INACTIVO'`), no elimina el registro. ✅ Cumplido
5. Un rol no autorizado (Socio) no puede desactivar socios. ✅ Cumplido

## 6. Tabla de pruebas ejecutadas

| Caso | Descripción | HTTP esperado | HTTP obtenido | Mensaje obtenido | Resultado |
|---|---|---|---|---|---|
| A | Desactivación válida | 200 | 200 | "Socio desactivado correctamente" | Aprobado |
| B | Desactivación repetida | 409 | 409 | "El socio ya se encuentra inactivo" | Aprobado |
| C | Socio inexistente | 404 | 404 | "El socio seleccionado no existe" | Aprobado |
| D | Rechazo para rol Socio | 403 | 403 | "No tiene permisos para realizar esta acción" | Aprobado |
| E | El socio sigue existiendo tras la desactivación (consulta posterior devuelve el registro con `estado: INACTIVO`) | 200 | 200 | — | Aprobado |

## 7. Resultado obtenido

- La desactivación válida cambió `estado` a `INACTIVO` sin eliminar el registro.
- Repetir la desactivación fue rechazada con `409`.
- Un usuario con rol Socio no pudo desactivar socios (`403`).
- La consulta posterior (`GET /api/socios/:id`) confirmó que el socio sigue existiendo en la base de datos con `estado: INACTIVO`, cumpliendo la regla de baja lógica del proyecto.

## 8. Alcance de la validación

- Prueba realizada en entorno local (`localhost:3000`), conexión correcta con PostgreSQL.
- Se usaron los socios de prueba creados durante HDU-10, que quedaron desactivados (baja lógica) como parte de la limpieza de datos de prueba de esta sesión.
- **Sobre "bloqueo de nuevas operaciones para un socio inactivo":** en el estado actual del Sprint 1, no existen todavía módulos de reservas, pagos ni membresías que dependan del estado del socio. Este criterio no pudo verificarse de forma funcional en esta sesión por no ser aplicable todavía; queda documentado como pendiente para cuando esos módulos existan. El propio módulo de socios (registrar, listar, actualizar) no impone bloqueo por `estado` porque no es un requisito de HDU-10 a HDU-13: `PATCH /api/socios/:id` sigue permitiendo corregir datos de un socio inactivo (por ejemplo, para corregir un error antes de una futura reactivación), lo cual es intencional y no representa una "nueva operación de negocio" sobre el socio.
- No existe endpoint de reactivación en esta historia (fuera del alcance textual de HDU-13, que es exclusivamente "desactivar").
- Pruebas automatizadas aún pendientes.
- Validación del Product Owner y tutor aún pendiente.

## 9. Riesgos y observaciones no bloqueantes

- El criterio "bloqueo de nuevas operaciones para un socio inactivo" solo pudo evaluarse parcialmente (no aplica a HDU-10/11/12 porque no hay módulos dependientes del estado del socio todavía). Se recomienda revisar explícitamente este punto al implementar reservas, pagos o membresías.
- No existe endpoint de reactivación de socio.
- Pruebas automatizadas todavía no configuradas.

## 10. Evidencias pendientes de insertar

- Captura de desactivación válida: **Pendiente**
- Captura de desactivación repetida (409): **Pendiente**
- Captura de rechazo por rol no autorizado: **Pendiente**
- Captura o registro de Trello: **Pendiente**
- Enlace o referencia del commit de GitHub: **Pendiente**
