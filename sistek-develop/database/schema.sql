-- Esquema de la base de datos para Sistema de Tickets

-- Tabla de usuarios
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('cliente', 'agente', 'administrador')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de tickets
CREATE TABLE tickets (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(50) NOT NULL CHECK (priority IN ('bajo', 'medio', 'alto', 'urgente')),
  type VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Abierto' CHECK (status IN ('Abierto', 'En progreso', 'Cerrado')),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_agent_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  assigned_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de historial de cambios de tickets
CREATE TABLE ticket_history (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  changed_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  change_type VARCHAR(50) NOT NULL CHECK (change_type IN ('status_change', 'agent_assignment')),
  changed_at TIMESTAMP DEFAULT NOW()
);