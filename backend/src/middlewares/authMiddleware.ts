import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env';

declare global {
  namespace Express {
    interface Request {
      userId?: number;
      userRole?: string;
      username?: string;
    }
  }
}

const VALID_ROLES = new Set(['cliente', 'agente', 'administrador']);

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    // Solo se acepta el esquema Bearer, con token presente
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No autorizado - Token no proporcionado' });
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      return res.status(401).json({ error: 'No autorizado - Token no proporcionado' });
    }

    // algorithms fijo: evita ataques de confusión de algoritmo (alg: none / HS vs RS)
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as {
      userId: number;
      username: string;
      role: string;
    };

    // El rol viene del token; se valida que sea uno de los conocidos
    if (!decoded.userId || !VALID_ROLES.has(decoded.role)) {
      return res.status(401).json({ error: 'Token inválido' });
    }

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
