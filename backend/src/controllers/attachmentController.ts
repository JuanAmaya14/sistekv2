import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import pool from '../config/database';
import * as attachmentService from '../services/attachmentService';
import { UPLOAD_DIR } from '../middleware/upload';
import { checkTicketAccess, parseId } from '../middlewares/ticketAccess';

/** Deja el nombre de archivo apto para una cabecera HTTP (sin comillas ni saltos de línea). */
const safeHeaderFilename = (name: string): string =>
  name.replace(/[^A-Za-z0-9._ -]/g, '_').slice(0, 100) || 'archivo';

// POST /api/attachments/ticket/:ticketId
export const uploadAttachment = async (req: Request, res: Response) => {
  const cleanupFile = () => {
    if (req.file) fs.unlink(req.file.path, () => {});
  };

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo.' });
    }

    const ticketId = parseId(req.params.ticketId);
    if (ticketId === null) {
      cleanupFile();
      return res.status(400).json({ error: 'ID de ticket inválido' });
    }

    // Solo se puede adjuntar a un ticket al que el usuario tiene acceso
    const access = await checkTicketAccess(ticketId, req.userId!, req.userRole!);
    if (!access.allowed) {
      cleanupFile();
      return res.status(access.status).json({ error: access.error });
    }

    const attachment = await attachmentService.createAttachment(
      ticketId,
      req.userId!,
      req.file.filename,
      req.file.originalname,
      req.file.mimetype,
      req.file.size
    );

    // Registrar en historial
    await pool.query(
      `INSERT INTO ticket_historia
         (ticket_id, usuario_accion_id, tipo_accion, valor_anterior, valor_nuevo)
       VALUES ($1, $2, 'attachment_upload', NULL, $3)`,
      [ticketId, req.userId!, req.file.originalname]
    );

    res.status(201).json(attachment);
  } catch (error: any) {
    cleanupFile();
    console.error('Error al subir archivo:', error.message);
    res.status(500).json({ error: 'Error al subir archivo' });
  }
};

// GET /api/attachments/ticket/:ticketId
export const getAttachments = async (req: Request, res: Response) => {
  try {
    const ticketId = parseId(req.params.ticketId);
    if (ticketId === null) {
      return res.status(400).json({ error: 'ID de ticket inválido' });
    }

    const access = await checkTicketAccess(ticketId, req.userId!, req.userRole!);
    if (!access.allowed) {
      return res.status(access.status).json({ error: access.error });
    }

    const attachments = await attachmentService.getAttachmentsByTicket(ticketId);
    res.json(attachments);
  } catch (error: any) {
    console.error('Error al obtener adjuntos:', error.message);
    res.status(500).json({ error: 'Error al obtener adjuntos' });
  }
};

// GET /api/attachments/:id/file
export const serveFile = async (req: Request, res: Response) => {
  try {
    const attachmentId = parseId(req.params.id);
    if (attachmentId === null) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const attachment = await attachmentService.getAttachmentById(attachmentId);
    if (!attachment) return res.status(404).json({ error: 'Adjunto no encontrado.' });

    // El acceso al archivo depende del acceso al ticket al que pertenece
    const access = await checkTicketAccess(attachment.ticket_id, req.userId!, req.userRole!);
    if (!access.allowed) {
      return res.status(access.status).json({ error: 'Adjunto no encontrado.' });
    }

    // El nombre guardado se genera en el servidor, pero se normaliza igual
    // para descartar cualquier intento de salir del directorio de subidas.
    const safeName = path.basename(attachment.filename);
    const filePath = path.join(UPLOAD_DIR, safeName);
    if (!filePath.startsWith(UPLOAD_DIR + path.sep) || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Archivo no encontrado en el servidor.' });
    }

    // attachment: el navegador nunca ejecuta el archivo en el origen de la API.
    // nosniff impide que adivine un tipo distinto al declarado.
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${safeHeaderFilename(attachment.original_name)}"`
    );
    res.setHeader('Content-Type', attachment.mime_type);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.sendFile(filePath);
  } catch (error: any) {
    console.error('Error al servir archivo:', error.message);
    res.status(500).json({ error: 'Error al servir archivo' });
  }
};

// DELETE /api/attachments/:id
export const deleteAttachment = async (req: Request, res: Response) => {
  try {
    const attachmentId = parseId(req.params.id);
    if (attachmentId === null) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const userId = req.userId!;
    const userRole = req.userRole!;

    const attachment = await attachmentService.getAttachmentById(attachmentId);
    if (!attachment) return res.status(404).json({ error: 'Adjunto no encontrado.' });

    const access = await checkTicketAccess(attachment.ticket_id, userId, userRole);
    if (!access.allowed) {
      return res.status(access.status).json({ error: 'Adjunto no encontrado.' });
    }

    if (attachment.user_id !== userId && userRole !== 'administrador') {
      return res.status(403).json({ error: 'Solo puedes eliminar tus propios adjuntos.' });
    }

    await attachmentService.deleteAttachmentRecord(attachmentId);

    const safeName = path.basename(attachment.filename);
    const filePath = path.join(UPLOAD_DIR, safeName);
    if (filePath.startsWith(UPLOAD_DIR + path.sep) && fs.existsSync(filePath)) {
      fs.unlink(filePath, () => {});
    }

    // Registrar en historial
    await pool.query(
      `INSERT INTO ticket_historia
         (ticket_id, usuario_accion_id, tipo_accion, valor_anterior, valor_nuevo)
       VALUES ($1, $2, 'attachment_delete', $3, NULL)`,
      [attachment.ticket_id, userId, attachment.original_name]
    );

    res.json({ message: 'Adjunto eliminado.' });
  } catch (error: any) {
    console.error('Error al eliminar adjunto:', error.message);
    res.status(500).json({ error: 'Error al eliminar adjunto' });
  }
};
