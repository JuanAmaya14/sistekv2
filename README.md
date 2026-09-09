# Sistek — Sistema de Gestión de Tickets

Sistema web para la gestión de tickets de soporte técnico. Permite a los clientes crear solicitudes, a los agentes darles seguimiento y a los administradores supervisar el equipo con reportes de desempeño.

Proyecto académico construido con React + Node.js/Express + PostgreSQL, con autenticación por roles, notificaciones, adjuntos, calificación de atención y reportes en PDF.

## 📋 Índice

- [Funcionalidades](#-funcionalidades)
- [Tecnologías](#️-tecnologías)
- [Organización del proyecto](#-organización-del-proyecto)
- [Instalación rápida](#-instalación-rápida)
- [Variables de entorno](#-variables-de-entorno)
- [Base de datos](#-base-de-datos)
- [Roles y permisos](#-roles-y-permisos)
- [Endpoints de la API](#-endpoints-de-la-api)
- [Seguridad](#-seguridad)
- [Scripts disponibles](#-scripts-disponibles)
- [Solución de problemas](#-solución-de-problemas)

## ✨ Funcionalidades

- **Autenticación por roles** — cliente, agente y administrador, con JWT y control de acceso en cada endpoint.
- **Gestión de tickets** — creación, asignación a agentes, cambio de estado y prioridad, búsqueda por palabra clave.
- **Historial de auditoría** — cada cambio de estado, asignación o reapertura queda registrado con fecha y autor.
- **Reapertura de tickets** — clientes y agentes pueden reabrir un ticket cerrado dentro de un plazo de 30 días.
- **Comentarios** — conversación por ticket entre cliente y agente.
- **Adjuntos** — subida de archivos (JPG, PNG, PDF, DOCX) validados por contenido, no solo por extensión.
- **Notificaciones** — aviso al agente cuando se le asigna un ticket.
- **Calificación del servicio** — el cliente califica de 1 a 5 estrellas un ticket cerrado, dentro de un plazo de 7 días.
- **Reportes de desempeño** — métricas generales, por agente y de satisfacción del cliente, descargables en PDF.
- **Configuración de cuenta** — el usuario puede cambiar su nombre de usuario, su contraseña y el tema visual (claro/oscuro).
- **Recuperación de contraseña** — flujo por correo con token de un solo uso y expiración de 30 minutos.

## 🛠️ Tecnologías

### Frontend
- React 18 + TypeScript
- Vite
- React Router
- Recharts (gráficas del dashboard y reportes)

### Backend
- Node.js + Express 5 + TypeScript
- PostgreSQL, con Sequelize (modelos principales) y `pg` (consultas y lógica de negocio)
- JWT para autenticación, bcrypt para contraseñas
- Helmet + rate limiting para endurecer la API
- Multer para adjuntos, PDFKit para reportes, Nodemailer para correos

## 📂 Organización del proyecto

```
├── backend/          - API REST (Express + TypeScript + PostgreSQL)
│   ├── src/
│   │   ├── config/       - Conexión a la BD y variables de entorno
│   │   ├── controllers/  - Lógica de cada endpoint
│   │   ├── middlewares/  - Autenticación, control de acceso a tickets, rate limiting
│   │   ├── models/       - Modelos Sequelize (User, Ticket, TicketHistory)
│   │   ├── routes/       - Definición de rutas de la API
│   │   ├── services/     - Acceso a datos y lógica de negocio
│   │   └── utils/        - Validadores (email, contraseña, username)
│   └── scripts/seed.js   - Carga de usuarios y tickets de prueba
├── frontend/         - Interfaz (React + Vite + TypeScript)
│   └── src/
│       ├── pages/        - Login, Registro, Dashboard, Tickets, Reportes, Configuración...
│       ├── components/   - Componentes reutilizables (notificaciones, adjuntos...)
│       ├── services/     - Clientes HTTP hacia la API
│       └── context/      - Tema claro/oscuro
├── database/         - Esquema SQL y datos iniciales de PostgreSQL
├── docs/             - Documentación adicional (conexión a la base de datos)
└── docker-compose.yml
```

## 🚀 Instalación rápida

### Requisitos previos
- Node.js v18 o superior
- PostgreSQL (local, Docker, o un proveedor en la nube — ver [docs/DATABASE.md](docs/DATABASE.md))
- Git

### 1. Clonar el repositorio
```bash
git clone https://github.com/JuanAmaya14/sistekv2.git
cd sistekv2
```

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env      # completar según docs/DATABASE.md
npm run dev
```
Disponible en `http://localhost:4000`.

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
Disponible en `http://localhost:5173`.

### 4. Datos de prueba (opcional)
```bash
cd backend
node scripts/seed.js
```
Crea 5 usuarios (uno por rol) y 4 tickets de ejemplo. Contraseña de todos: `Password123`. Ver detalle en [database/seeds/README.md](database/seeds/README.md).

## 🔐 Variables de entorno

Configuración completa en [backend/.env.example](backend/.env.example). Las más relevantes:

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión a PostgreSQL. Ver [docs/DATABASE.md](docs/DATABASE.md) |
| `JWT_SECRET` | Obligatoria. El servidor no arranca si falta o es un valor de ejemplo |
| `CORS_ORIGINS` | Orígenes autorizados a llamar a la API (separados por coma) |
| `ALLOWED_EMAIL_DOMAINS` | Restringe el registro a dominios de correo específicos (opcional) |
| `EMAIL_HOST` / `EMAIL_USER` / `EMAIL_PASS` | SMTP para el correo de recuperación de contraseña |

## 🗄️ Base de datos

El proyecto usa PostgreSQL y puede conectarse a una instancia local, a Docker o a un proveedor en la nube (Supabase, Railway, etc.).

**Guía completa paso a paso:** [docs/DATABASE.md](docs/DATABASE.md)

Resumen rápido con Docker:
```bash
docker-compose up -d
```
Esto levanta PostgreSQL, aplica el esquema de [database/schema.sql](database/schema.sql) y conecta el backend automáticamente.

## 👥 Roles y permisos

| Rol | Puede |
|---|---|
| **Cliente** | Crear tickets propios, comentar, reabrir y calificar sus tickets cerrados |
| **Agente** | Ver y actualizar el estado/prioridad de sus tickets asignados, comentar, reabrir |
| **Administrador** | Ver todos los tickets, asignarlos a agentes, eliminarlos, ver usuarios y reportes |

El rol se asigna únicamente por un administrador directamente en la base de datos o mediante gestión interna — **nunca se acepta desde el formulario de registro público**, que siempre crea cuentas de tipo `cliente`.

## 📚 Endpoints de la API

Todas las rutas (salvo login/registro/recuperación) requieren el header `Authorization: Bearer <token>`.

### Usuarios (`/api/users`)
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/register` | Registrar cuenta nueva (rol fijo: cliente) |
| POST | `/login` | Iniciar sesión |
| POST | `/refresh-token` | Renovar el token JWT |
| POST | `/forgot-password` | Solicitar recuperación de contraseña |
| GET | `/verify-reset-token` | Verificar validez de un token de recuperación |
| POST | `/reset-password` | Restablecer contraseña con token |
| GET | `/profile` | Ver el perfil propio |
| PUT | `/profile` | Actualizar el nombre de usuario |
| PUT | `/change-password` | Cambiar contraseña (requiere la actual) |
| GET | `/` | Listar usuarios *(admin)* |
| GET | `/:id` | Ver un usuario (propio o admin) |
| GET | `/agents/list` | Listar agentes *(admin)* |

### Tickets (`/api/tickets`)
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/` | Crear ticket *(cliente)* |
| GET | `/` | Listar tickets propios según el rol |
| GET | `/all` | Listar todos los tickets *(admin)* |
| GET | `/search?q=` | Buscar por título/descripción |
| GET | `/:id` | Ver un ticket (si se tiene acceso) |
| PUT | `/:id/status` | Cambiar estado *(agente asignado o admin)* |
| PUT | `/:id/assign` | Asignar a un agente *(admin)* |
| PUT | `/:id/priority` | Cambiar prioridad *(agente asignado o admin)* |
| GET | `/:id/history` | Historial de cambios |
| POST | `/:id/reopen` | Reabrir un ticket cerrado |
| DELETE | `/:id` | Eliminar ticket *(admin)* |
| GET/POST | `/:id/comments` | Ver/crear comentarios |
| GET/POST | `/:id/rating` | Ver/crear calificación |

### Adjuntos (`/api/attachments`)
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/ticket/:ticketId` | Subir archivo a un ticket |
| GET | `/ticket/:ticketId` | Listar adjuntos de un ticket |
| GET | `/:id/file` | Descargar/previsualizar un adjunto |
| DELETE | `/:id` | Eliminar un adjunto propio *(o admin)* |

### Notificaciones (`/api/notifications`)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Notificaciones del usuario autenticado |
| PUT | `/:id/read` | Marcar como leída |

### Reportes (`/api/reports`)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Reporte en JSON *(admin)* |
| GET | `/download` | Reporte en PDF *(admin)* |

## 🔒 Seguridad

El proyecto implementa, entre otras medidas:
- Contraseñas con bcrypt (12 rondas) y política de complejidad mínima.
- JWT firmado con secreto obligatorio (el servidor no arranca sin uno seguro).
- Verificación de dominio de correo por registros MX y bloqueo de correos desechables.
- Control de acceso por ticket: un usuario solo puede ver/modificar tickets, comentarios, historial y adjuntos a los que tiene acceso por su rol.
- Rate limiting en login, registro, recuperación de contraseña y subida de archivos.
- Cabeceras de seguridad (CSP, HSTS, nosniff) vía Helmet.
- CORS restringido a orígenes explícitamente autorizados.
- Row Level Security activo en todas las tablas de la base de datos (relevante si se usa un proveedor como Supabase que expone una API REST pública sobre la BD — ver [docs/DATABASE.md](docs/DATABASE.md#row-level-security)).

## 📝 Scripts disponibles

### Backend
```bash
npm run dev      # Modo desarrollo (recarga automática)
npm run build    # Compilar TypeScript
npm run start    # Ejecutar versión compilada
```

### Frontend
```bash
npm run dev        # Servidor de desarrollo
npm run build       # Build de producción
npm run preview     # Previsualizar build de producción
npm run typecheck   # Verificar tipos sin compilar
```

## 🐛 Solución de problemas

### Error de conexión a la base de datos
- Verifica que `DATABASE_URL` esté bien formada en `backend/.env`.
- Si usas un proveedor en la nube, revisa [docs/DATABASE.md](docs/DATABASE.md) para la configuración de SSL y del pooler.

### El servidor no arranca / "JWT_SECRET es inseguro"
- Genera un secreto real: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` y ponlo en `JWT_SECRET`.

### Error de CORS en el navegador
- El origen del frontend debe estar en `CORS_ORIGINS` en `backend/.env` (por defecto incluye `http://localhost:5173`).

### Puerto ya en uso
- Backend: cambia `PORT` en `.env`.
- Frontend: Vite usa el 5173 por defecto y salta al siguiente si está ocupado (recuerda añadirlo a `CORS_ORIGINS` si eso pasa).
