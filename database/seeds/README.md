# Seeds - Datos de Prueba

Para cargar datos de prueba en la base de datos, ejecuta el siguiente comando:

```bash
psql -U postgres -d sistek -f database/seeds/initial_data.sql
```

## Datos incluidos

### Usuarios
- **cliente1** (cliente) - password123
- **agente1** (agente) - password123
- **agente2** (agente) - password123
- **admin1** (administrador) - password123

### Tickets de ejemplo
Varios tickets con diferentes estados y asignaciones para hacer pruebas.

## Contraseña de prueba
Todas las contraseñas de prueba son: `password123`

**⚠️ NUNCA usar en producción**


Coloca aquí los datos iniciales para la base de datos.
