import pool from './database';

export const initializeTables = async () => {
  try {
    // Crear tabla de usuarios
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('cliente', 'agente', 'administrador')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear tabla de tickets
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id BIGINT PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        descripcion TEXT,
        tipo VARCHAR(100),
        estado VARCHAR(50) NOT NULL DEFAULT 'Abierto' CHECK (estado IN ('Abierto', 'En progreso', 'Cerrado')),
        prioridad VARCHAR(50),
        usuario VARCHAR(255) NOT NULL,
        agente_asignado VARCHAR(255),
        fecha_asignacion DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Tablas creadas exitosamente');
  } catch (error) {
    console.error('❌ Error al crear tablas:', error);
    throw error;
  }
};
