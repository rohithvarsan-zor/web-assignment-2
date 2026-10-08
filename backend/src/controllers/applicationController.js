const { query } = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');
const { auditLog } = require('../utils/auditLogger');
const { createNotification } = require('../services/notificationService');

const applyForJob = async (req, res, next) => {
  try {
    const candidateId = req.user.id;
    const { job_id, cover_letter, resume_url } = req.body;

    // 1. Validate Job exists and is published
    const jobRes = await query(
      `SELECT j.*, rp.company_name FROM jobs j
       LEFT JOIN recruiter_profiles rp ON rp.user_id = j.recruiter_id
       WHERE j.id = $1`,
      [job_id]
    );

    if (jobRes.rows.length === 0) {
      return errorResponse(res, 'Job not found', 404);
    }

    const job = jobRes.rows[0];
    if (job.status !== 'published') {
      return errorResponse(res, 'This job is not currently accepting applications', 400);
    }

    // 2. Validate Candidate Profile
    const profileRes = await query(
      'SELECT * FROM candidate_profiles WHERE user_id = $1',
      [candidateId]
    );

    if (profileRes.rows.length === 0) {
      return errorResponse(res, 'Candidate profile not found. Please complete your profile first.', 400);
    }

    const candidateProfile = profileRes.rows[0];

    // Determine resume URL
    const finalResumeUrl = resume_url || candidateProfile.resume_url;
    if (!finalResumeUrl) {
      return errorResponse(
        res,
        'Please upload a resume to your profile or attach one with your application.',
        400
      );
    }

    // 3. Prevent duplicate application
    const existingAppRes = await query(
      'SELECT id, status FROM applications WHERE job_id = $1 AND candidate_id = $2',
      [job_id, candidateId]
    );

    if (existingAppRes.rows.length > 0) {
      return errorResponse(res, 'You have already submitted an application for this position.', 409);
    }

    // 4. Create application
    const appRes = await query(
      `INSERT INTO applications (job_id, candidate_id, resume_url, cover_letter, status, applied_at)
       VALUES ($1, $2, $3, $4, 'applied', CURRENT_TIMESTAMP)
       RETURNING *`,
      [job_id, candidateId, finalResumeUrl, cover_letter || null]
    );

    const newApplication = appRes.rows[0];

    // 5. Send notifications
    // Notify candidate
    await createNotification(
      candidateId,
      'Application Submitted',
      `Your application for "${job.title}" at ${job.company_name || 'the company'} was successfully submitted.`,
      'APPLICATION_SUBMITTED'
    );

    // Notify recruiter
    await createNotification(
      job.recruiter_id,
      'New Candidate Application',
      `${req.user.name} applied for "${job.title}".`,
      'APPLICATION_RECEIVED'
    );

    // 6. Audit log
    await auditLog(candidateId, 'APPLICATION_SUBMITTED', 'application', newApplication.id, {
      job_id,
      job_title: job.title
    });

    return successResponse(res, newApplication, 'Application submitted successfully', 201);
  } catch (error) {
    next(error);
  }
};

