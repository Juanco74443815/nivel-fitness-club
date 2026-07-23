# HDU-01 — Iniciar sesión

## 1. Identificación

- **Sprint:** Sprint 1
- **Historia de usuario:** HDU-01
- **Título:** Iniciar sesión
- **Estado:** Aprobada funcionalmente en el entorno local de desarrollo.

## 2. Objetivo de la historia

Permitir que un usuario del sistema (administrador, recepcionista o socio) inicie sesión con su correo electrónico y contraseña, recibiendo un token de acceso (JWT) que le permita autenticarse en las siguientes peticiones, siempre que su cuenta y su rol se encuentren activos.

## 3. Archivos del backend relacionados

- `backend/src/routes/auth.routes.ts`
- `backend/src/controllers/auth.controller.ts`
- `backend/src/services/auth.service.ts`
- `backend/src/repositories/auth.repository.ts`
- `backend/src/validators/auth.validator.ts`
- `backend/src/utils/jwt.ts`
- `backend/src/types/auth.ts`
- `backend/src/middlewares/auth.middleware.ts`
- `backend/src/config/database.ts`
- `database/001_sprint_01_schema.sql`

## 4. Criterios de aceptación verificados

1. Recepción de correo y contraseña. ✅ Cumplido
2. Normalización y validación del correo. ✅ Cumplido
3. Comparación segura mediante bcrypt. ✅ Cumplido
4. Acceso exclusivo para cuentas y roles activos. ✅ Cumplido
5. Mensaje general para credenciales incorrectas. ✅ Cumplido
6. Generación de JWT con expiración. ✅ Cumplido
7. Contenido mínimo necesario del JWT. ✅ Cumplido
8. Respuesta sin `password_hash`. ✅ Cumplido
9. Actualización de `ultimo_acceso`. ✅ Cumplido
10. Manejo de errores sin exponer información interna. ✅ Cumplido

## 5. Tabla de pruebas ejecutadas

| Caso | Descripción | HTTP esperado | HTTP obtenido | Mensaje obtenido | Token presente | Datos sensibles expuestos | Resultado |
|---|---|---|---|---|---|---|---|
| A | Login correcto (administrador existente) | 200 | 200 | "Inicio de sesión correcto" | Sí | No | Aprobado |
| B | Correo correcto + contraseña incorrecta | 401 | 401 | "Correo o contraseña incorrectos" | No | No | Aprobado |
| C | Correo inexistente + contraseña válida en formato | 401 | 401 | "Correo o contraseña incorrectos" | No | No | Aprobado |

## 6. Resultado obtenido

- El **token** solo estuvo presente en el caso correcto (caso A); en los casos B y C no se devolvió token.
- El caso A devolvió **datos seguros del usuario** (información básica de identificación), sin exponer campos sensibles.
- En ningún caso la respuesta contuvo `password_hash` ni otra información sensible.
- Los casos B y C devolvieron el **mismo mensaje genérico** ("Correo o contraseña incorrectos"), sin diferenciar cuál dato falló.
- Se confirmó la **actualización de `ultimo_acceso`** en la base de datos como efecto del login correcto (caso A).

## 7. Resultado final

**HDU-01 aprobada funcionalmente en el entorno local de desarrollo.**

El cierre completo de la historia queda sujeto a la incorporación de las
evidencias visuales, la referencia del commit de GitHub, la actualización de
Trello y la validación correspondiente del Product Owner y del tutor.

## 8. Alcance de la validación

- Prueba realizada en entorno local.
- Backend ejecutado en `localhost:3000`.
- Conexión correcta con PostgreSQL.
- Pruebas automatizadas aún pendientes.
- Validación del Product Owner y tutor aún pendiente.

## 9. Riesgos no bloqueantes pendientes

- No existe mecanismo de **rate limiting** (límite de intentos) para el endpoint de login.
- Posible **mitigación de diferencias temporales** entre "correo inexistente" y "contraseña incorrecta" (riesgo leve de timing attack), pendiente de decisión antes de implementar.
- Las **pruebas automatizadas** (unitarias/integración) todavía no están configuradas en el proyecto.

## 10. Evidencias pendientes de insertar

- Captura de login correcto: **Pendiente**
- Captura de contraseña incorrecta: **Pendiente**
- Captura de correo inexistente: **Pendiente**
- Captura o registro de Trello: **Pendiente**
- Rama de GitHub: `sprint-01-autenticacion-usuarios-socios`
- Commit de cierre técnico del Sprint 1: `dd5cb8c`
- Estado del push: exitoso (rama actualizada en el remoto)
- Pull Request: **Pendiente** (todavía no existe)
- Merge: **Pendiente**
