# HDU-11 — Listar socios

## 1. Identificación

- **Sprint:** Sprint 1
- **Historia de usuario:** HDU-11
- **Título:** Listar socios
- **Estado:** Aprobada funcionalmente en el entorno local de desarrollo.

## 2. Objetivo de la historia

Permitir que un Administrador o Recepcionista consulte el listado de socios, con búsqueda por nombre/apellido/CI/código y filtro por estado, y consulte el detalle de un socio específico.

## 3. Endpoints

- `GET /api/socios` — listado, admite `?estado=ACTIVO|INACTIVO` y `?q=<texto>` (búsqueda parcial, insensible a mayúsculas, sobre nombres, apellidos, CI y código de socio).
- `GET /api/socios/:id` — detalle de un socio.

Acceso: requiere autenticación y rol Administrador o Recepcionista.

## 4. Archivos del backend relacionados

- `backend/src/routes/socio.routes.ts`
- `backend/src/controllers/socio.controller.ts`
- `backend/src/services/socio.service.ts`
- `backend/src/repositories/socio.repository.ts`

## 5. Criterios de aceptación verificados

1. Solo Administrador o Recepcionista pueden listar y consultar socios. ✅ Cumplido
2. Un rol no autorizado (Socio) no puede acceder al listado. ✅ Cumplido
3. El listado admite búsqueda por texto libre. ✅ Cumplido
4. El listado admite filtro por estado. ✅ Cumplido
5. La consulta de un socio inexistente responde `404`. ✅ Cumplido
6. Sin autenticación, se rechaza antes de llegar al controlador. ✅ Cumplido

## 6. Tabla de pruebas ejecutadas

| Caso | Descripción | HTTP esperado | HTTP obtenido | Resultado |
|---|---|---|---|---|
| A | Listado completo como Administrador | 200 | 200 | Aprobado |
| B | Búsqueda por texto (`?q=HDU10`) | 200 | 200 (2 resultados coincidentes) | Aprobado |
| C | Filtro por estado (`?estado=ACTIVO`) | 200 | 200 | Aprobado |
| D | Listado sin autenticación | 401 | 401 | Aprobado |
| E | Consulta individual de socio existente | 200 | 200 | Aprobado |
| F | Consulta individual de socio inexistente | 404 | 404 | Aprobado |
| G | Listado autorizado como Recepcionista | 200 | 200 | Aprobado |
| H | Listado rechazado para rol Socio | 403 | 403 | Aprobado |

## 7. Resultado obtenido

- El listado y la búsqueda devolvieron los socios de prueba esperados, sin errores.
- El filtro por estado funcionó correctamente sobre los datos de prueba (todos `ACTIVO` en el momento de la prueba).
- Un usuario con rol Socio (no Administrador ni Recepcionista) recibió `403` al intentar listar socios, confirmando la autorización por rol.

## 8. Alcance de la validación

- Prueba realizada en entorno local (`localhost:3000`), conexión correcta con PostgreSQL.
- Se usaron los socios de prueba creados durante HDU-10 y cuentas de prueba con rol Recepcionista y Socio, creadas específicamente para esta prueba (`qa.hdu11.*@example.com`).
- Pruebas automatizadas aún pendientes.
- Validación del Product Owner y tutor aún pendiente.

## 9. Riesgos y observaciones no bloqueantes

- No hay paginación en el listado de socios (mismo riesgo ya documentado para el listado de usuarios en HDU-05); a evaluar si el volumen de socios lo amerita en un sprint posterior.
- La búsqueda usa `LIKE` con comodines en ambos extremos (`%texto%`), lo que puede ser costoso en tablas grandes sin índice de texto; no es un problema con el volumen actual de datos de prueba.
- Pruebas automatizadas todavía no configuradas.

## 10. Evidencias pendientes de insertar

- Captura de listado y búsqueda: **Pendiente**
- Captura de rechazo por rol no autorizado: **Pendiente**
- Captura o registro de Trello: **Pendiente**
- Enlace o referencia del commit de GitHub: **Pendiente**
