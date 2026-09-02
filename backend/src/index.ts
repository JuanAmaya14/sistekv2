// Punto de entrada del backend

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Instancia de Sequelize con los modelos y relaciones cargados
import { sequelize } from './models/models';

import userRoutes from './routes/userRoutes';
import ticketRoutes from './routes/ticketRoutes';
import notificationRoutes from './routes/notificationRoutes';
import reportRoutes from './routes/reportRoutes';
import attachmentRoutes from './routes/attachmentRoutes';

import { migratePrioritiesToNewValues } from './services/ticketService';

// Cargar variables de entorno
dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// Middlewares
app.use(express.json());
app.use(cors());

// Servir archivos adjuntos públicamente desde /uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Ruta principal de prueba
app.get('/', (req, res) => {
  res.send('Ticket System Backend');
});

// Ruta de prueba para verificar estado de la BD con Sequelize
app.get('/test-db', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ message: 'DB connected successfully with Sequelize' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Rutas de la API
app.use('/api/users', userRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/attachments', attachmentRoutes);

// Inicialización asíncrona de la BD y del servidor HTTP
const startServer = async () => {
  try {
    // 1. Probar conexión
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida con Sequelize');

    // 2. Sincronizar modelos en PostgreSQL (alter: true crea o actualiza las tablas sin borrar datos)
    await sequelize.sync({ alter: true });
    console.log('✅ Modelos de Sequelize sincronizados correctamente en PostgreSQL');

    // 3. Ejecutar migración de datos de forma segura
    try {
      await migratePrioritiesToNewValues();
      console.log('✅ Prioridades migradas a Alta/Media/Baja');
    } catch (migError) {
      console.warn('⚠️ Omitiendo migración de prioridades:', (migError as Error).message);
    }

    // 4. Iniciar servidor Express
    app.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port}`);
      console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? 'Configurado' : 'No configurado (usando default)'}`);
    });

  } catch (error) {
    console.error('❌ Error fatal al conectar o sincronizar la base de datos:', error);
    process.exit(1);
  }
};

startServer();