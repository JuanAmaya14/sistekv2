import { Request, Response } from 'express';
import * as commentService from '../services/commentService';
import { checkTicketAccess, parseId } from '../middlewares/ticketAccess';
import { sanitizeText } from '../utils/validators';

const MAX_COMMENT = 2000;

export const getComments = async (req: Request, res: Response) => {
  try {
    const ticketId = parseId(req.params.id);
    if (ticketId === null) {
      return res.status(400).json({ error: 'ID de ticket inválido' });
    }

    // Solo quien tiene acceso al ticket puede leer sus comentarios
    const access = await checkTicketAccess(ticketId, req.userId!, req.userRole!);
    if (!access.allowed) {
      return res.status(access.status).json({ error: access.error });
    }

    const comments = await commentService.getCommentsByTicket(ticketId);
    res.json(comments);
  } catch (error: any) {
    console.error('Error al obtener comentarios:', error.message);
    res.status(500).json({ error: 'Error al obtener comentarios' });
  }
};

export const createComment = async (req: Request, res: Response) => {
  try {
    const ticketId = parseId(req.params.id);
    if (ticketId === null) {
      return res.status(400).json({ error: 'ID de ticket inválido' });
    }

    const content = sanitizeText(req.body.content, MAX_COMMENT);
    if (!content) {
      return res.status(400).json({ error: 'El contenido del comentario es requerido' });
    }

    // Solo quien tiene acceso al ticket puede comentar en él
    const access = await checkTicketAccess(ticketId, req.userId!, req.userRole!);
    if (!access.allowed) {
      return res.status(access.status).json({ error: access.error });
    }

    const comment = await commentService.createComment(ticketId, req.userId!, content);
    res.status(201).json(comment);
  } catch (error: any) {
    console.error('Error al crear comentario:', error.message);
    res.status(500).json({ error: 'Error al crear comentario' });
  }
};
