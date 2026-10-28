import { API_URL } from './config';
import { authService } from './authService';
import { safeId } from './safeId';

export interface Notification {
  id: number;
  user_id: number;
  ticket_id: number;
  ticket_title: string;
  ticket_priority: string;
  is_read: boolean;
  created_at: string;
}

export const notificationService = {
  async getMyNotifications(): Promise<Notification[]> {
    const response = await fetch(`${API_URL}/notifications`, {
      headers: authService.getAuthHeaders()
    });
    if (!response.ok) throw new Error('Error al obtener notificaciones');
    return response.json();
  },

  async markAsRead(id: number): Promise<Notification> {
    const response = await fetch(`${API_URL}/notifications/${safeId(id)}/read`, {
      method: 'PUT',
      headers: authService.getAuthHeaders()
    });
    if (!response.ok) throw new Error('Error al marcar notificación');
    return response.json();
  }
};
