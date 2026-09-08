import pool from '../config/database';

export const createCommentsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
};

export const getCommentsByTicket = async (ticketId: number) => {
  const result = await pool.query(
    `SELECT c.*, u.username as autor
     FROM comments c
     JOIN users u ON c.user_id = u.id
     WHERE c.ticket_id = $1
     ORDER BY c.created_at ASC`,
    [ticketId]
  );
  return result.rows;
};

export const createComment = async (ticketId: number, userId: number, content: string) => {
  if (!content || !content.trim()) {
    throw new Error('El comentario no puede estar vacío');
  }
  const result = await pool.query(
    `INSERT INTO comments (ticket_id, user_id, content, created_at)
     VALUES ($1, $2, $3, NOW())
     RETURNING *`,
    [ticketId, userId, content.trim()]
  );
  return result.rows[0];
};
