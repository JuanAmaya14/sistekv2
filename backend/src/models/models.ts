import { sequelize } from '../config/database'; // <-- Agregar llaves
import User from './User';
import Ticket from './Ticket';
import TicketHistory from './TicketHistory';

// User <-> Ticket (Creador)
User.hasMany(Ticket, { foreignKey: 'user_id', onDelete: 'CASCADE', as: 'ticketsCreated' });
Ticket.belongsTo(User, { foreignKey: 'user_id', as: 'author' });

// User <-> Ticket (Agente asignado)
User.hasMany(Ticket, { foreignKey: 'assigned_agent_id', onDelete: 'SET NULL', as: 'ticketsAssigned' });
Ticket.belongsTo(User, { foreignKey: 'assigned_agent_id', as: 'assignedAgent' });

// Ticket <-> TicketHistory
Ticket.hasMany(TicketHistory, { foreignKey: 'ticket_id', onDelete: 'CASCADE', as: 'history' });
TicketHistory.belongsTo(Ticket, { foreignKey: 'ticket_id', as: 'ticket' });

// User <-> TicketHistory (Quien realizó el cambio)
User.hasMany(TicketHistory, { foreignKey: 'changed_by', onDelete: 'RESTRICT', as: 'statusChanges' });
TicketHistory.belongsTo(User, { foreignKey: 'changed_by', as: 'modifier' });

export {
  sequelize,
  User,
  Ticket,
  TicketHistory
};