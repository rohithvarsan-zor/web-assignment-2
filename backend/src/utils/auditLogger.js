const { query } = require('../config/db');

/**
 * Record an audit log entry
 * @param {number|null} userId - ID of the user performing the action
 * @param {string} action - Action name (e.g. 'USER_REGISTERED', 'JOB_CREATED')
 * @param {string} entityType - Entity type ('user', 'job', 'application', 'interview', etc.)
 * @param {number|null} entityId - ID of the affected entity
 * @param {object|null} details - Key-value metadata
 */
const auditLog = async (userId, action, entityType, entityId = null, details = null) => {
  try {
    const text = `
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, created_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
    `;
    const detailsJson = details ? JSON.stringify(details) : null;
    await query(text, [userId || null, action, entityType, entityId, detailsJson]);
  } catch (error) {
    console.error('Audit Log Error (non-blocking):', error.message);
  }
};

module.exports = {
  auditLog
};
