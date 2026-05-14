// Punto de entrada del backend

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/database'; // Importar conexión a DB
import userRoutes from './routes/userRoutes';
import ticketRoutes from './routes/ticketRoutes';
import notificationRoutes from './routes/notificationRoutes';
import { createNotificationsTable } from './services/notificationService';
import { migratePrioritiesToNewValues, createTicketHistoriaTable } from './services/ticketService';

// Cargar variables de entorno
dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// Middlewares
app.use(express.json()); // Para parsear JSON
app.use(cors()); // Habilitar CORS

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Ticket System Backend');
});

// Ruta de prueba para DB
app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ message: 'DB connected', time: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rutas de la API
app.use('/api/users', userRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/notifications', notificationRoutes);

createNotificationsTable()
  .then(() => console.log('✅ Tabla notifications lista'))
  .catch((err) => console.error('❌ Error creando tabla notifications:', err));

createTicketHistoriaTable()
  .then(() => console.log('✅ Tabla ticket_historia lista'))
  .catch((err) => console.error('❌ Error creando tabla ticket_historia:', err));

migratePrioritiesToNewValues()
  .then(() => console.log('✅ Prioridades migradas a Alta/Media/Baja'))
  .catch((err) => console.error('❌ Error migrando prioridades:', err));

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? 'Configurado' : 'No configurado (usando default)'}`);
});
