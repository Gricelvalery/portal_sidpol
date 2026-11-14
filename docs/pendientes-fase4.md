# Fase 4 — seguimiento

Estado de los pasos acordados (un commit por paso, sin push).

| #   | Paso                                                                         | Estado       | Commit    |
| --- | ---------------------------------------------------------------------------- | ------------ | --------- |
| 1   | Seguridad: Angular 21.2.8 → 21.2.25 (XSS/DoS)                                | ✅ Hecho     | `35a3fff` |
| 2   | ESLint + Prettier (config) y `.gitattributes` (LF)                           | ✅ Hecho     | `cc12cfe` |
| 3   | Formato con Prettier (solo estilo)                                           | ✅ Hecho     | `d608ad7` |
| 4   | Logger pino (sin contraseñas, tokens ni body del login)                      | ✅ Hecho     | `86f2948` |
| 5   | Q4: rutas de la API en plural + criterio de nombres de columnas              | ✅ Hecho     | `e6d7b84` |
| 6   | Validación de campos vacíos / solo espacios (front y back) + pruebas + tabla | ✅ Hecho     | `aa9d128` |
| 7   | OpenAPI / Swagger en `/api/docs`                                             | ✅ Hecho     | `2f84e6a` |
| 8   | README en la raíz                                                            | ⏳ Siguiente |           |
| 9   | GitHub Actions (lint, pruebas, audit)                                        | Pendiente    |           |
| —   | Entregar lista de problemas de accesibilidad                                 | Pendiente    |           |

## Notas

- Las capturas `19-dashboard-editar` y `02-login-errores` muestran ruido de
  suavizado de fuente (≤ 118 px) entre corridas idénticas; no es un cambio real.
- `24-usuarios-editar` mostró una diferencia una vez (1819 px) que no se repitió
  en 4 corridas posteriores con el mismo código: fallo intermitente de carga de
  la fuente, no del formateo.
- Prettier necesitó una segunda pasada en `submodulos.spec.ts` (cadenas de métodos).
- `frontend/sidpol-app/.npmrc` usa `legacy-peer-deps` porque npm 10.9 falla al
  resolver un peer opcional de `@angular/build` con `--before`.
- El spec local de `authGuard` (cambios sin commitear de la autora) se respeta:
  los commits solo llevan la versión commiteada con rutas/formato actualizados.
- La prueba de logs detectó que pino-http usaba sus propios serializadores
  (todos los headers y err.detail): se corrigió antes del commit.
