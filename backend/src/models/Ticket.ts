import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional, NonAttribute, ForeignKey } from 'sequelize';
import { sequelize } from '../config/database'; // <-- Agregar llaves
import User from './User';
import type TicketHistory from './TicketHistory';

export type TicketPriority = 'bajo' | 'medio' | 'alto' | 'urgente';
export type TicketStatus = 'Abierto' | 'En progreso' | 'Cerrado';

export class Ticket extends Model<
  InferAttributes<Ticket>,
  InferCreationAttributes<Ticket>
> {
  declare id: CreationOptional<number>;
  declare title: string;
  declare description: string;
  declare priority: TicketPriority;
  declare type: string;
  declare status: CreationOptional<TicketStatus>;
  declare user_id: ForeignKey<User['id']>;
  declare assigned_agent_id: ForeignKey<User['id']> | null;
  declare assigned_date: Date | null;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;

  // Propiedades cargadas por include/asociaciones
  declare author?: NonAttribute<User>;
  declare assignedAgent?: NonAttribute<User | null>;
  declare history?: NonAttribute<TicketHistory[]>;
}

Ticket.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    priority: {
      type: DataTypes.ENUM('bajo', 'medio', 'alto', 'urgente'),
      allowNull: false
    },
    type: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('Abierto', 'En progreso', 'Cerrado'),
      allowNull: false,
      defaultValue: 'Abierto'
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    assigned_agent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    assigned_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'tickets',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default Ticket;