import pool from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config/env';
import { normalizeEmail } from '../utils/validators';

const BCRYPT_ROUNDS = 12;

// Hash de referencia para igualar el tiempo de respuesta cuando el usuario no existe
// (evita distinguir "correo inexistente" de "contraseña incorrecta" por el tiempo).
const DUMMY_HASH = '$2a$12$C6UzMDM.H6dfI/f/IKcEe.HTgL7Tz1sYtvrjT2vsvGSQhKvUJ1jJa';

// Obtener todos los usuarios
export const getAllUsers = async () => {
  const result = await pool.query('SELECT id, username, email, role FROM users');
  return result.rows;
};

// Obtener usuario por email (siempre normalizado a minúsculas)
export const getUserByEmail = async (email: string) => {
  const result = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [
    normalizeEmail(email),
  ]);
  return result.rows[0];
};

// Obtener usuario por username (mantenido para compatibilidad interna)
export const getUserByUsername = async (username: string) => {
  const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  return result.rows[0];
};

// Obtener usuario por ID
export const getUserById = async (id: number) => {
  const result = await pool.query('SELECT id, username, email, role FROM users WHERE id = $1', [id]);
  return result.rows[0];
};

// Crear usuario (con hash de contraseña)
export const createUser = async (username: string, email: string, password: string, role: string = 'cliente') => {
  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const result = await pool.query(
    'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
    [username.trim(), normalizeEmail(email), hashedPassword, role]
  );
  return result.rows[0];
};

// Validar contraseña
export const validatePassword = async (inputPassword: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(inputPassword, hashedPassword);
};

// Comparación señuelo: consume el mismo tiempo que una verificación real
export const fakePasswordCheck = async (): Promise<void> => {
  await bcrypt.compare('dummy-password', DUMMY_HASH);
};

// Obtener el hash de contraseña de un usuario (uso interno, nunca se expone por la API)
export const getPasswordHashById = async (id: number): Promise<string | null> => {
  const result = await pool.query('SELECT password FROM users WHERE id = $1', [id]);
  return result.rows[0]?.password ?? null;
};

// Actualizar la contraseña de un usuario ya autenticado
export const updatePassword = async (id: number, newPassword: string): Promise<void> => {
  const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, id]);
};

// Actualizar el nombre de usuario (el correo y el rol no se editan desde el perfil:
// el correo identifica la cuenta en la recuperación y el rol lo asigna un administrador)
export const updateUsername = async (id: number, username: string) => {
  const result = await pool.query(
    'UPDATE users SET username = $1 WHERE id = $2 RETURNING id, username, email, role',
    [username.trim(), id]
  );
  return result.rows[0];
};

// Generar JWT Token
export const generateToken = (userId: number, username: string, role: string): string => {
  return jwt.sign(
    { userId, username, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN, algorithm: 'HS256' } as jwt.SignOptions
  );
};

// Obtener agentes
export const getAgents = async () => {
  const result = await pool.query("SELECT id, username, email FROM users WHERE role = 'agente'");
  return result.rows;
};

// Obtener administradores
export const getAdmins = async () => {
  const result = await pool.query("SELECT id, username, email FROM users WHERE role = 'administrador'");
  return result.rows;
};