const getMyApplications = async (req, res, next) => {
  try {
    const candidateId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;
    const { status } = req.query;

    const conditions = ['a.candidate_id = $1'];
    const values = [candidateId];
    let paramIndex = 2;

    if (status) {
      conditions.push(`a.status = $${paramIndex++}`);
      values.push(status);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const countSql = `SELECT COUNT(*)::int as total FROM applications a ${whereClause}`;
    const countRes = await query(countSql, values);
    const total = countRes.rows[0].total;

    const dataSql = `
      SELECT 
        a.*,
        j.title as job_title,
        j.location as job_location,
        j.employment_type,
        j.salary_min,
        j.salary_max,
        j.status as job_status,
        rp.company_name,
        rp.company_logo_url,
        (
          SELECT json_build_object(
            'id', i.id,
            'scheduled_date', i.scheduled_date,
            'scheduled_time', i.scheduled_time,
            'mode', i.mode,
            'location', i.location,
            'meeting_link', i.meeting_link,
            'status', i.status
          )
          FROM interviews i
          WHERE i.application_id = a.id
          ORDER BY i.created_at DESC
          LIMIT 1
        ) as latest_interview
      FROM applications a
      JOIN jobs j ON j.id = a.job_id
      LEFT JOIN recruiter_profiles rp ON rp.user_id = j.recruiter_id
      ${whereClause}
      ORDER BY a.applied_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    const dataRes = await query(dataSql, [...values, limit, offset]);

    return successResponse(
      res,
      dataRes.rows,
      'My applications fetched successfully',
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

const getApplicationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const appSql = `
      SELECT 
        a.*,
        j.title as job_title,
        j.description as job_description,
        j.location as job_location,
        j.employment_type,
        j.salary_min,
        j.salary_max,
        j.recruiter_id,
        u_cand.name as candidate_name,
        u_cand.email as candidate_email,
        cp.phone as candidate_phone,
        cp.location as candidate_location,
        cp.qualification,
        cp.university,
        cp.graduation_year,
        cp.experience_years,
        cp.bio as candidate_bio,
        cp.profile_photo_url as candidate_photo_url,
        rp.company_name,
        rp.company_logo_url,
        COALESCE(
          json_agg(DISTINCT jsonb_build_object('id', s.id, 'name', s.name)) 
          FILTER (WHERE s.id IS NOT NULL), '[]'
        ) as candidate_skills,
        (
          SELECT json_agg(
            json_build_object(
              'id', i.id,
              'scheduled_date', i.scheduled_date,
              'scheduled_time', i.scheduled_time,
              'mode', i.mode,
              'location', i.location,
              'meeting_link', i.meeting_link,
              'interviewer_notes', i.interviewer_notes,
              'status', i.status,
              'created_at', i.created_at
            )
          )
          FROM interviews i
          WHERE i.application_id = a.id
        ) as interviews
      FROM applications a
      JOIN jobs j ON j.id = a.job_id
      JOIN users u_cand ON u_cand.id = a.candidate_id
      LEFT JOIN candidate_profiles cp ON cp.user_id = a.candidate_id
      LEFT JOIN candidate_skills cs ON cs.candidate_id = a.candidate_id
      LEFT JOIN skills s ON s.id = cs.skill_id
      LEFT JOIN recruiter_profiles rp ON rp.user_id = j.recruiter_id
      WHERE a.id = $1
      GROUP BY a.id, j.id, u_cand.id, cp.id, rp.id
    `;

    const appRes = await query(appSql, [id]);
    if (appRes.rows.length === 0) {
      return errorResponse(res, 'Application not found', 404);
    }

    const application = appRes.rows[0];

    // Authorization check:
    // Candidate can view only own application.
    // Recruiter can view only applications for their own jobs.
    // Admin can view all.
    if (userRole === 'candidate' && application.candidate_id !== userId) {
      return errorResponse(res, 'Access denied', 403);
    }
    if (userRole === 'recruiter' && application.recruiter_id !== userId) {
      return errorResponse(res, 'Access denied', 403);
    }

    return successResponse(res, application, 'Application fetched successfully');
  } catch (error) {
    next(error);
  }
};

const updateApplicationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const appCheck = await query(
      `SELECT a.*, j.title as job_title, j.recruiter_id, u_cand.name as candidate_name
       FROM applications a
       JOIN jobs j ON j.id = a.job_id
       JOIN users u_cand ON u_cand.id = a.candidate_id
       WHERE a.id = $1`,
      [id]
    );

    if (appCheck.rows.length === 0) {
      return errorResponse(res, 'Application not found', 404);
    }

    const app = appCheck.rows[0];

    // Recruiter must own the job unless admin
    if (userRole !== 'admin' && app.recruiter_id !== userId) {
      return errorResponse(res, 'You are not authorized to manage this application', 403);
    }

    const updateRes = await query(
      `UPDATE applications SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [status, id]
    );

    // Format human-readable status text
    const statusTitles = {
      under_review: 'Under Review',
      shortlisted: 'Shortlisted 🎉',
      interview_scheduled: 'Interview Scheduled',
      selected: 'Selected / Offer Extended 🎊',
      rejected: 'Application Not Selected',
      withdrawn: 'Withdrawn'
    };

    const statusTitle = statusTitles[status] || status;

    // Send candidate notification
    await createNotification(
      app.candidate_id,
      `Application Status Update: ${statusTitle}`,
      `Your application for "${app.job_title}" has been updated to "${status.replace('_', ' ')}".`,
      status === 'shortlisted' ? 'CANDIDATE_SHORTLISTED' : 'STATUS_CHANGED'
    );

    await auditLog(userId, 'APPLICATION_STATUS_UPDATED', 'application', id, {
      old_status: app.status,
      new_status: status
    });

    return successResponse(res, updateRes.rows[0], `Application status updated to ${status}`);
  } catch (error) {
    next(error);
  }
};

const withdrawApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const candidateId = req.user.id;

    const appCheck = await query(
      `SELECT a.*, j.title as job_title, j.recruiter_id
       FROM applications a
       JOIN jobs j ON j.id = a.job_id
       WHERE a.id = $1 AND a.candidate_id = $2`,
      [id, candidateId]
    );

    if (appCheck.rows.length === 0) {
      return errorResponse(res, 'Application not found or unauthorized', 404);
    }

    const app = appCheck.rows[0];
    if (['selected', 'rejected', 'withdrawn'].includes(app.status)) {
      return errorResponse(res, `Cannot withdraw an application that is already ${app.status}`, 400);
    }

    const updateRes = await query(
      `UPDATE applications SET status = 'withdrawn', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id]
    );

    // Notify recruiter
    await createNotification(
      app.recruiter_id,
      'Application Withdrawn',
      `A candidate has withdrawn their application for "${app.job_title}".`,
      'APPLICATION_WITHDRAWN'
    );

    await auditLog(candidateId, 'APPLICATION_WITHDRAWN', 'application', id);

    return successResponse(res, updateRes.rows[0], 'Application withdrawn successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  applyForJob,
  getMyApplications,
  getApplicationById,
  updateApplicationStatus,
  withdrawApplication
};
