const { query } = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');
const { auditLog } = require('../utils/auditLogger');

const getAdminStatistics = async (req, res, next) => {
  try {
    // Total users breakdown
    const usersStatRes = await query(`
      SELECT 
        COUNT(*)::int as total_users,
        COUNT(CASE WHEN role = 'candidate' THEN 1 END)::int as total_candidates,
        COUNT(CASE WHEN role = 'recruiter' THEN 1 END)::int as total_recruiters,
        COUNT(CASE WHEN role = 'admin' THEN 1 END)::int as total_admins,
        COUNT(CASE WHEN is_active = TRUE THEN 1 END)::int as active_users,
        COUNT(CASE WHEN is_active = FALSE THEN 1 END)::int as inactive_users
      FROM users
    `);

    // Jobs breakdown
    const jobsStatRes = await query(`
      SELECT 
        COUNT(*)::int as total_jobs,
        COUNT(CASE WHEN status = 'published' THEN 1 END)::int as published_jobs,
        COUNT(CASE WHEN status = 'draft' THEN 1 END)::int as draft_jobs,
        COUNT(CASE WHEN status = 'closed' THEN 1 END)::int as closed_jobs
      FROM jobs
    `);

    // Applications breakdown
    const appsStatRes = await query(`
      SELECT 
        COUNT(*)::int as total_applications,
        COUNT(CASE WHEN status = 'applied' THEN 1 END)::int as applied_count,
        COUNT(CASE WHEN status = 'under_review' THEN 1 END)::int as under_review_count,
        COUNT(CASE WHEN status = 'shortlisted' THEN 1 END)::int as shortlisted_count,
        COUNT(CASE WHEN status = 'interview_scheduled' THEN 1 END)::int as interview_count,
        COUNT(CASE WHEN status = 'selected' THEN 1 END)::int as selected_count,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END)::int as rejected_count,
        COUNT(CASE WHEN status = 'withdrawn' THEN 1 END)::int as withdrawn_count
      FROM applications
    `);

    // Interviews breakdown
    const interviewsStatRes = await query(`
      SELECT 
        COUNT(*)::int as total_interviews,
        COUNT(CASE WHEN status = 'scheduled' THEN 1 END)::int as scheduled,
        COUNT(CASE WHEN status = 'completed' THEN 1 END)::int as completed,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END)::int as cancelled
      FROM interviews
    `);

    // Recent 10 audit logs
    const recentAuditRes = await query(`
      SELECT al.*, u.name as user_name, u.email as user_email, u.role as user_role
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.user_id
      ORDER BY al.created_at DESC
      LIMIT 8
    `);

    // Monthly platform activity
    const monthlyGrowthRes = await query(`
      SELECT TO_CHAR(created_at, 'Mon YYYY') as month,
             DATE_TRUNC('month', created_at) as sort_month,
             COUNT(*)::int as count
      FROM users
      WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY TO_CHAR(created_at, 'Mon YYYY'), DATE_TRUNC('month', created_at)
      ORDER BY sort_month ASC
    `);

    return successResponse(res, {
      users: usersStatRes.rows[0],
      jobs: jobsStatRes.rows[0],
      applications: appsStatRes.rows[0],
      interviews: interviewsStatRes.rows[0],
      recentAuditLogs: recentAuditRes.rows,
      monthlyUserRegistrations: monthlyGrowthRes.rows
    });
  } catch (error) {
    next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;

    const { search, role, is_active } = req.query;

    const conditions = [];
    const values = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(`(u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`);
      values.push(`%${search}%`);
      paramIndex++;
    }

    if (role) {
      conditions.push(`u.role = $${paramIndex++}`);
      values.push(role);
    }

    if (is_active !== undefined && is_active !== '') {
      conditions.push(`u.is_active = $${paramIndex++}`);
      values.push(is_active === 'true' || is_active === true);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*)::int as total FROM users u ${whereClause}`;
    const countRes = await query(countSql, values);
    const total = countRes.rows[0].total;

    const usersSql = `
      SELECT 
        u.id, u.name, u.email, u.role, u.is_active, u.created_at, u.updated_at,
        cp.phone as candidate_phone, cp.location as candidate_location,
        rp.company_name, rp.phone as recruiter_phone
      FROM users u
      LEFT JOIN candidate_profiles cp ON cp.user_id = u.id
      LEFT JOIN recruiter_profiles rp ON rp.user_id = u.id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    const dataRes = await query(usersSql, [...values, limit, offset]);

    return successResponse(
      res,
      dataRes.rows,
      'Users fetched successfully',
      200,
      {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    );
  } catch (error) {
    next(error);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    const adminId = req.user.id;

    if (parseInt(id, 10) === adminId && is_active === false) {
      return errorResponse(res, 'You cannot deactivate your own administrator account', 400);
    }

    const userRes = await query(
      `UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, name, email, role, is_active`,
      [is_active, id]
    );

    if (userRes.rows.length === 0) {
      return errorResponse(res, 'User not found', 404);
    }

    const updatedUser = userRes.rows[0];

    await auditLog(
      adminId,
      is_active ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      'user',
      id,
      { email: updatedUser.email }
    );

    return successResponse(res, updatedUser, `User ${is_active ? 'activated' : 'deactivated'} successfully`);
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    if (parseInt(id, 10) === adminId) {
      return errorResponse(res, 'You cannot delete your own administrator account', 400);
    }

    const userRes = await query('SELECT email FROM users WHERE id = $1', [id]);
    if (userRes.rows.length === 0) {
      return errorResponse(res, 'User not found', 404);
    }

    const email = userRes.rows[0].email;

    await query('DELETE FROM users WHERE id = $1', [id]);

    await auditLog(adminId, 'USER_DELETED', 'user', id, { email });

    return successResponse(res, null, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};

const getAdminJobs = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;

    const { search, status } = req.query;

    const conditions = [];
    const values = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`j.status = $${paramIndex++}`);
      values.push(status);
    }

    if (search) {
      conditions.push(`(j.title ILIKE $${paramIndex} OR rp.company_name ILIKE $${paramIndex} OR u.name ILIKE $${paramIndex})`);
      values.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*)::int as total
      FROM jobs j
      LEFT JOIN recruiter_profiles rp ON rp.user_id = j.recruiter_id
      LEFT JOIN users u ON u.id = j.recruiter_id
      ${whereClause}
    `;
    const countRes = await query(countSql, values);
    const total = countRes.rows[0].total;

    const dataSql = `
      SELECT 
        j.*,
        rp.company_name,
        u.name as recruiter_name,
        u.email as recruiter_email,
        (SELECT COUNT(*)::int FROM applications a WHERE a.job_id = j.id) as applications_count
      FROM jobs j
      LEFT JOIN recruiter_profiles rp ON rp.user_id = j.recruiter_id
      LEFT JOIN users u ON u.id = j.recruiter_id
      ${whereClause}
      ORDER BY j.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    const dataRes = await query(dataSql, [...values, limit, offset]);

    return successResponse(
      res,
      dataRes.rows,
      'Jobs retrieved successfully',
      200,
      {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    );
  } catch (error) {
    next(error);
  }
};

