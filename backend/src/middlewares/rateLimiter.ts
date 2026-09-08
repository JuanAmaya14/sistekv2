import rateLimit from 'express-rate-limit';

const message = (texto: string) => ({ error: texto });

/**
 * Límite estricto para intentos de inicio de sesión: frena la fuerza bruta
 * de contraseñas sin afectar el uso normal (5 intentos fallidos cada 15 min).
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: message('Demasiados intentos de inicio de sesión. Intenta nuevamente en 15 minutos.'),
});

/** Evita el registro masivo automatizado de cuentas. */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: message('Demasiadas cuentas creadas desde esta dirección. Intenta más tarde.'),
});

/** Evita el envío masivo de correos de recuperación (spam / enumeración). */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: message('Demasiadas solicitudes de recuperación. Intenta nuevamente en una hora.'),
});

/** Límite general para el resto de la API. */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: message('Demasiadas solicitudes. Intenta nuevamente en unos minutos.'),
});

/** Límite para la subida de archivos. */
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: message('Demasiadas subidas de archivos. Intenta nuevamente en unos minutos.'),
});
