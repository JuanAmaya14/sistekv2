# Conectar el proyecto a una base de datos

Sistek usa PostgreSQL a través de una única variable de entorno: `DATABASE_URL`. El backend ([backend/src/config/database.ts](../backend/src/config/database.ts)) detecta automáticamente si la conexión es local o remota y activa SSL cuando corresponde.

Elige una opción:

- [Opción A — Docker (más simple para desarrollo local)](#opción-a--docker)
- [Opción B — PostgreSQL instalado localmente](#opción-b--postgresql-local-sin-docker)
- [Opción C — Supabase (base de datos en la nube, gratis)](#opción-c--supabase-en-la-nube)
- [Row Level Security](#row-level-security) (importante si usas Supabase u otro proveedor que expone una API REST sobre la BD)
- [Datos de prueba](#datos-de-prueba)
- [Solución de problemas](#solución-de-problemas)

---

## Opción A — Docker

Requiere [Docker Desktop](https://www.docker.com/) instalado.

```bash
docker-compose up -d
```

Esto levanta un contenedor de PostgreSQL 15 con el esquema aplicado automáticamente. Datos de conexión:

```
Host: localhost
Puerto: 5432
Usuario: postgres
Contraseña: admin
Base de datos: sistek_db
```

En `backend/.env`:
```
DATABASE_URL=postgresql://postgres:admin@localhost:5432/sistek_db
```

Para detener: `docker-compose down` (los datos persisten en el volumen `postgres_data`; para borrarlos también usa `docker-compose down -v`).

---

## Opción B — PostgreSQL local (sin Docker)

1. Instala [PostgreSQL](https://www.postgresql.org/download/).
2. Crea la base de datos:
   ```bash
   createdb sistek_db
   ```
3. Aplica el esquema:
   ```bash
   psql -d sistek_db -f database/schema.sql
   ```
4. En `backend/.env`:
   ```
   DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/sistek_db
   ```

---

## Opción C — Supabase (en la nube)

Gratuita para proyectos pequeños y no requiere instalar nada localmente.

### 1. Crear el proyecto
1. Ve a [supabase.com](https://supabase.com) y crea una cuenta.
2. **New Project** → elige nombre, región y define una **contraseña de base de datos** (guárdala).
3. Espera ~2 minutos a que se aprovisione.

### 2. Obtener la cadena de conexión
En **Project Settings → Database → Connect** verás varias opciones. Cuál elegir depende de tu red:

| Opción | Cuándo usarla |
|---|---|
| **Direct connection** (`db.<ref>.supabase.co:5432`) | Si tu red soporta IPv6. Es la conexión "cruda", ideal para un backend con pool persistente como este. |
| **Session pooler** (`aws-0-<region>.pooler.supabase.com:5432`) | Alternativa por IPv4. Úsala si la conexión directa da `ENETUNREACH` o timeout (común en Docker Desktop / redes IPv4-only). |
| **Transaction pooler** (puerto 6543) | **No recomendada aquí**: no soporta prepared statements ni comandos `SET`, lo que puede romper Sequelize. |

Copia la URI en formato **URI** (no la variante para un lenguaje específico):
```
postgresql://postgres:[YOUR-PASSWORD]@db.<ref>.supabase.co:5432/postgres
```

### 3. Completar `backend/.env`
```
DATABASE_URL=postgresql://postgres:TU-PASSWORD@db.<ref>.supabase.co:5432/postgres
NODE_ENV=development
```

Si tu contraseña tiene caracteres especiales (`@ # / % : ?`), debes percent-encodearlos:

| Carácter | Encode |
|---|---|
| `@` | `%40` |
| `#` | `%23` |
| `/` | `%2F` |
| `:` | `%3A` |
| `%` | `%25` |

El backend ya reconoce `supabase.co` y `pooler.supabase.com` en la URL para activar SSL automáticamente, sin necesidad de `NODE_ENV=production`.

### 4. Aplicar el esquema
**Opción simple — SQL Editor de Supabase:**
Pega el contenido de [database/schema.sql](../database/schema.sql) en **SQL Editor → New query** y ejecuta. Repite con [database/seeds/initial_data.sql](../database/seeds/initial_data.sql) si quieres datos de ejemplo.

**Opción con psql:**
```bash
psql "postgresql://postgres:TU-PASSWORD@db.<ref>.supabase.co:5432/postgres" -f database/schema.sql
```

En la práctica, con este proyecto es más simple dejar que Sequelize cree las tablas automáticamente al arrancar el backend en desarrollo (`npm run dev`), y luego correr `node backend/scripts/seed.js` para los datos de ejemplo (ver [Datos de prueba](#datos-de-prueba)).

### 5. Probar
```bash
cd backend
npm run dev
```
Deberías ver `✅ Conexión a la base de datos establecida con Sequelize` y `🚀 Server running on http://localhost:4000`.

---

## Row Level Security

**Aplica a Supabase y a cualquier proveedor que exponga una API REST pública sobre la base de datos.**

Supabase no es solo PostgreSQL: además de la conexión directa que usa este backend, publica automáticamente una **API REST** (PostgREST) sobre el esquema `public`, consumible con una clave pública ("anon key") pensada para ir incrustada en aplicaciones cliente.

Por defecto, los roles `anon` y `authenticated` de esa API tienen permisos completos (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) sobre las tablas. **Sin Row Level Security (RLS), cualquiera con esa clave pública podría leer o modificar los datos directamente, saltándose por completo la autenticación y los controles de este backend** — incluyendo los hashes de contraseñas de `users` y los tokens de `password_reset_tokens`.

Este proyecto activa RLS automáticamente al arrancar el backend ([backend/src/services/migrations.ts](../backend/src/services/migrations.ts), función `enableRowLevelSecurity`), sobre todas las tablas del esquema `public`. Activar RLS sin definir políticas equivale a **denegar todo** el acceso a `anon`/`authenticated`, que es el comportamiento correcto: el frontend nunca habla con Supabase directamente, solo con la API de Express.

El backend no se ve afectado porque conecta como el usuario `postgres`, dueño de las tablas, que tiene `BYPASSRLS`. Por eso se usa `ENABLE ROW LEVEL SECURITY` y **no** `FORCE ROW LEVEL SECURITY` — esta última aplicaría las restricciones también al dueño de las tablas y dejaría la aplicación sin acceso.

**Verificación manual** (opcional): en el panel de Supabase, en *Advisors → Security Advisor*, los avisos "RLS Disabled in Public" deben desaparecer después de arrancar el backend una vez con la nueva base de datos.

---

## Datos de prueba

```bash
cd backend
node scripts/seed.js
```

Crea (o actualiza) 5 usuarios y, si la tabla de tickets está vacía, 4 tickets de ejemplo con historial:

| Usuario | Correo | Rol |
|---|---|---|
| cliente1 | cliente1@sistek.com | cliente |
| cliente2 | cliente2@sistek.com | cliente |
| agente1 | agente1@sistek.com | agente |
| agente2 | agente2@sistek.com | agente |
| admin1 | admin1@sistek.com | administrador |

Contraseña de todos: **`Password123`**. Se inicia sesión con el **correo**, no con el nombre de usuario.

El script es idempotente para los usuarios (usa el correo como clave de conflicto) y no duplica tickets si ya existen.

---

## Solución de problemas

**"JWT_SECRET no está configurado" / el servidor no arranca**
No es un problema de la base de datos: falta `JWT_SECRET` en `backend/.env`, o tiene un valor de ejemplo. Genera uno:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

**`ENETUNREACH` o timeout al conectar con Supabase**
La conexión directa de Supabase es IPv6-only en muchas redes. Cambia a la **Session pooler** (ver tabla en la sección de Supabase).

**`invalid input value for enum enum_tickets_priority`**
Síntoma de una base creada con una versión antigua del esquema. Se corrige solo al arrancar el backend: [backend/src/services/migrations.ts](../backend/src/services/migrations.ts) normaliza los valores antiguos antes de que Sequelize sincronice el modelo.

**Error de conexión / "la base de datos no existe"**
- Local: confirma que el servicio de PostgreSQL está corriendo y que el nombre de la base en `DATABASE_URL` coincide con el creado.
- Docker: revisa `docker-compose ps` y los logs con `docker-compose logs postgres_db`.
- Supabase: confirma la contraseña (puedes resetearla en *Project Settings → Database*) y que los caracteres especiales estén percent-encodeados.
