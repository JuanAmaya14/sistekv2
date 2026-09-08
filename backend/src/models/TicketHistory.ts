import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional, NonAttribute, ForeignKey } from 'sequelize';
import { sequelize } from '../config/database'; // <-- Agregar llaves
import User from './User';
import Ticket from './Ticket';

export type TicketChangeType = 'status_change' | 'agent_assignment';

export class TicketHistory extends Model<
  InferAttributes<TicketHistory>,
  InferCreationAttributes<TicketHistory>
> {
  declare id: CreationOptional<number>;
  declare ticket_id: ForeignKey<Ticket['id']>;
  declare changed_by: ForeignKey<User['id']>;
  declare old_status: string | null;
  declare new_status: string | null;
  declare change_type: TicketChangeType;
  declare changed_at: CreationOptional<Date>;

  // Propiedades asociadas
  declare ticket?: NonAttribute<Ticket>;
  declare modifier?: NonAttribute<User>;
}

TicketHistory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    ticket_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tickets',
        key: 'id'
      }
    },
    changed_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    old_status: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    new_status: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    change_type: {
      type: DataTypes.ENUM('status_change', 'agent_assignment'),
      allowNull: false
    },
    changed_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'ticket_history',
    timestamps: true,
    createdAt: 'changed_at',
    updatedAt: false
  }
);

export default TicketHistory;