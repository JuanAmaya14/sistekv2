# Ticket System

Estructura inicial del proyecto para un sistema de tickets.

## Organización

- `/ticket-system/frontend` - Interfaz de usuario
- `/ticket-system/backend` - Lógica del servidor
- `/ticket-system/database` - Esquema y datos iniciales

## Cómo usar

Coloca los archivos y código específicos en cada carpeta según la arquitectura.


# Tecnologías del proyecto de sistema de tickets

Frontend:
- TypeScript
- React
- Tailwind CSS
- CSS
- Vite

Backend:
- Node.js
- Express.js
- TypeScript

Base de datos:
- PostgreSQL

Autenticación:
- JWT (JSON Web Tokens)

Herramientas de desarrollo:
- Visual Studio Code
- npm (Node Package Manager)
- Git
- GitHub

Pruebas:
- Postman

## Configuración de Desarrollo

### Base de Datos
Para configurar la base de datos PostgreSQL localmente usando Docker:

1. Asegúrate de tener Docker instalado (descarga Docker Desktop desde https://www.docker.com/).
2. En la raíz del proyecto, ejecuta: `docker-compose up -d`
3. La base de datos se creará automáticamente con el esquema definido en `database/schema.sql`.
4. Conecta usando: Host: `localhost`, Puerto: `5432`, Usuario: `dev_user`, Contraseña: `dev_password`, DB: `ticket_system_dev`.

Para detener: `docker-compose down`.

Si prefieres PostgreSQL nativo:
1. Instala PostgreSQL (desde https://www.postgresql.org/).
2. Crea una base de datos: `createdb ticket_system_dev`.
3. Ejecuta el esquema: `psql -d ticket_system_dev -f database/schema.sql`.