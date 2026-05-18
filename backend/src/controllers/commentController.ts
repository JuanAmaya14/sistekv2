import { Request, Response } from 'express';
import * as commentService from '../services/commentService';
import * as ticketService from '../services/ticketService';

export const getComments = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ticket = await ticketService.getTicketById(parseInt(id));
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }
    const comments = await commentService.getCommentsByTicket(parseInt(id));
    res.json(comments);
  } catch (error: any) {
    res.status(500).json({ error: 'Error al obtener comentarios: ' + error.message });
  }
};

export const createComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.userId!;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'El contenido del comentario es requerido' });
    }

    const ticket = await ticketService.getTicketById(parseInt(id));
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    const comment = await commentService.createComment(parseInt(id), userId, content);
    res.status(201).json(comment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
