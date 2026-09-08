import { authService } from './authService';

const API_URL = 'http://localhost:4000/api';

export interface Comment {
  id: number;
  ticket_id: number;
  user_id: number;
  autor: string;
  content: string;
  created_at: string;
}

export const commentService = {
  async getComments(ticketId: number): Promise<Comment[]> {
    const response = await fetch(`${API_URL}/tickets/${ticketId}/comments`, {
      headers: authService.getAuthHeaders()
    });
    if (!response.ok) throw new Error('Error al obtener comentarios');
    return response.json();
  },

  async createComment(ticketId: number, content: string): Promise<Comment> {
    const response = await fetch(`${API_URL}/tickets/${ticketId}/comments`, {
      method: 'POST',
      headers: authService.getAuthHeaders(),
      body: JSON.stringify({ content })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    return response.json();
  }
};
