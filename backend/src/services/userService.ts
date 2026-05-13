import pool from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Obtener todos los usuarios
export const getAllUsers = async () => {
  const result = await pool.query('SELECT id, username, email, role FROM users');
  return result.rows;
};

// Obtener usuario por email
export const getUserByEmail = async (email: string) => {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
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
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
      [username, email, hashedPassword, role]
    );
    return result.rows[0];
  } catch (error: any) {
    throw error;
  }
};

// Validar contraseña
export const validatePassword = async (inputPassword: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(inputPassword, hashedPassword);
};

// Generar JWT Token
export const generateToken = (userId: number, username: string, role: string): string => {
  const token = jwt.sign(
    { userId, username, role },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );
  return token;
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
