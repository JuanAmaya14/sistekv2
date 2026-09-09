import { Router } from 'express';
import * as userController from '../controllers/userController';
import { authMiddleware, adminOnly } from '../middlewares/authMiddleware';
import {
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
} from '../middlewares/rateLimiter';

const router = Router();

// Rutas de autenticación (públicas, con límite de intentos)
router.post('/register', registerLimiter, userController.register);
router.post('/login', loginLimiter, userController.login);
router.post('/refresh-token', authMiddleware, userController.refreshToken);

// Recuperación de contraseña (públicas, con límite de intentos)
router.post('/forgot-password', passwordResetLimiter, userController.forgotPassword);
router.get('/verify-reset-token', userController.verifyResetToken);
router.post('/reset-password', passwordResetLimiter, userController.resetPassword);

// Rutas protegidas
router.get('/profile', authMiddleware, userController.getProfile);
router.put('/profile', authMiddleware, userController.updateProfile);

// Cambio de contraseña desde configuración (requiere la contraseña actual).
// Se limita igual que la recuperación para frenar el ensayo de contraseñas.
router.put('/change-password', authMiddleware, passwordResetLimiter, userController.changePassword);
router.get('/', authMiddleware, adminOnly, userController.getUsers);
router.get('/:id', authMiddleware, userController.getUserById);

// Rutas de agentes (HU-5)
router.get('/agents/list', authMiddleware, adminOnly, userController.getAgents);

export default router;
