import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      userId?: number;
      userRole?: string;
      username?: string;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No autorizado - Token no proporcionado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
      userId: number;
      username: string;
      role: string;
    };

    req.userId = decoded.userId;
    req.username = decoded.username;
    req.userRole = decoded.role;

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// Middleware para validar que el usuario sea administrador
export const adminOnly = (req: Request, res: Response, next: NextFunction) => {
  if (req.userRole !== 'administrador') {
    return res.status(403).json({ error: 'Solo administradores pueden realizar esta acción' });
  }
  next();
};

// Middleware para validar que el usuario sea cliente
export const clientOnly = (req: Request, res: Response, next: NextFunction) => {
  if (req.userRole !== 'cliente') {
    return res.status(403).json({ error: 'Solo clientes pueden realizar esta acción' });
  }
  next();
};

// Middleware para validar que el usuario sea agente
export const agentOnly = (req: Request, res: Response, next: NextFunction) => {
  if (req.userRole !== 'agente' && req.userRole !== 'administrador') {
    return res.status(403).json({ error: 'Solo agentes pueden realizar esta acción' });
  }
  next();
};
