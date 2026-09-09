import * as ticketService from '../services/ticketService';

/**
 * Reglas de visibilidad de un ticket:
 *  - administrador: cualquier ticket
 *  - agente: solo los tickets asignados a él
 *  - cliente: solo los tickets que él creó
 *
 * Centralizar esto evita que un usuario acceda a tickets ajenos cambiando
 * el ID en la URL (IDOR).
 */
export type TicketAccess =
  | { allowed: true; ticket: any }
  | { allowed: false; status: 404 | 403; error: string };

export const checkTicketAccess = async (
  ticketId: number,
  userId: number,
  userRole: string
): Promise<TicketAccess> => {
  if (!Number.isInteger(ticketId) || ticketId <= 0) {
    return { allowed: false, status: 404, error: 'Ticket no encontrado' };
  }

  const ticket = await ticketService.getTicketById(ticketId);
  if (!ticket) {
    return { allowed: false, status: 404, error: 'Ticket no encontrado' };
  }

  if (userRole === 'administrador') {
    return { allowed: true, ticket };
  }

  if (userRole === 'agente') {
    if (ticket.assigned_agent_id === userId) {
      return { allowed: true, ticket };
    }
    // Un agente puede ver tickets aún sin asignar para poder tomarlos
    if (ticket.assigned_agent_id === null) {
      return { allowed: true, ticket };
    }
    return { allowed: false, status: 403, error: 'No tienes acceso a este ticket' };
  }

  if (userRole === 'cliente') {
    if (ticket.user_id === userId) {
      return { allowed: true, ticket };
    }
    // Se responde 404 para no revelar que el ticket existe
    return { allowed: false, status: 404, error: 'Ticket no encontrado' };
  }

  return { allowed: false, status: 403, error: 'Rol no reconocido' };
};

/** Convierte un parámetro de ruta en un entero positivo o null. */
export const parseId = (value: string | undefined): number | null => {
  if (!value) return null;
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};
