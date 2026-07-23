# Frontend — HDU-05, HDU-07, HDU-08 (listado de usuarios)

## 1. Identificación

- **Historias cubiertas:** HDU-05 (Listar cuentas de usuario), HDU-07 (Asignar o cambiar rol), HDU-08 (Desactivar cuenta de usuario).
- **Estado:** Aprobado funcionalmente en entorno local (`expo start --web`), probado en navegador contra el backend real.

## 2. Objetivo

Pantalla de administración de usuarios: listado con búsqueda local, cambio de rol y desactivación de cuentas, visible únicamente para el rol Administrador.

## 3. Archivos creados

- `frontend/app/(tabs)/usuarios.tsx` — pantalla de listado/gestión de usuarios.
- `frontend/lib/confirm.ts` — helpers `confirmAsync` y `notify`, multiplataforma (ver sección 6).

## 4. Archivos modificados

- `frontend/lib/api.ts` — se agregaron `listUsuarios`, `cambiarRolUsuario`, `desactivarUsuario`, `listRoles` y los tipos `UsuarioListado`/`Rol`.
- `frontend/app/(tabs)/_layout.tsx` — nueva pestaña "Usuarios", oculta automáticamente si el usuario autenticado no es Administrador (`href: null` quando corresponde).
- `frontend/components/ui/icon-symbol.tsx` — mapeo de ícono `person.2.fill`.
- Se eliminó `frontend/app/(tabs)/explore.tsx` (contenido de plantilla de Expo, sin uso).

## 5. Decisiones de diseño

- **Búsqueda:** el backend `GET /api/users` no admite filtros ni búsqueda por texto (a diferencia de `GET /api/socios`, que sí). En vez de modificar el backend fuera de alcance, se implementó **búsqueda del lado del cliente** (filtrado en memoria sobre la lista ya cargada), suficiente para el volumen actual de usuarios.
- **Cambio de rol:** se muestran los 3 roles disponibles (consultados en vivo con `GET /api/roles`) como chips; el rol actual aparece deshabilitado.
- **Protecciones ya existentes en el backend, reflejadas en la interfaz:** la fila del propio usuario autenticado no muestra los botones "Cambiar rol" ni "Desactivar" (en su lugar, un texto explicativo), evitando que el usuario intente una acción que el backend igualmente rechazaría con `403`.
- **Errores del backend** (por ejemplo, "no puede dejar al sistema sin Administradores activos") se muestran tal cual llegan de la API, sin reinterpretarlos en el frontend.

## 6. Hallazgo y corrección: `Alert.alert` no funciona en Expo Web

Durante la prueba en navegador se detectó que `Alert.alert` de React Native **no tiene implementación visual en la variante web** (react-native-web la deja como no operativa): el botón "Desactivar" no mostraba ningún diálogo de confirmación y no ejecutaba ninguna acción, sin ningún error visible. Esto habría pasado desapercibido sin probar en el navegador.

**Corrección:** se creó `frontend/lib/confirm.ts` con:
- `confirmAsync(titulo, mensaje)`: usa `window.confirm` en web y `Alert.alert` en nativo (iOS/Android), devolviendo una `Promise<boolean>` en ambos casos.
- `notify(titulo, mensaje)`: mismo criterio para mensajes de error simples.

Este helper debe reutilizarse en toda futura pantalla que necesite confirmaciones o alertas (por ejemplo, desactivar un socio, cancelar una sesión programada), en vez de llamar a `Alert.alert` directamente.

## 7. Pruebas ejecutadas (navegador, `expo start --web`, autenticado como Administrador)

| Caso | Descripción | Resultado |
|---|---|---|
| A | Listado de usuarios | Se muestran los 12 usuarios reales de la base de datos local, con nombre, correo, rol y estado. Aprobado. |
| B | Búsqueda por texto (`recepcionista.prueba`) | Filtra correctamente a un solo resultado. Aprobado. |
| C | Cambio de rol (Recepcionista de prueba → Socio → Recepcionista) | Ambos cambios se reflejaron de inmediato en la lista, coincidiendo con la respuesta real del backend. Aprobado. |
| D | Fila del propio Administrador autenticado | No muestra botones de acción; muestra el texto explicativo. Aprobado. |
| E | Botón "Desactivar" invoca confirmación real | Tras la corrección del hallazgo de la sección 6, el botón dispara `window.confirm`; se verificó que al cancelar no se realiza ninguna petición HTTP (`PATCH .../deactivate` ausente en el registro de red). No se pudo automatizar la aceptación del diálogo nativo del navegador desde la herramienta de pruebas, por lo que el camino de confirmación positiva no se verificó de extremo a extremo en esta sesión. |

## 8. Riesgos y pendientes

- **Caso E arriba:** falta verificar manualmente (un humano haciendo clic en "Aceptar") que la desactivación se ejecuta correctamente tras confirmar, aunque la llamada a la API (`desactivarUsuario`) ya está probada indirectamente por la pantalla de perfil y por las pruebas de backend de HDU-08.
- No se implementó formulario de registro de usuario (HDU-04) en esta pantalla; solo listado, cambio de rol y desactivación.
- Pruebas automatizadas de frontend todavía no configuradas.
