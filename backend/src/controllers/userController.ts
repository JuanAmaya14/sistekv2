import { Request, Response } from 'express';
import * as userService from '../services/userService';
import * as passwordResetService from '../services/passwordResetService';
import {
  validateEmail,
  verifyEmailDomainExists,
  validatePasswordStrength,
  validateUsername,
  normalizeEmail,
} from '../utils/validators';

const GENERIC_RESET_MESSAGE =
  'Si el correo está registrado, recibirás un enlace de recuperación en los próximos minutos.';

// Registrar usuario (HU-1)
export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    // El rol NUNCA se toma del cuerpo de la petición: todo registro público
    // crea un cliente. Los agentes y administradores los crea un administrador.
    const role = 'cliente';

    const usernameCheck = validateUsername(username);
    if (!usernameCheck.valid) {
      return res.status(400).json({ error: usernameCheck.error });
    }

    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      return res.status(400).json({ error: emailCheck.error });
    }

    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({ error: passwordCheck.error });
    }

    // Verificación DNS: el dominio del correo debe existir y aceptar mensajes
    const domainCheck = await verifyEmailDomainExists(email);
    if (!domainCheck.valid) {
      return res.status(400).json({ error: domainCheck.error });
    }

    const existingUser = await userService.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    const newUser = await userService.createUser(
      username.trim(),
      normalizeEmail(email),
      password,
      role
    );

    const token = userService.generateToken(newUser.id, newUser.username, newUser.role);

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: newUser,
      token
    });
  } catch (error: any) {
    // Violación de restricción única (username o email duplicado)
    if (error?.code === '23505') {
      return res.status(400).json({ error: 'El usuario o el email ya está registrado' });
    }
    console.error('Error en register:', error.message);
    res.status(500).json({ error: 'Error al registrar usuario' });
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
      // Se ejecuta una comparación señuelo para que el tiempo de respuesta
      // sea igual que con un correo existente (evita enumerar usuarios)
      await userService.fakePasswordCheck();
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
    console.error('Error en login:', error.message);
    res.status(500).json({ error: 'Error en el login' });
  }
};

// Obtener todos los usuarios (solo admin)
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (error: any) {
    console.error('Error en getUsers:', error.message);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

// Obtener usuario por ID (solo el propio usuario o un administrador)
export const getUserById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    if (req.userRole !== 'administrador' && req.userId !== id) {
      return res.status(403).json({ error: 'No tienes acceso a este usuario' });
    }

    const user = await userService.getUserById(id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(user);
  } catch (error: any) {
    console.error('Error en getUserById:', error.message);
    res.status(500).json({ error: 'Error al obtener usuario' });
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
    console.error('Error en getProfile:', error.message);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
};

// Refresh token — el rol se relee de la base de datos, nunca del token anterior,
// para que un cambio o revocación de permisos surta efecto de inmediato.
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const user = await userService.getUserById(req.userId!);
    if (!user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const newToken = userService.generateToken(user.id, user.username, user.role);

    res.json({
      message: 'Token renovado',
      token: newToken
    });
  } catch (error: any) {
    console.error('Error en refreshToken:', error.message);
    res.status(500).json({ error: 'Error al renovar token' });
  }
};

// Cambiar la contraseña del usuario autenticado.
// Exige la contraseña actual: sin esto, un token robado bastaría para
// apropiarse de la cuenta de forma permanente.
export const changePassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'La contraseña actual y la nueva son requeridas',
      });
    }

    const passwordCheck = validatePasswordStrength(newPassword);
    if (!passwordCheck.valid) {
      return res.status(400).json({ error: passwordCheck.error });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        error: 'La nueva contraseña debe ser distinta de la actual',
      });
    }

    const hash = await userService.getPasswordHashById(req.userId!);
    if (!hash) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const isCurrentValid = await userService.validatePassword(currentPassword, hash);
    if (!isCurrentValid) {
      return res.status(401).json({ error: 'La contraseña actual no es correcta' });
    }

    await userService.updatePassword(req.userId!, newPassword);

    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error: any) {
    console.error('Error en changePassword:', error.message);
    res.status(500).json({ error: 'Error al cambiar la contraseña' });
  }
};

// Actualizar el perfil del usuario autenticado (solo el nombre de usuario)
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { username } = req.body;

    const usernameCheck = validateUsername(username);
    if (!usernameCheck.valid) {
      return res.status(400).json({ error: usernameCheck.error });
    }

    const updated = await userService.updateUsername(req.userId!, username);
    if (!updated) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ message: 'Perfil actualizado', user: updated });
  } catch (error: any) {
    if (error?.code === '23505') {
      return res.status(400).json({ error: 'Ese nombre de usuario ya está en uso' });
    }
    console.error('Error en updateProfile:', error.message);
    res.status(500).json({ error: 'Error al actualizar el perfil' });
  }
};

// Obtener agentes (HU-5)
export const getAgents = async (req: Request, res: Response) => {
  try {
    const agents = await userService.getAgents();
    res.json(agents);
  } catch (error: any) {
    console.error('Error en getAgents:', error.message);
    res.status(500).json({ error: 'Error al obtener agentes' });
  }
};

// Solicitar recuperación de contraseña — respuesta genérica para evitar enumeración de correos
export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  const emailCheck = validateEmail(email);
  if (!emailCheck.valid) {
    // Mensaje genérico: no se revela si el formato falló por dominio no permitido
    return res.json({ message: GENERIC_RESET_MESSAGE });
  }

  try {
    const user = await userService.getUserByEmail(email);
    if (user) {
      const rawToken = await passwordResetService.createResetToken(user.id);
      await passwordResetService.sendResetEmail(user.email, rawToken);
    }
    // Siempre devolver el mismo mensaje, exista o no el correo
    res.json({ message: GENERIC_RESET_MESSAGE });
  } catch (error: any) {
    console.error('Error en forgotPassword:', error.message);
    // Seguir devolviendo el mismo mensaje para no exponer si el correo existe
    res.json({ message: GENERIC_RESET_MESSAGE });
  }
};

// Verificar token sin consumirlo (para el frontend al cargar la página)
export const verifyResetToken = async (req: Request, res: Response) => {
  const { token } = req.query;
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ valid: false, reason: 'invalid' });
  }

  try {
    const result = await passwordResetService.validateResetToken(token);
    if (result.valid) {
      res.json({ valid: true });
    } else {
      res.status(400).json({ valid: false, reason: result.reason });
    }
  } catch (error: any) {
    res.status(500).json({ valid: false, reason: 'invalid' });
  }
};

// Restablecer contraseña con token válido
export const resetPassword = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token y nueva contraseña son requeridos' });
  }

  const passwordCheck = validatePasswordStrength(newPassword);
  if (!passwordCheck.valid) {
    return res.status(400).json({ error: passwordCheck.error });
  }

  try {
    const validation = await passwordResetService.validateResetToken(token);
    if (!validation.valid) {
      const messages: Record<string, string> = {
        expired: 'El enlace de recuperación ha expirado. Solicita uno nuevo.',
        used: 'Este enlace ya fue utilizado. Solicita uno nuevo.',
        invalid: 'El enlace no es válido o ya expiró.',
      };
      return res.status(400).json({
        error: messages[validation.reason] ?? 'Enlace inválido',
        reason: validation.reason,
      });
    }

    await passwordResetService.consumeResetToken(token, newPassword);
    res.json({ message: 'Contraseña actualizada exitosamente. Ya puedes iniciar sesión.' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
