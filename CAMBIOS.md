# San Bartolo Asist — Correcciones aplicadas

## 1. 🔴 Crítico: permisos abiertos en la base de datos (RLS)

**Problema:** en `supabase/migrations/001_initial_schema.sql` todas las
políticas eran `auth.role() = 'authenticated'` para TODO (leer, crear,
editar, borrar). Es decir, cualquier socio con cuenta —no solo el
admin— podía leer y modificar los datos de todos los demás socios
llamando directamente a la API de Supabase (la URL y la anon key son
públicas, están en el código del navegador). Las páginas "solo admin"
solo estaban protegidas en el frontend (`RutaSoloAdmin.jsx`), lo cual
no protege nada a nivel de datos.

**Arreglo:** `supabase/migrations/002_seguridad_roles.sql` (nuevo archivo)
- Añade `miembros.user_id` para vincular cada socio con su cuenta.
- Crea la tabla `admins` para marcar explícitamente qué cuentas administran.
- Crea las funciones `is_admin()`, `is_socio()`, `existe_miembro_disponible()`
  y `vincular_cuenta_socio()` — el frontend ya las llamaba, pero no
  existían en ninguna migración versionada (desincronización de esquema).
- Reemplaza las políticas abiertas por políticas reales:
  - Admin: acceso total a todo.
  - Socio: solo puede **leer** su propia fila en `miembros`,
    `asistencias` y `comision_manual`. No puede escribir nada.
  - `comisiones` y `actividades` son de solo lectura para cualquier
    autenticado (se necesitan para mostrar "Mi resumen"), y solo el
    admin puede crearlas/editarlas/borrarlas.

**⚠️ Pasos manuales que tienes que hacer tú** (no tengo acceso a tu
proyecto de Supabase en producción):
1. Ejecuta `002_seguridad_roles.sql` en el SQL Editor de Supabase (o
   `supabase db push` si usas la CLI).
2. Da de alta tu propia cuenta (y la de cualquier otro admin) en la
   tabla `admins`. Busca el UUID en *Authentication → Users*:
   ```sql
   insert into admins (user_id) values ('UUID-DE-TU-CUENTA-ADMIN');
   ```
3. Si ya tenías socios registrados antes de este cambio, sus cuentas
   se vincularán solas la próxima vez que inicien sesión. Si alguno no
   vuelve a entrar, puedes vincularlo a mano (ver comentarios al final
   del archivo SQL).

## 2. 🔴 `src/services/miResumen.js`

**Problema:** la consulta pedía `miembros` con `.limit(1)` y sin
filtrar por usuario, confiando en que RLS devolviera solo la fila del
socio logueado. Como el punto 1 estaba roto, esto podía mostrarle a un
socio el resumen de **otro** socio en la pantalla "Mi resumen".

**Arreglo:** ahora se obtiene el usuario autenticado con
`supabase.auth.getUser()` y se filtra explícitamente
`.eq('user_id', user.id)`. Esto es además una segunda capa de
protección independiente de RLS (si en el futuro alguien vuelve a
abrir los permisos por error, esta consulta sigue estando bien
acotada).

## 3. 🟡 `.env` commiteado

**Problema:** el archivo `.env` con las credenciales reales del
proyecto estaba versionado en git.

**Arreglo:**
- `.gitignore` ahora incluye `.env`.
- Se añadió `.env.example` con placeholders, para que cualquiera que
  clone el repo sepa qué variables necesita sin exponer las reales.

**Pendiente de tu parte:** sacar el `.env` real del historial de git
(no basta con el próximo commit, ya quedó en commits anteriores):
```bash
git rm --cached .env
git commit -m "No versionar .env"
```
La anon key no es tan grave por sí sola (está pensada para ser
pública), pero como ya rotaste el modelo de permisos, de todas formas
es buena práctica no versionarla.

## 4. 🟢 Confirmaciones antes de borrar datos

- `src/pages/Actividades.jsx`: ahora pide confirmación antes de
  eliminar una actividad (recuerda que borra en cascada las
  asistencias registradas para esa actividad).
- `src/pages/Miembros.jsx`: ahora pide confirmación antes de dar de
  baja a un socio (reactivar no la necesita, no es destructivo).

## 5. 🟢 Nota sobre `xlsx` (SheetJS)

`package.json` usa `xlsx@0.18.5`, la última versión publicada en npm.
SheetJS dejó de publicar parches de seguridad en npm y los mueve a su
propio CDN. No lo cambié automáticamente porque no hay una versión más
nueva en el registro de npm; si quieres el parche más reciente, se
instala así:
```bash
npm uninstall xlsx
npm install https://cdn.sheetjs.com/xlsx-latest/xlsx-latest.tgz
```
Evalúalo tú porque implica confiar en un origen fuera de npm.

---

## Archivos incluidos en esta entrega
```
supabase/migrations/002_seguridad_roles.sql   (nuevo)
src/services/miResumen.js                     (corregido)
src/pages/Actividades.jsx                     (corregido)
src/pages/Miembros.jsx                        (corregido)
.gitignore                                    (corregido)
.env.example                                  (nuevo)
```

Copia estos archivos sobre tu repo local respetando las mismas rutas,
revisa el diff, y haz commit. La parte de base de datos (paso 1) es la
única que requiere que tú la ejecutes manualmente en Supabase, porque
no tengo acceso a tu proyecto en producción.
