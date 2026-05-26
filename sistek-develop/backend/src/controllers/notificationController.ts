import { Request, Response } from 'express';
import * as notificationService from '../services/notificationService';

export const getMyNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const notifications = await notificationService.getNotificationsByUser(userId);
    res.json(notifications);
  } catch (error: any) {
    res.status(500).json({ error: 'Error al obtener notificaciones: ' + error.message });
  }
};

export const markNotificationAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const notification = await notificationService.markAsRead(parseInt(id), userId);
    if (!notification) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }
    res.json(notification);
  } catch (error: any) {
    res.status(500).json({ error: 'Error al marcar notificación: ' + error.message });
  }
};
