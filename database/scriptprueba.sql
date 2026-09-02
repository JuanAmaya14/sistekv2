-- Esquema de la base de datos para Sistema de Tickets
-- 1. Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('cliente', 'agente', 'administrador')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Tabla de tickets
CREATE TABLE IF NOT EXISTS tickets (
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

-- 3. Tabla de historial de cambios de tickets
CREATE TABLE IF NOT EXISTS ticket_history (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  changed_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  change_type VARCHAR(50) NOT NULL CHECK (change_type IN ('status_change', 'agent_assignment')),
  changed_at TIMESTAMP DEFAULT NOW()
);


-- Datos de prueba para el sistema de tickets

-- Insertar usuarios de prueba (se agregaron correos para cumplir NOT NULL)
INSERT INTO users (username, email, password, role) VALUES
('cliente1', 'cliente1@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/KFm', 'cliente'),
('cliente2', 'cliente2@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/KFm', 'cliente'),
('agente1', 'agente1@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/KFm', 'agente'),
('agente2', 'agente2@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/KFm', 'agente'),
('admin1', 'admin1@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/KFm', 'administrador');

-- Insertar tickets de prueba
INSERT INTO tickets (title, description, priority, type, status, user_id, assigned_agent_id, assigned_date) VALUES
('Problema de acceso a email', 'No puedo acceder a mi email corporativo', 'alto', 'Acceso', 'Abierto', 1, NULL, NULL),
('Instalación de software', 'Necesito instalar Office en mi computadora', 'medio', 'Software', 'En progreso', 1, 3, NOW()),
('Internet lento', 'La conexión a internet está muy lenta', 'bajo', 'Red', 'Cerrado', 2, 4, NOW()),
('Monitor no funciona', 'Mi segundo monitor dejó de funcionar', 'urgente', 'Hardware', 'En progreso', 2, 3, NOW());

-- Insertar historial de cambios para los tickets
INSERT INTO ticket_history (ticket_id, changed_by, old_status, new_status, change_type) VALUES
(2, 3, 'Abierto', 'En progreso', 'status_change'),
(2, 3, NULL, NULL, 'agent_assignment'),
(3, 4, 'En progreso', 'Cerrado', 'status_change'),
(4, 3, 'Abierto', 'En progreso', 'status_change'),
(4, 3, NULL, NULL, 'agent_assignment');