import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional, NonAttribute, HasManyGetAssociationsMixin } from 'sequelize';
import { sequelize } from '../config/database'; // <-- Agregar llaves
import type Ticket from './Ticket';
import type TicketHistory from './TicketHistory';

export type UserRole = 'cliente' | 'agente' | 'administrador';

export class User extends Model<
  InferAttributes<User>,
  InferCreationAttributes<User>
> {
  declare id: CreationOptional<number>;
  declare username: string;
  declare email: string;
  declare password: string;
  declare role: UserRole;
  declare created_at: CreationOptional<Date>;

  // Relaciones (opcionales para tipado en TypeScript)
  declare ticketsCreated?: NonAttribute<Ticket[]>;
  declare ticketsAssigned?: NonAttribute<Ticket[]>;
  declare statusChanges?: NonAttribute<TicketHistory[]>;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('cliente', 'agente', 'administrador'),
      allowNull: false
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  }
);

export default User;