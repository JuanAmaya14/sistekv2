import pool from '../config/database';

export const createNotificationsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
};

export const createNotification = async (userId: number, ticketId: number) => {
  const result = await pool.query(
    'INSERT INTO notifications (user_id, ticket_id) VALUES ($1, $2) RETURNING *',
    [userId, ticketId]
  );
  return result.rows[0];
};

export const getNotificationsByUser = async (userId: number) => {
  const result = await pool.query(
    `SELECT n.id, n.user_id, n.ticket_id, n.is_read, n.created_at,
            t.title AS ticket_title, t.priority AS ticket_priority
     FROM notifications n
     JOIN tickets t ON n.ticket_id = t.id
     WHERE n.user_id = $1
     ORDER BY n.created_at DESC`,
    [userId]
  );
  return result.rows;
};

export const markAsRead = async (notificationId: number, userId: number) => {
  const result = await pool.query(
    'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *',
    [notificationId, userId]
  );
  return result.rows[0];
};
