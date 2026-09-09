require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const databaseUrl = process.env.DATABASE_URL || '';
const isRemoteDb = databaseUrl.includes('railway') ||
  databaseUrl.includes('rlwy.net') ||
  databaseUrl.includes('supabase.co') ||
  databaseUrl.includes('pooler.supabase.com') ||
  process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: isRemoteDb ? { rejectUnauthorized: false } : false
});

// Cumple la política de contraseñas del sistema:
// mínimo 8 caracteres, una mayúscula, una minúscula y un número.
const SEED_PASSWORD = 'Password123';

async function main() {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 12);

  const users = [
    ['cliente1', 'cliente1@sistek.com', 'cliente'],
    ['cliente2', 'cliente2@sistek.com', 'cliente'],
    ['agente1', 'agente1@sistek.com', 'agente'],
    ['agente2', 'agente2@sistek.com', 'agente'],
    ['admin1', 'admin1@sistek.com', 'administrador']
  ];

  console.log('Insertando usuarios...');
  const userIds = {};
  for (const [username, email, role] of users) {
    // El conflicto se resuelve por email: es el identificador de login y no
    // cambia, mientras que el username sí puede editarse desde Configuración.
    const result = await pool.query(
      `INSERT INTO users (username, email, password, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE
         SET username = EXCLUDED.username,
             password = EXCLUDED.password,
             role = EXCLUDED.role
       RETURNING id, username`,
      [username, email, passwordHash, role]
    );
    userIds[username] = result.rows[0].id;
    console.log(`  - ${username} (id ${result.rows[0].id})`);
  }

  // Los tickets solo se insertan una vez: volver a ejecutar el seed
  // actualiza los usuarios pero no duplica los datos de ejemplo.
  const existing = await pool.query('SELECT COUNT(*)::int AS n FROM tickets');
  if (existing.rows[0].n > 0) {
    console.log(`Ya existen ${existing.rows[0].n} tickets, se omite la carga de ejemplos.`);
    console.log(`Listo. Contraseña de todos los usuarios de prueba: ${SEED_PASSWORD}`);
    await pool.end();
    return;
  }

  console.log('Insertando tickets...');
  const tickets = [
    ['Problema de acceso a email', 'No puedo acceder a mi email corporativo', 'alto', 'Acceso', 'Abierto', userIds.cliente1, null, null],
    ['Instalación de software', 'Necesito instalar Office en mi computadora', 'medio', 'Software', 'En progreso', userIds.cliente1, userIds.agente1, new Date()],
    ['Internet lento', 'La conexión a internet está muy lenta', 'bajo', 'Red', 'Cerrado', userIds.cliente2, userIds.agente2, new Date()],
    ['Monitor no funciona', 'Mi segundo monitor dejó de funcionar', 'urgente', 'Hardware', 'En progreso', userIds.cliente2, userIds.agente1, new Date()]
  ];

  const ticketIds = [];
  for (const t of tickets) {
    const result = await pool.query(
      `INSERT INTO tickets (title, description, priority, type, status, user_id, assigned_agent_id, assigned_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, title`,
      t
    );
    ticketIds.push(result.rows[0].id);
    console.log(`  - ${result.rows[0].title} (id ${result.rows[0].id})`);
  }

  console.log('Insertando historial de tickets...');
  const history = [
    [ticketIds[1], userIds.agente1, 'Abierto', 'En progreso', 'status_change'],
    [ticketIds[1], userIds.agente1, null, null, 'agent_assignment'],
    [ticketIds[2], userIds.agente2, 'En progreso', 'Cerrado', 'status_change'],
    [ticketIds[3], userIds.agente1, 'Abierto', 'En progreso', 'status_change'],
    [ticketIds[3], userIds.agente1, null, null, 'agent_assignment']
  ];

  for (const h of history) {
    await pool.query(
      `INSERT INTO ticket_history (ticket_id, changed_by, old_status, new_status, change_type)
       VALUES ($1, $2, $3, $4, $5)`,
      h
    );
  }

  console.log(`Listo. Contraseña de todos los usuarios de prueba: ${SEED_PASSWORD}`);
  await pool.end();
}

main().catch((err) => {
  console.error('Error al insertar datos de prueba:', err);
  process.exit(1);
});
