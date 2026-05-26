-- Datos de prueba para el sistema de tickets

-- Insertar usuarios de prueba (las contraseñas están hasheadas con bcrypt)
-- password123 -> $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/KFm
INSERT INTO users (username, password, role) VALUES
('cliente1', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/KFm', 'cliente'),
('cliente2', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/KFm', 'cliente'),
('agente1', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/KFm', 'agente'),
('agente2', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/KFm', 'agente'),
('admin1', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/KFm', 'administrador');

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
