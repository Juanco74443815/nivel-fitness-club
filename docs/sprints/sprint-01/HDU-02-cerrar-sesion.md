# HDU-02 — Cerrar sesión

## 1. Identificación

- **Sprint:** Sprint 1
- **Historia de usuario:** HDU-02
- **Título:** Cerrar sesión
- **Estado:** Aprobada funcionalmente en el entorno local de desarrollo.

## 2. Objetivo de la historia

Permitir que un usuario autenticado cierre su sesión de forma explícita.

## 3. Archivos del backend relacionados

- `backend/src/routes/auth.routes.ts`
- `backend/src/controllers/auth.controller.ts`
- `backend/src/middlewares/auth.middleware.ts`
- `backend/src/utils/jwt.ts`

## 4. Criterios de aceptación verificados

1. El endpoint de cierre de sesión exige un token válido (`requireAuthentication`). ✅ Cumplido
2. Con un token válido, la respuesta confirma el cierre de sesión. ✅ Cumplido
3. Sin token, la petición es rechazada. ✅ Cumplido

## 5. Tabla de pruebas ejecutadas

| Caso | Descripción | HTTP esperado | HTTP obtenido | Mensaje obtenido | Resultado |
|---|---|---|---|---|---|
| A | Logout con token válido | 200 | 200 | "Sesión cerrada correctamente" | Aprobado |
| B | Logout sin token | 401 | 401 | "Token de autenticación requerido" | Aprobado |

## 6. Resultado obtenido

- El endpoint `POST /api/auth/logout` respondió correctamente cuando se envió un token válido.
- Sin token, la petición fue rechazada antes de llegar al controlador.
- No se expuso información sensible en ninguna respuesta.

## 7. Resultado final

**HDU-02 aprobada funcionalmente en el entorno local de desarrollo.**

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

- La implementación actual es un logout del lado del servidor puramente declarativo: como el token es JWT sin estado, el backend no invalida ni añade el token a una lista negra. El token sigue siendo técnicamente válido hasta su expiración natural si alguien lo conserva. Esto es un comportamiento común en diseños JWT sin blacklist, pero conviene que quede documentado como decisión de diseño explícita, no como un olvido.
- Pruebas automatizadas todavía no configuradas.

## 10. Evidencias pendientes de insertar

- Captura de logout con token válido: **Pendiente**
- Captura de logout sin token: **Pendiente**
- Captura o registro de Trello: **Pendiente**
- Enlace o referencia del commit de GitHub: **Pendiente**
