const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { generateToken } = require('../utils/token');
const { successResponse, errorResponse } = require('../utils/response');
const { auditLog } = require('../utils/auditLogger');
const { createNotification } = require('../services/notificationService');

const register = async (req, res, next) => {
  try {
    const { name, email, password, role = 'candidate', company_name } = req.body;

    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return errorResponse(res, 'An account with this email address already exists', 409);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userRes = await query(
      `INSERT INTO users (name, email, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, TRUE)
       RETURNING id, name, email, role, is_active, created_at`,
      [name, email, passwordHash, role]
    );

    const newUser = userRes.rows[0];

    // Initialize corresponding profile
    if (role === 'candidate') {
      await query(
        `INSERT INTO candidate_profiles (user_id) VALUES ($1)`,
        [newUser.id]
      );
    } else if (role === 'recruiter') {
      await query(
        `INSERT INTO recruiter_profiles (user_id, company_name)
         VALUES ($1, $2)`,
        [newUser.id, company_name || `${newUser.name}'s Company`]
      );
    }

    await auditLog(newUser.id, 'USER_REGISTERED', 'user', newUser.id, { email, role });
    await createNotification(
      newUser.id,
      'Welcome to the Platform!',
      `Welcome to our Recruitment Management System, ${newUser.name}. Complete your profile to get started!`,
      'WELCOME'
    );

    const token = generateToken(newUser);

    return successResponse(
      res,
      {
        token,
        user: newUser
      },
      'Registration successful',
      201
    );
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const userRes = await query(
      `SELECT id, name, email, password_hash, role, is_active, created_at
       FROM users WHERE email = $1`,
      [email]
    );

    if (userRes.rows.length === 0) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    const user = userRes.rows[0];

    if (!user.is_active) {
      return errorResponse(res, 'Your account has been deactivated. Please contact support.', 403);
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    const token = generateToken(user);

    await auditLog(user.id, 'USER_LOGGED_IN', 'user', user.id, { email: user.email });

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      created_at: user.created_at
    };

    return successResponse(
      res,
      {
        token,
        user: safeUser
      },
      'Login successful'
    );
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const userRes = await query(
      `SELECT id, name, email, role, is_active, created_at, updated_at
       FROM users WHERE id = $1`,
      [userId]
    );

    if (userRes.rows.length === 0) {
      return errorResponse(res, 'User not found', 404);
    }

    const user = userRes.rows[0];
    let profile = null;

    if (user.role === 'candidate') {
      const pRes = await query(
        `SELECT cp.*, 
          COALESCE(json_agg(DISTINCT jsonb_build_object('id', s.id, 'name', s.name)) FILTER (WHERE s.id IS NOT NULL), '[]') as skills
         FROM candidate_profiles cp
         LEFT JOIN candidate_skills cs ON cs.candidate_id = cp.user_id
         LEFT JOIN skills s ON s.id = cs.skill_id
         WHERE cp.user_id = $1
         GROUP BY cp.id`,
        [userId]
      );
      profile = pRes.rows[0] || null;
    } else if (user.role === 'recruiter') {
      const rRes = await query(
        `SELECT * FROM recruiter_profiles WHERE user_id = $1`,
        [userId]
      );
      profile = rRes.rows[0] || null;
    }

    // Get unread notifications count
    const unreadRes = await query(
      `SELECT COUNT(*)::int as count FROM notifications WHERE user_id = $1 AND is_read = FALSE`,
      [userId]
    );

    return successResponse(res, {
      user,
      profile,
      unreadNotificationsCount: unreadRes.rows[0].count
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res) => {
  if (req.user) {
    await auditLog(req.user.id, 'USER_LOGGED_OUT', 'user', req.user.id);
  }
  return successResponse(res, null, 'Logged out successfully');
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const userRes = await query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      return errorResponse(res, 'User not found', 404);
    }

    const isMatch = await bcrypt.compare(currentPassword, userRes.rows[0].password_hash);
    if (!isMatch) {
      return errorResponse(res, 'Incorrect current password', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await query(
      `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [newHash, userId]
    );

    await auditLog(userId, 'PASSWORD_CHANGED', 'user', userId);

    return successResponse(res, null, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout,
  changePassword
};
