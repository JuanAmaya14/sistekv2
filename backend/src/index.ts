// Punto de entrada del backend

import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Valida las variables de entorno críticas antes que nada (lanza si JWT_SECRET falta o es inseguro)
import { ALLOWED_ORIGINS, IS_PRODUCTION } from './config/env';

// Instancia de Sequelize con los modelos y relaciones cargados
import { sequelize } from './models/models';

import userRoutes from './routes/userRoutes';
import ticketRoutes from './routes/ticketRoutes';
import notificationRoutes from './routes/notificationRoutes';
import reportRoutes from './routes/reportRoutes';
import attachmentRoutes from './routes/attachmentRoutes';

import { apiLimiter } from './middlewares/rateLimiter';
import { createTicketHistoriaTable } from './services/ticketService';
import { createCommentsTable } from './services/commentService';
import { createNotificationsTable } from './services/notificationService';
import { createAttachmentsTable } from './services/attachmentService';
import { createRatingsTable } from './services/ratingService';
import { createPasswordResetTable } from './services/passwordResetService';
import { normalizeTicketPriorities, enableRowLevelSecurity } from './services/migrations';

const app = express();
const port = process.env.PORT || 4000;

// Necesario para que el rate limiter identifique bien la IP detrás de un proxy
// (Railway, Render, Nginx). Se limita a 1 salto para que no se pueda falsear.
app.set('trust proxy', 1);

// Oculta la cabecera X-Powered-By y agrega cabeceras de seguridad
app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginResourcePolicy: { policy: 'same-site' },
  referrerPolicy: { policy: 'no-referrer' },
}));

// CORS restringido a los orígenes declarados en CORS_ORIGINS
app.use(cors({
  origin: (origin, callback) => {
    // Permite herramientas sin origen (curl, health checks) y los orígenes de la lista
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origen no permitido por CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Límite de tamaño del cuerpo: evita agotar memoria con peticiones enormes
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));

// Los adjuntos NO se sirven como carpeta estática pública: se entregan
// por /api/attachments/:id/file, que verifica permisos sobre el ticket.

// Ruta principal de prueba
app.get('/', (req, res) => {
  res.send('Ticket System Backend');
});

// Rutas de la API (con límite general de peticiones)
app.use('/api', apiLimiter);
app.use('/api/users', userRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/attachments', attachmentRoutes);

// Manejador de errores final: registra el detalle en el servidor y
// devuelve un mensaje genérico para no filtrar información interna.
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err?.message === 'Origen no permitido por CORS') {
    return res.status(403).json({ error: 'Origen no permitido' });
  }
  console.error('Error no controlado:', err?.message ?? err);
  if (res.headersSent) return;
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Inicialización asíncrona de la BD y del servidor HTTP
const startServer = async () => {
  try {
    // 1. Probar conexión
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida con Sequelize');

    // 1.5. Normalizar prioridades ANTES de sincronizar: si quedan valores del
    // esquema antiguo, la conversión de tipo de Sequelize fallaría.
    await normalizeTicketPriorities();

    // 2. Sincronizar modelos solo fuera de producción.
    // En producción un `alter` automático puede modificar el esquema de forma
    // inesperada; ahí los cambios deben aplicarse con migraciones revisadas.
    if (!IS_PRODUCTION) {
      await sequelize.sync({ alter: true });
      console.log('✅ Modelos de Sequelize sincronizados correctamente en PostgreSQL');
    } else {
      console.log('ℹ️ Producción: se omite la sincronización automática de esquema');
    }

    // 3. Crear las tablas que se manejan con SQL directo (no tienen modelo Sequelize).
    // Son idempotentes: usan CREATE TABLE IF NOT EXISTS.
    await createTicketHistoriaTable();
    await createCommentsTable();
    await createNotificationsTable();
    await createAttachmentsTable();
    await createRatingsTable();
    await createPasswordResetTable();
    console.log('✅ Tablas auxiliares verificadas');

    // 3.5. Cerrar el acceso directo por la API REST de Supabase (ver migrations.ts).
    // Se ejecuta después de crear las tablas para cubrir también las nuevas.
    await enableRowLevelSecurity();
    console.log('✅ Row Level Security activo en todas las tablas');

    // 4. La migración de prioridades ya se hace en normalizeTicketPriorities (paso 1.5).
    // migratePrioritiesToNewValues() quedó obsoleta: añadía un CHECK redundante
    // cuyos literales apuntan al enum y rompía conversiones posteriores del tipo.

    // 5. Iniciar servidor Express
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