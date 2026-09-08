import { Router } from 'express';
import * as notificationController from '../controllers/notificationController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.use(authMiddleware);

// Obtener notificaciones del usuario autenticado
router.get('/', notificationController.getMyNotifications);

// Marcar notificación como leída
router.put('/:id/read', notificationController.markNotificationAsRead);

export default router;
