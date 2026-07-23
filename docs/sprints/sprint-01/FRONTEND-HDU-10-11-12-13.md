# Frontend — HDU-10, HDU-11, HDU-12, HDU-13 (gestión de socios)

## 1. Identificación

- **Historias cubiertas:** HDU-10 (Registrar socio), HDU-11 (Listar socios), HDU-12 (Actualizar socio), HDU-13 (Desactivar socio).
- **Estado:** Aprobado funcionalmente en entorno local (`expo start --web`), probado contra el backend real.

## 2. Objetivo

Pantalla de gestión de socios para Administrador y Recepcionista: listado con búsqueda y filtro por estado (server-side), registro de un nuevo socio, edición de datos personales y desactivación lógica.

## 3. Archivos creados

- `frontend/app/(tabs)/socios.tsx` — pantalla de listado/gestión de socios.

## 4. Archivos modificados

- `frontend/lib/api.ts` — se agregaron `listSocios`, `crearSocio`, `actualizarSocio`, `desactivarSocio` y el tipo `SocioListado`/`CrearSocioInput`.
- `frontend/app/(tabs)/_layout.tsx` — nueva pestaña "Socios", visible para Administrador y Recepcionista.
- `frontend/components/ui/icon-symbol.tsx` — mapeo de ícono `person.3.fill`.

## 5. Decisiones de diseño

- **Búsqueda y filtro:** a diferencia del listado de usuarios, `GET /api/socios` sí admite `estado` y `q` como parámetros de servidor, así que aquí la búsqueda y el filtro son reales peticiones al backend (no filtrado local).
- **Edición inline:** tocar "Editar" reemplaza la fila por un formulario con los mismos campos que el registro (sin tocar `codigo_socio`, `id_usuario` ni `estado`, que están fuera del alcance de `PATCH /api/socios/:id`, tal como documenta HDU-12).
- **Registro:** formulario colapsable ("+ Nuevo socio") con nombres/apellidos obligatorios y CI/teléfono/correo/fecha de nacimiento opcionales; no incluye vínculo a `id_usuario` (esa vinculación queda para una gestión futura más específica, ya cubierta y probada a nivel de backend en HDU-10).

## 6. Pruebas ejecutadas (contra el backend real, autenticado como Administrador)

| Caso | Descripción | Resultado |
|---|---|---|
| A | Listado de socios | Muestra los socios reales con código, correo y estado. Aprobado. |
| B | Registro de un socio nuevo ("Carlos Ramírez") | `POST /api/socios` → `201`; código `SOC-000006` generado automáticamente y visible de inmediato en la lista. Aprobado. |
| C | Búsqueda por texto (`Carlos`) | `GET /api/socios?q=Carlos` → resultado filtrado correctamente. Aprobado. |
| D | Edición inline (agregar teléfono) | `PATCH /api/socios/6` → `200`; el cambio se refleja al instante en la lista. Aprobado. |
| E | Desactivación (con confirmación) | `PATCH /api/socios/6/deactivate` → `200`; el botón "Desactivar" desaparece de la fila y el estado pasa a `INACTIVO`, igual que en el backend. Aprobado. |

## 7. Nota sobre la metodología de prueba en esta sesión

Durante la prueba se detectó que la herramienta de automatización del navegador (clics por referencia de accesibilidad) estaba entregando coordenadas de clic desactualizadas en esta pantalla, lo que impedía activar los botones "Editar"/"Desactivar" bajo esa vía. Se confirmó, mediante inspección directa del DOM, que los manejadores de eventos (`onPress`) de la aplicación **sí se ejecutan correctamente**: al disparar el evento de clic directamente sobre el elemento real (bypass de la herramienta de coordenadas), los tres flujos (editar, guardar, desactivar) funcionaron de inmediato y devolvieron las respuestas HTTP esperadas. Es decir, **no se encontró ningún bug de la aplicación en esta pantalla**; el problema era exclusivamente de la herramienta de prueba automatizada.

## 8. Riesgos y pendientes

- No se implementó la vinculación de un socio a una cuenta de usuario (`id_usuario`) desde esta pantalla; el backend ya lo soporta (HDU-10) pero requeriría una selección de usuario, fuera de alcance de esta iteración.
- El layout no se adapta a anchos de escritorio grandes (queda en una columna angosta tipo móvil); es un tema de diseño responsivo pendiente para una iteración posterior, no bloqueante.
- Pruebas automatizadas de frontend todavía no configuradas.
