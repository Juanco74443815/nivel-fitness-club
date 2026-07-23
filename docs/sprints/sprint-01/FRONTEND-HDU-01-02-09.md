# Frontend — HDU-01, HDU-02, HDU-09 (primera pantalla real)

## 1. Identificación

- **Historias cubiertas:** HDU-01 (Iniciar sesión), HDU-02 (Cerrar sesión), HDU-09 (Consultar perfil).
- **Estado:** Aprobado funcionalmente en entorno local (`expo start --web`), probado en navegador contra el backend real.

## 2. Objetivo

Reemplazar el scaffold por defecto de Expo con la primera pantalla real de la aplicación multiplataforma: inicio de sesión, sesión persistida de forma segura, ruteo protegido según autenticación, consulta de perfil y cierre de sesión.

## 3. Archivos creados

- `frontend/lib/api.ts` — cliente HTTP tipado hacia el backend (`login`, `logout`, `getPerfil`), con manejo de errores (`ApiError`).
- `frontend/lib/secure-storage.ts` — almacenamiento seguro multiplataforma: `expo-secure-store` en nativo (iOS/Android), `localStorage` en web (SecureStore no tiene soporte web).
- `frontend/context/auth-context.tsx` — `AuthProvider` + hook `useSession()` (token, usuario, `signIn`, `signOut`, `isLoading`), con restauración de sesión al abrir la app.
- `frontend/app/sign-in.tsx` — pantalla de login (correo/contraseña, validación básica, mensaje de error, estado de carga).

## 4. Archivos modificados

- `frontend/app/_layout.tsx` — envuelve la app en `AuthProvider` y aplica el patrón `Stack.Protected` de expo-router v6 para enrutar automáticamente entre `sign-in` (sin sesión) y `(tabs)` (con sesión).
- `frontend/app/(tabs)/index.tsx` — pantalla "Mi perfil": consulta `GET /api/auth/profile` al enfocar la pestaña, muestra nombres/correo/rol/estado, botón "Cerrar sesión".
- `frontend/app/(tabs)/_layout.tsx` — pestaña renombrada de "Home" a "Perfil", ícono actualizado.
- `frontend/components/ui/icon-symbol.tsx` — mapeo de ícono `person.fill` para Android/web.
- `frontend/.env` / `.env.example` — variable `EXPO_PUBLIC_API_URL` (URL del backend).
- `frontend/package.json` / `package-lock.json` — se instaló `expo-secure-store` (ya estaba declarado en `package.json` pero faltaba en `node_modules`; autorizado explícitamente antes de ejecutar `npm install`).

## 5. Decisiones técnicas

- **Patrón de rutas protegidas:** se siguió la documentación oficial vigente de expo-router v6 (`Stack.Protected` con `guard`), consultada antes de escribir código, conforme a la instrucción del propio proyecto (`frontend/AGENTS.md`).
- **Token JWT:** se guarda con `expo-secure-store` en nativo (Keychain/Keystore) y `localStorage` en web. Se documenta que en web esto es menos seguro (expuesto a XSS); aceptable porque el foco del proyecto es la app móvil.
- **Resolución de sesión:** al cerrar sesión, si la llamada al backend falla (token ya expirado, sin conexión), la sesión igual se cierra localmente para no dejar al usuario bloqueado.

## 6. Pruebas ejecutadas (navegador, `expo start --web`)

| Caso | Descripción | Resultado |
|---|---|---|
| A | Login con credenciales válidas | Redirigido automáticamente a "Mi perfil" con los datos reales del Administrador autenticado. Aprobado. |
| B | Login con contraseña incorrecta | Mensaje "Correo o contraseña incorrectos" mostrado en pantalla. Aprobado. |
| C | Consulta de perfil (`GET /api/auth/profile`) | Datos reales mostrados (nombres, correo, rol, estado). Aprobado. |
| D | Cerrar sesión | `POST /api/auth/logout` respondió 200; la app volvió automáticamente a la pantalla de login. Aprobado. |

Peticiones de red verificadas: `OPTIONS`/`POST /api/auth/login` → 200, `OPTIONS`/`GET /api/auth/profile` → 200, `OPTIONS`/`POST /api/auth/logout` → 200. Sin errores en la consola del navegador.

## 7. Riesgos y pendientes

- Solo se probó en la variante web de Expo (navegador); falta probar en emulador/dispositivo real Android/iOS.
- `EXPO_PUBLIC_API_URL=http://localhost:3000` funciona para web y simuladores en la misma máquina; para dispositivo físico o emulador Android deberá ajustarse (ej. IP de LAN o `10.0.2.2`).
- No se implementó todavía la pantalla de "Recuperar contraseña" (HDU-03) ni las pantallas de gestión de usuarios/socios/clases en el frontend — quedan pendientes para las siguientes iteraciones de este mismo enfoque (una pantalla real primero, luego un skill que documente el patrón).
- Pruebas automatizadas de frontend todavía no configuradas.

## 8. Siguiente paso sugerido

Con este patrón ya establecido y probado, se puede crear un skill de Claude Code que lo documente (estructura de pantalla, uso de `useSession`, llamadas a `lib/api.ts`, manejo de error/carga) para que las próximas pantallas (listado de usuarios, socios, clases) se generen de forma consistente.
