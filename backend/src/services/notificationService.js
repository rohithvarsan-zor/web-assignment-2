const { query } = require('../config/db');

/**
 * Create a new notification for a user
 * @param {number} userId
 * @param {string} title
 * @param {string} message
 * @param {string} type - e.g. 'APPLICATION_RECEIVED', 'STATUS_CHANGED', 'INTERVIEW_SCHEDULED', etc.
 */
const createNotification = async (userId, title, message, type = 'SYSTEM_NOTIFICATION') => {
  try {
    const text = `
      INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
      VALUES ($1, $2, $3, $4, FALSE, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    const res = await query(text, [userId, title, message, type]);
    return res.rows[0];
  } catch (error) {
    console.error('Failed to create notification:', error.message);
    return null;
  }
};

module.exports = {
  createNotification
};
