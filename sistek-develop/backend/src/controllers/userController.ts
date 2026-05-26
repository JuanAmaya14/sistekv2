import { Request, Response } from 'express';
import * as userService from '../services/userService';

// Registrar usuario (HU-1)
export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Usuario, email y password son requeridos' });
    }

    const existingUser = await userService.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    const newUser = await userService.createUser(username, email, password, role || 'cliente');

    const token = userService.generateToken(newUser.id, newUser.username, newUser.role);

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: newUser,
      token
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al registrar usuario: ' + error.message });
  }
};

// Login (HU-1)
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y password son requeridos' });
    }

    const user = await userService.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const isPasswordValid = await userService.validatePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const token = userService.generateToken(user.id, user.username, user.role);

    res.json({
      message: 'Login exitoso',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Error en el login: ' + error.message });
  }
};

// Obtener todos los usuarios (solo admin)
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: 'Error al obtener usuarios: ' + error.message });
  }
};

// Obtener usuario por ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(parseInt(id));
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: 'Error al obtener usuario: ' + error.message });
  }
};

// Obtener perfil del usuario autenticado
export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = await userService.getUserById(req.userId!);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: 'Error al obtener perfil: ' + error.message });
  }
};

// Refresh token
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Generar nuevo token
    const newToken = userService.generateToken(user.userId, user.username, user.role);

    res.json({
      message: 'Token renovado',
      token: newToken
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al renovar token: ' + error.message });
  }
};

// Obtener agentes (HU-5)
export const getAgents = async (req: Request, res: Response) => {
  try {
    const agents = await userService.getAgents();
    res.json(agents);
  } catch (error: any) {
    res.status(500).json({ error: 'Error al obtener agentes: ' + error.message });
  }
};