const getAdminApplications = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;

    const { status, search } = req.query;

    const conditions = [];
    const values = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`a.status = $${paramIndex++}`);
      values.push(status);
    }

    if (search) {
      conditions.push(`(u_cand.name ILIKE $${paramIndex} OR j.title ILIKE $${paramIndex} OR rp.company_name ILIKE $${paramIndex})`);
      values.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*)::int as total
      FROM applications a
      JOIN jobs j ON j.id = a.job_id
      JOIN users u_cand ON u_cand.id = a.candidate_id
      LEFT JOIN recruiter_profiles rp ON rp.user_id = j.recruiter_id
      ${whereClause}
    `;
    const countRes = await query(countSql, values);
    const total = countRes.rows[0].total;

    const dataSql = `
      SELECT 
        a.*,
        j.title as job_title,
        rp.company_name,
        u_cand.name as candidate_name,
        u_cand.email as candidate_email,
        u_rec.name as recruiter_name
      FROM applications a
      JOIN jobs j ON j.id = a.job_id
      JOIN users u_cand ON u_cand.id = a.candidate_id
      JOIN users u_rec ON u_rec.id = j.recruiter_id
      LEFT JOIN recruiter_profiles rp ON rp.user_id = j.recruiter_id
      ${whereClause}
      ORDER BY a.applied_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    const dataRes = await query(dataSql, [...values, limit, offset]);

    return successResponse(
      res,
      dataRes.rows,
      'Applications retrieved successfully',
      200,
      {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    );
  } catch (error) {
    next(error);
  }
};

const getAdminAuditLogs = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const { action, search } = req.query;

    const conditions = [];
    const values = [];
    let paramIndex = 1;

    if (action) {
      conditions.push(`al.action = $${paramIndex++}`);
      values.push(action);
    }

    if (search) {
      conditions.push(`(u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR al.action ILIKE $${paramIndex} OR al.entity_type ILIKE $${paramIndex})`);
      values.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*)::int as total
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.user_id
      ${whereClause}
    `;
    const countRes = await query(countSql, values);
    const total = countRes.rows[0].total;

    const logsSql = `
      SELECT 
        al.*,
        u.name as user_name,
        u.email as user_email,
        u.role as user_role
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.user_id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    const dataRes = await query(logsSql, [...values, limit, offset]);

    return successResponse(
      res,
      dataRes.rows,
      'Audit logs fetched successfully',
      200,
      {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    );
  } catch (error) {
    next(error);
  }
};

// In-memory or flexible system settings store
let systemSettings = {
  platformName: 'Recruitment Management System',
  supportEmail: 'support@rms-portal.com',
  allowRegistrations: true,
  requireResumeForApplication: true,
  maxUploadSizeMB: 5,
  maintenanceMode: false
};

const getSystemSettings = (req, res) => {
  return successResponse(res, systemSettings, 'System settings retrieved');
};

const updateSystemSettings = async (req, res) => {
  const adminId = req.user.id;
  systemSettings = { ...systemSettings, ...req.body };
  await auditLog(adminId, 'SYSTEM_SETTINGS_UPDATED', 'settings', null, req.body);
  return successResponse(res, systemSettings, 'System settings updated');
};

module.exports = {
  getAdminStatistics,
  getUsers,
  updateUserStatus,
  deleteUser,
  getAdminJobs,
  getAdminApplications,
  getAdminAuditLogs,
  getSystemSettings,
  updateSystemSettings
};
