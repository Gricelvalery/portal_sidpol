# Validación de campos obligatorios (vacíos y solo espacios)

Todos los formularios de creación y edición rechazan los campos de texto obligatorios
vacíos o formados solo por espacios, tabs o saltos de línea, **en el frontend y en el
backend**. El backend es la protección real (cualquiera puede llamar a la API sin pasar
por la pantalla); el frontend evita enviar la petición y muestra el error junto al campo.

## Cómo se implementa

| Capa | Mecanismo |
|---|---|
| Backend (express-validator) | Texto: `isString()` → `trim()` → `notEmpty()`. Nombres y apellidos: `customSanitizer` que colapsa espacios + `notEmpty()`. Contraseña: **no se recorta** (los espacios son parte de ella) pero `custom(v => v.trim().length > 0)` rechaza las de solo espacios. Opcionales vacíos o con solo espacios se guardan como `null`. |
| Frontend (Reactive Forms) | `Validators.required` + `noSoloEspacios` (`shared/validators/texto.validators.ts`). `Validators.required` por sí solo **no** rechaza `'   '`, por eso se usan juntos (`textoObligatorio`). Los valores se envían con `trim()`. |

## Cobertura antes y después

Medida con pruebas automáticas contra el código anterior y el nuevo, probando cada
campo con `''`, `'   '`, `'\t\n '` y 8 espacios (este último supera cualquier largo
mínimo, como los 6 caracteres de la contraseña).

| Formulario | Campo obligatorio | Backend antes | Frontend antes | Ahora (ambos) |
|---|---|---|---|---|
| Usuarios — crear | Nombres | ✅ | ✅ | ✅ |
| | Apellido paterno | ✅ | ✅ | ✅ |
| | **Contraseña** | ❌ 8 espacios se aceptaban | ❌ 8 espacios se enviaban | ✅ |
| Usuarios — editar | Nombres | ✅ | ✅ | ✅ |
| | Apellido paterno | ✅ | ✅ | ✅ |
| Áreas — crear / editar | Nombre | ✅ | ✅ | ✅ |
| | Descripción | ✅ | ✅ | ✅ |
| Posiciones — crear | Nombre | ✅ | — sin formulario en el frontend | ✅ (backend) |
| Módulos — crear / editar | Nombre | ✅ | ✅ | ✅ |
| | Descripción | ✅ | ✅ | ✅ |
| Submódulos — crear / editar | Nombre | ✅ | ✅ | ✅ |
| | Descripción | ✅ | ✅ | ✅ |
| Dashboards — crear / editar | Nombre | ✅ | ✅ | ✅ |
| | Link | ✅ | ✅ | ✅ |
| | Nombre de cada página (`paginas[].nombre`) | ✅ | — no se edita en pantalla | ✅ (backend) |

Opcionales con solo espacios:

| Campo | Antes | Ahora |
|---|---|---|
| Apellido materno (usuarios) | se guardaba `null` ✅ | `null` ✅ |
| Descripción (posiciones) | se guardaba `''` ❌ | `null` ✅ |

**Qué cambió:** además de cerrar los dos huecos de la tabla, los formularios del
frontend pasaron de validaciones manuales (`if (!x.trim())`) a Reactive Forms con
validadores declarativos, con los mismos mensajes y el mismo aspecto.

## Pruebas

- Backend: `backend/tests/validaciones.test.js` (111 casos: control válido + cada campo × 4 valores vacíos, recorte de espacios, contraseña sin recortar, opcionales → `null`).
- Frontend: `src/app/features/configuracion/validaciones-formularios.spec.ts` (94 casos usando el DOM real: control válido que sí envía + cada campo × 4 valores que no envían y muestran el error) y `shared/validators/texto.validators.spec.ts`.
- Prueba de mutación: si se quita `noSoloEspacios`, fallan 50 pruebas del frontend.
