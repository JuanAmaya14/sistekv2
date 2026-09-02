import { Sequelize } from 'sequelize';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  console.warn('⚠️ DATABASE_URL no está configurada. Por favor, revisa tu archivo .env');
}

// 🌟 DETECCIÓN INTELIGENTE DE ENTORNO DOCKER
// Si corre dentro de un contenedor, el host debe ser 'postgres_db'. Si corre fuera, es 'localhost'.
const isDocker = process.env.DATABASE_URL?.includes('postgres_db');

let databaseUrl = process.env.DATABASE_URL || '';

// Si por alguna razón dotenv leyó 'localhost' pero Docker inyectó variables, forzamos la ruta interna
if (process.env.NODE_ENV === 'development' && !isDocker) {
  // Esta línea reescribe dinámicamente localhost por postgres_db únicamente si detecta que Docker está pidiendo conexión
  databaseUrl = databaseUrl.replace('localhost', 'postgres_db');
}

const isRemoteDb = databaseUrl.includes('railway') ||
  databaseUrl.includes('rlwy.net') ||
  process.env.NODE_ENV === 'production';

// 1. Instancia de Sequelize para los nuevos modelos usando la URL procesada
export const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialectOptions: {
    ssl: isRemoteDb ? { require: true, rejectUnauthorized: false } : false
  }
});

// 2. Mantener pool nativo de 'pg'
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: isRemoteDb ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Error no controlado en el pool:', err);
});

export default pool;
