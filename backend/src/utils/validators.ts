import dns from 'dns';
import { ALLOWED_EMAIL_DOMAINS } from '../config/env';

const resolveMx = dns.promises.resolveMx;

// RFC 5322 simplificado: suficiente para validar direcciones reales sin falsos positivos raros
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/;

// Mínimo 8 caracteres, una minúscula, una mayúscula y un número
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

// Solo letras, números, punto, guion y guion bajo
const USERNAME_REGEX = /^[a-zA-Z0-9._-]{3,50}$/;

// Dominios de correo temporal/desechable más comunes
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'guerrillamail.net', '10minutemail.com',
  'tempmail.com', 'temp-mail.org', 'throwawaymail.com', 'yopmail.com',
  'trashmail.com', 'sharklasers.com', 'getnada.com', 'maildrop.cc',
  'dispostable.com', 'fakeinbox.com', 'mailnesia.com', 'mintemail.com',
]);

export type ValidationResult = { valid: true } | { valid: false; error: string };

export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const getEmailDomain = (email: string): string =>
  normalizeEmail(email).split('@')[1] ?? '';

/**
 * Validación sincrónica del correo: formato, longitud, dominio desechable
 * y lista blanca de dominios institucionales (si está configurada).
 */
export const validateEmail = (email: unknown): ValidationResult => {
  if (typeof email !== 'string' || !email.trim()) {
    return { valid: false, error: 'El correo electrónico es requerido' };
  }

  const normalized = normalizeEmail(email);

  if (normalized.length > 255) {
    return { valid: false, error: 'El correo electrónico es demasiado largo' };
  }

  if (!EMAIL_REGEX.test(normalized)) {
    return { valid: false, error: 'El formato del correo electrónico no es válido' };
  }

  const domain = getEmailDomain(normalized);

  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { valid: false, error: 'No se permiten correos temporales o desechables' };
  }

  if (ALLOWED_EMAIL_DOMAINS.length > 0 && !ALLOWED_EMAIL_DOMAINS.includes(domain)) {
    return {
      valid: false,
      error: `Solo se permiten correos de: ${ALLOWED_EMAIL_DOMAINS.join(', ')}`,
    };
  }

  return { valid: true };
};

/**
 * Verifica que el dominio del correo exista realmente y acepte mensajes
 * (consulta registros MX por DNS). Si el DNS no responde por un problema de
 * red, se deja pasar para no bloquear el registro por una caída externa.
 */
export const verifyEmailDomainExists = async (email: string): Promise<ValidationResult> => {
  const domain = getEmailDomain(email);
  if (!domain) {
    return { valid: false, error: 'El formato del correo electrónico no es válido' };
  }

  try {
    const records = await resolveMx(domain);
    if (!records || records.length === 0) {
      return { valid: false, error: 'El dominio del correo no puede recibir mensajes' };
    }
    return { valid: true };
  } catch (err: any) {
    // Dominio inexistente o sin registros: se rechaza
    if (err?.code === 'ENOTFOUND' || err?.code === 'ENODATA' || err?.code === 'NXDOMAIN') {
      return { valid: false, error: 'El dominio del correo electrónico no existe' };
    }
    // Timeout u otro fallo de red: no bloquear el registro
    return { valid: true };
  }
};

export const validatePasswordStrength = (password: unknown): ValidationResult => {
  if (typeof password !== 'string' || !password) {
    return { valid: false, error: 'La contraseña es requerida' };
  }

  if (password.length > 128) {
    return { valid: false, error: 'La contraseña no puede superar los 128 caracteres' };
  }

  if (!PASSWORD_REGEX.test(password)) {
    return {
      valid: false,
      error: 'La contraseña debe tener al menos 8 caracteres, una letra mayúscula, una minúscula y un número',
    };
  }

  return { valid: true };
};

export const validateUsername = (username: unknown): ValidationResult => {
  if (typeof username !== 'string' || !username.trim()) {
    return { valid: false, error: 'El nombre de usuario es requerido' };
  }

  if (!USERNAME_REGEX.test(username.trim())) {
    return {
      valid: false,
      error: 'El nombre de usuario debe tener entre 3 y 50 caracteres y solo puede contener letras, números, punto, guion y guion bajo',
    };
  }

  return { valid: true };
};

/** Limita el largo de un texto libre y elimina caracteres de control. */
export const sanitizeText = (value: unknown, maxLength: number): string => {
  if (typeof value !== 'string') return '';
  // Elimina caracteres de control (C0 y DEL) sin usar literales de control en el código
  const cleaned = Array.from(value)
    .filter((ch) => {
      const code = ch.codePointAt(0) ?? 0;
      return code > 31 && code !== 127;
    })
    .join('');
  return cleaned.trim().slice(0, maxLength);
};
