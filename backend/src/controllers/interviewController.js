const { query } = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');
const { auditLog } = require('../utils/auditLogger');
const { createNotification } = require('../services/notificationService');

const scheduleInterview = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const {
      application_id,
      scheduled_date,
      scheduled_time,
      mode,
      location,
      meeting_link,
      interviewer_notes
    } = req.body;

    // Verify application
    const appRes = await query(
      `SELECT a.*, j.title as job_title, j.recruiter_id, u.name as candidate_name, u.email as candidate_email
       FROM applications a
       JOIN jobs j ON j.id = a.job_id
       JOIN users u ON u.id = a.candidate_id
       WHERE a.id = $1`,
      [application_id]
    );

    if (appRes.rows.length === 0) {
      return errorResponse(res, 'Application not found', 404);
    }

    const application = appRes.rows[0];

    // Verify ownership
    if (userRole !== 'admin' && application.recruiter_id !== userId) {
      return errorResponse(res, 'You are not authorized to schedule interviews for this application', 403);
    }

    // Insert interview
    const interviewRes = await query(
      `INSERT INTO interviews (
        application_id, scheduled_date, scheduled_time, mode,
        location, meeting_link, interviewer_notes, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'scheduled')
      RETURNING *`,
      [
        application_id,
        scheduled_date,
        scheduled_time,
        mode,
        location || null,
        meeting_link || null,
        interviewer_notes || null
      ]
    );

    const interview = interviewRes.rows[0];

    // Automatically advance application status to interview_scheduled
    await query(
      `UPDATE applications SET status = 'interview_scheduled', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [application_id]
    );

    // Notify candidate
    await createNotification(
      application.candidate_id,
      'Interview Scheduled 📅',
      `An interview for "${application.job_title}" has been scheduled on ${scheduled_date} at ${scheduled_time} (${mode}).`,
      'INTERVIEW_SCHEDULED'
    );

    // Notify recruiter confirmation
    await createNotification(
      application.recruiter_id,
      'Interview Confirmed',
      `Interview with ${application.candidate_name} scheduled for ${scheduled_date} at ${scheduled_time}.`,
      'INTERVIEW_SCHEDULED'
    );

    await auditLog(userId, 'INTERVIEW_SCHEDULED', 'interview', interview.id, {
      application_id,
      scheduled_date,
      scheduled_time
    });

    return successResponse(res, interview, 'Interview scheduled successfully', 201);
  } catch (error) {
    next(error);
  }
};

const getMyInterviews = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { status } = req.query;

    let filterSql = '';
    const values = [userId];
    let paramIndex = 2;

    if (status) {
      filterSql += ` AND i.status = $${paramIndex++}`;
      values.push(status);
    }

    let userJoinCondition = '';
    if (userRole === 'candidate') {
      userJoinCondition = 'WHERE a.candidate_id = $1';
    } else if (userRole === 'recruiter') {
      userJoinCondition = 'WHERE j.recruiter_id = $1';
    } else if (userRole === 'admin') {
      userJoinCondition = 'WHERE 1=1';
      // For admin we don't bind $1 as userId in WHERE
      values.shift();
      paramIndex = 1;
      if (status) {
        filterSql = ` AND i.status = $${paramIndex++}`;
        values.push(status);
      }
    }

    const interviewsSql = `
      SELECT 
        i.*,
        a.id as application_id,
        a.status as application_status,
        j.id as job_id,
        j.title as job_title,
        j.location as job_location,
        rp.company_name,
        rp.company_logo_url,
        u_cand.name as candidate_name,
        u_cand.email as candidate_email,
        u_rec.name as recruiter_name,
        u_rec.email as recruiter_email
      FROM interviews i
      JOIN applications a ON a.id = i.application_id
      JOIN jobs j ON j.id = a.job_id
      JOIN users u_cand ON u_cand.id = a.candidate_id
      JOIN users u_rec ON u_rec.id = j.recruiter_id
      LEFT JOIN recruiter_profiles rp ON rp.user_id = j.recruiter_id
      ${userJoinCondition}
      ${filterSql}
      ORDER BY i.scheduled_date ASC, i.scheduled_time ASC
    `;

    const result = await query(interviewsSql, values);

    return successResponse(res, result.rows, 'Interviews fetched successfully');
  } catch (error) {
    next(error);
  }
};

const getInterviewById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const interviewSql = `
      SELECT 
        i.*,
        a.candidate_id,
        j.recruiter_id,
        j.title as job_title,
        rp.company_name,
        u_cand.name as candidate_name,
        u_cand.email as candidate_email,
        u_rec.name as recruiter_name
      FROM interviews i
      JOIN applications a ON a.id = i.application_id
      JOIN jobs j ON j.id = a.job_id
      JOIN users u_cand ON u_cand.id = a.candidate_id
      JOIN users u_rec ON u_rec.id = j.recruiter_id
      LEFT JOIN recruiter_profiles rp ON rp.user_id = j.recruiter_id
      WHERE i.id = $1
    `;

    const result = await query(interviewSql, [id]);
    if (result.rows.length === 0) {
      return errorResponse(res, 'Interview not found', 404);
    }

    const interview = result.rows[0];

    if (
      userRole !== 'admin' &&
      interview.candidate_id !== userId &&
      interview.recruiter_id !== userId
    ) {
      return errorResponse(res, 'Access denied', 403);
    }

    return successResponse(res, interview, 'Interview details retrieved');
  } catch (error) {
    next(error);
  }
};

const updateInterview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const {
      scheduled_date,
      scheduled_time,
      mode,
      location,
      meeting_link,
      interviewer_notes,
      candidate_notes,
      status
    } = req.body;

    const checkSql = `
      SELECT i.*, a.candidate_id, j.recruiter_id, j.title as job_title
      FROM interviews i
      JOIN applications a ON a.id = i.application_id
      JOIN jobs j ON j.id = a.job_id
      WHERE i.id = $1
    `;
    const checkRes = await query(checkSql, [id]);

    if (checkRes.rows.length === 0) {
      return errorResponse(res, 'Interview not found', 404);
    }

    const existing = checkRes.rows[0];

    // Authorization
    if (userRole === 'candidate') {
      // Candidate can only add candidate notes
      if (existing.candidate_id !== userId) {
        return errorResponse(res, 'Access denied', 403);
      }
      const updated = await query(
        `UPDATE interviews SET candidate_notes = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
        [candidate_notes || existing.candidate_notes, id]
      );
      return successResponse(res, updated.rows[0], 'Interview notes updated');
    }

    if (userRole !== 'admin' && existing.recruiter_id !== userId) {
      return errorResponse(res, 'Access denied', 403);
    }

    const isRescheduled =
      (scheduled_date && scheduled_date !== existing.scheduled_date) ||
      (scheduled_time && scheduled_time !== existing.scheduled_time) ||
      status === 'rescheduled';

    const newStatus = status || (isRescheduled ? 'rescheduled' : existing.status);

    const updateSql = `
      UPDATE interviews SET
        scheduled_date = COALESCE($1, scheduled_date),
        scheduled_time = COALESCE($2, scheduled_time),
        mode = COALESCE($3, mode),
        location = COALESCE($4, location),
        meeting_link = COALESCE($5, meeting_link),
        interviewer_notes = COALESCE($6, interviewer_notes),
        candidate_notes = COALESCE($7, candidate_notes),
        status = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *
    `;

    const updateRes = await query(updateSql, [
      scheduled_date || null,
      scheduled_time || null,
      mode || null,
      location || null,
      meeting_link || null,
      interviewer_notes || null,
      candidate_notes || null,
      newStatus,
      id
    ]);

    // Send notification
    if (newStatus === 'cancelled') {
      await createNotification(
        existing.candidate_id,
        'Interview Cancelled',
        `The interview for "${existing.job_title}" has been cancelled.`,
        'INTERVIEW_CANCELLED'
      );
    } else if (isRescheduled) {
      await createNotification(
        existing.candidate_id,
        'Interview Rescheduled 📅',
        `Your interview for "${existing.job_title}" has been rescheduled to ${scheduled_date || existing.scheduled_date} at ${scheduled_time || existing.scheduled_time}.`,
        'INTERVIEW_RESCHEDULED'
      );
    }

    await auditLog(userId, 'INTERVIEW_UPDATED', 'interview', id, { status: newStatus });

    return successResponse(res, updateRes.rows[0], 'Interview updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteInterview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const checkSql = `
      SELECT i.*, a.candidate_id, j.recruiter_id, j.title as job_title
      FROM interviews i
      JOIN applications a ON a.id = i.application_id
      JOIN jobs j ON j.id = a.job_id
      WHERE i.id = $1
    `;
    const checkRes = await query(checkSql, [id]);

    if (checkRes.rows.length === 0) {
      return errorResponse(res, 'Interview not found', 404);
    }

    const existing = checkRes.rows[0];

    if (userRole !== 'admin' && existing.recruiter_id !== userId) {
      return errorResponse(res, 'Access denied', 403);
    }

    await query('DELETE FROM interviews WHERE id = $1', [id]);

    await createNotification(
      existing.candidate_id,
      'Interview Cancelled',
      `Your interview for "${existing.job_title}" was cancelled and removed.`,
      'INTERVIEW_CANCELLED'
    );

    await auditLog(userId, 'INTERVIEW_DELETED', 'interview', id);

    return successResponse(res, null, 'Interview cancelled and removed');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  scheduleInterview,
  getMyInterviews,
  getInterviewById,
  updateInterview,
  deleteInterview
};
