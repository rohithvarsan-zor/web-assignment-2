const { query } = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');
const { auditLog } = require('../utils/auditLogger');
const { createNotification } = require('../services/notificationService');

const getJobs = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;

    const {
      search,
      location,
      employment_type,
      experience,
      salary_min,
      salary_max,
      skill,
      status,
      sortBy = 'newest'
    } = req.query;

    const conditions = [];
    const values = [];
    let paramIndex = 1;

    // Filter by status:
    // If not admin/recruiter asking for own jobs, default to 'published'
    if (status) {
      conditions.push(`j.status = $${paramIndex++}`);
      values.push(status);
    } else {
      conditions.push(`j.status = 'published'`);
    }

    if (search) {
      conditions.push(
        `(j.title ILIKE $${paramIndex} OR j.description ILIKE $${paramIndex} OR rp.company_name ILIKE $${paramIndex} OR j.location ILIKE $${paramIndex})`
      );
      values.push(`%${search}%`);
      paramIndex++;
    }

    if (location) {
      conditions.push(`j.location ILIKE $${paramIndex++}`);
      values.push(`%${location}%`);
    }

    if (employment_type) {
      conditions.push(`j.employment_type ILIKE $${paramIndex++}`);
      values.push(employment_type);
    }

    if (experience) {
      conditions.push(`j.experience_required ILIKE $${paramIndex++}`);
      values.push(`%${experience}%`);
    }

    if (salary_min) {
      conditions.push(`(j.salary_max IS NULL OR j.salary_max >= $${paramIndex++})`);
      values.push(Number(salary_min));
    }

    if (salary_max) {
      conditions.push(`(j.salary_min IS NULL OR j.salary_min <= $${paramIndex++})`);
      values.push(Number(salary_max));
    }

    if (skill) {
      conditions.push(`
        EXISTS (
          SELECT 1 FROM job_skills js
          JOIN skills s ON s.id = js.skill_id
          WHERE js.job_id = j.id AND s.name ILIKE $${paramIndex++}
        )
      `);
      values.push(`%${skill}%`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    let orderByClause = 'ORDER BY j.created_at DESC';
    if (sortBy === 'oldest') {
      orderByClause = 'ORDER BY j.created_at ASC';
    } else if (sortBy === 'salary' || sortBy === 'salary_desc') {
      orderByClause = 'ORDER BY COALESCE(j.salary_max, j.salary_min, 0) DESC';
    } else if (sortBy === 'salary_asc') {
      orderByClause = 'ORDER BY COALESCE(j.salary_min, j.salary_max, 0) ASC';
    } else if (sortBy === 'deadline') {
      orderByClause = 'ORDER BY j.application_deadline ASC NULLS LAST';
    }

    // Count query
    const countSql = `
      SELECT COUNT(DISTINCT j.id)::int as total
      FROM jobs j
      LEFT JOIN recruiter_profiles rp ON rp.user_id = j.recruiter_id
      ${whereClause}
    `;
    const countRes = await query(countSql, values);
    const total = countRes.rows[0].total;

    // Data query
    const dataSql = `
      SELECT 
        j.*,
        rp.company_name,
        rp.company_logo_url,
        rp.company_website,
        u.name as recruiter_name,
        COALESCE(
          json_agg(DISTINCT jsonb_build_object('id', s.id, 'name', s.name)) 
          FILTER (WHERE s.id IS NOT NULL), '[]'
        ) as skills,
        (SELECT COUNT(*)::int FROM applications a WHERE a.job_id = j.id) as applications_count
      FROM jobs j
      LEFT JOIN recruiter_profiles rp ON rp.user_id = j.recruiter_id
      LEFT JOIN users u ON u.id = j.recruiter_id
      LEFT JOIN job_skills js ON js.job_id = j.id
      LEFT JOIN skills s ON s.id = js.skill_id
      ${whereClause}
      GROUP BY j.id, rp.company_name, rp.company_logo_url, rp.company_website, u.name
      ${orderByClause}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    const dataRes = await query(dataSql, [...values, limit, offset]);

    return successResponse(
      res,
      dataRes.rows,
      'Jobs fetched successfully',
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

const getJobById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user.id : null;

    const jobSql = `
      SELECT 
        j.*,
        rp.company_name,
        rp.company_description,
        rp.company_website,
        rp.company_logo_url,
        rp.phone as company_phone,
        u.name as recruiter_name,
        u.email as recruiter_email,
        COALESCE(
          json_agg(DISTINCT jsonb_build_object('id', s.id, 'name', s.name)) 
          FILTER (WHERE s.id IS NOT NULL), '[]'
        ) as skills,
        (SELECT COUNT(*)::int FROM applications a WHERE a.job_id = j.id) as applications_count
      FROM jobs j
      LEFT JOIN recruiter_profiles rp ON rp.user_id = j.recruiter_id
      LEFT JOIN users u ON u.id = j.recruiter_id
      LEFT JOIN job_skills js ON js.job_id = j.id
      LEFT JOIN skills s ON s.id = js.skill_id
      WHERE j.id = $1
      GROUP BY j.id, rp.company_name, rp.company_description, rp.company_website, rp.company_logo_url, rp.phone, u.name, u.email
    `;

    const jobRes = await query(jobSql, [id]);
    if (jobRes.rows.length === 0) {
      return errorResponse(res, 'Job not found', 404);
    }

    const job = jobRes.rows[0];

    // If candidate is logged in, check if saved and applied
    let isSaved = false;
    let application = null;

    if (userId) {
      const savedRes = await query(
        'SELECT id FROM saved_jobs WHERE candidate_id = $1 AND job_id = $2',
        [userId, id]
      );
      isSaved = savedRes.rows.length > 0;

      const appRes = await query(
        'SELECT id, status, applied_at, resume_url FROM applications WHERE candidate_id = $1 AND job_id = $2',
        [userId, id]
      );
      if (appRes.rows.length > 0) {
        application = appRes.rows[0];
      }
    }

    return successResponse(res, {
      ...job,
      isSaved,
      hasApplied: Boolean(application),
      application
    });
  } catch (error) {
    next(error);
  }
};

const createJob = async (req, res, next) => {
  try {
    const recruiterId = req.user.id;
    const {
      title,
      description,
      location,
      employment_type,
      experience_required,
      salary_min,
      salary_max,
      application_deadline,
      status = 'draft',
      skills = []
    } = req.body;

    const jobInsertSql = `
      INSERT INTO jobs (
        recruiter_id, title, description, location, employment_type,
        experience_required, salary_min, salary_max, application_deadline, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const jobRes = await query(jobInsertSql, [
      recruiterId,
      title,
      description,
      location,
      employment_type,
      experience_required,
      salary_min || null,
      salary_max || null,
      application_deadline || null,
      status
    ]);

    const newJob = jobRes.rows[0];

    // Insert skills
    if (Array.isArray(skills) && skills.length > 0) {
      for (const skillName of skills) {
        const trimmed = typeof skillName === 'string' ? skillName.trim() : '';
        if (!trimmed) continue;

        // Upsert skill
        const skillRes = await query(
          `INSERT INTO skills (name) VALUES ($1)
           ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
           RETURNING id`,
          [trimmed]
        );
        const skillId = skillRes.rows[0].id;

        await query(
          `INSERT INTO job_skills (job_id, skill_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [newJob.id, skillId]
        );
      }
    }

    await auditLog(recruiterId, 'JOB_CREATED', 'job', newJob.id, { title, status });

    return successResponse(res, newJob, 'Job created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const existingJob = await query('SELECT * FROM jobs WHERE id = $1', [id]);
    if (existingJob.rows.length === 0) {
      return errorResponse(res, 'Job not found', 404);
    }

    const job = existingJob.rows[0];

    // Check authorization: must be creator recruiter or admin
    if (userRole !== 'admin' && job.recruiter_id !== userId) {
      return errorResponse(res, 'You are not authorized to update this job', 403);
    }

    const {
      title,
      description,
      location,
      employment_type,
      experience_required,
      salary_min,
      salary_max,
      application_deadline,
      status,
      skills
    } = req.body;

    const updateSql = `
      UPDATE jobs SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        location = COALESCE($3, location),
        employment_type = COALESCE($4, employment_type),
        experience_required = COALESCE($5, experience_required),
        salary_min = $6,
        salary_max = $7,
        application_deadline = $8,
        status = COALESCE($9, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING *
    `;

    const updatedRes = await query(updateSql, [
      title || null,
      description || null,
      location || null,
      employment_type || null,
      experience_required || null,
      salary_min !== undefined ? (salary_min || null) : job.salary_min,
      salary_max !== undefined ? (salary_max || null) : job.salary_max,
      application_deadline !== undefined ? (application_deadline || null) : job.application_deadline,
      status || null,
      id
    ]);

    // Update skills if provided
    if (Array.isArray(skills)) {
      await query('DELETE FROM job_skills WHERE job_id = $1', [id]);
      for (const skillName of skills) {
        const trimmed = typeof skillName === 'string' ? skillName.trim() : '';
        if (!trimmed) continue;

        const skillRes = await query(
          `INSERT INTO skills (name) VALUES ($1)
           ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
           RETURNING id`,
          [trimmed]
        );
        const skillId = skillRes.rows[0].id;
        await query('INSERT INTO job_skills (job_id, skill_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [
          id,
          skillId
        ]);
      }
    }

    await auditLog(userId, 'JOB_UPDATED', 'job', id, { title });

    return successResponse(res, updatedRes.rows[0], 'Job updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const existingJob = await query('SELECT * FROM jobs WHERE id = $1', [id]);
    if (existingJob.rows.length === 0) {
      return errorResponse(res, 'Job not found', 404);
    }

    const job = existingJob.rows[0];

    if (userRole !== 'admin' && job.recruiter_id !== userId) {
      return errorResponse(res, 'You are not authorized to delete this job', 403);
    }

    // Per requirements: Recruiter can delete draft jobs. Admin can delete any.
    if (userRole !== 'admin' && job.status !== 'draft') {
      return errorResponse(res, 'Only draft jobs can be deleted. Published or closed jobs should be closed or archived.', 400);
    }

    await query('DELETE FROM jobs WHERE id = $1', [id]);
    await auditLog(userId, 'JOB_DELETED', 'job', id, { title: job.title });

    return successResponse(res, null, 'Job deleted successfully');
  } catch (error) {
    next(error);
  }
};

const publishJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const existingJob = await query('SELECT * FROM jobs WHERE id = $1', [id]);
    if (existingJob.rows.length === 0) {
      return errorResponse(res, 'Job not found', 404);
    }

    const job = existingJob.rows[0];
    if (userRole !== 'admin' && job.recruiter_id !== userId) {
      return errorResponse(res, 'You are not authorized to publish this job', 403);
    }

    const updatedRes = await query(
      `UPDATE jobs SET status = 'published', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id]
    );

    await auditLog(userId, 'JOB_PUBLISHED', 'job', id, { title: job.title });

    return successResponse(res, updatedRes.rows[0], 'Job published successfully');
  } catch (error) {
    next(error);
  }
};

const closeJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const existingJob = await query('SELECT * FROM jobs WHERE id = $1', [id]);
    if (existingJob.rows.length === 0) {
      return errorResponse(res, 'Job not found', 404);
    }

    const job = existingJob.rows[0];
    if (userRole !== 'admin' && job.recruiter_id !== userId) {
      return errorResponse(res, 'You are not authorized to close this job', 403);
    }

    const updatedRes = await query(
      `UPDATE jobs SET status = 'closed', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id]
    );

    // Notify candidate applicants that the job has closed
    const applicants = await query('SELECT candidate_id FROM applications WHERE job_id = $1', [id]);
    for (const app of applicants.rows) {
      await createNotification(
        app.candidate_id,
        'Job Posting Closed',
        `The job posting "${job.title}" has been closed by the recruiter.`,
        'JOB_CLOSED'
      );
    }

    await auditLog(userId, 'JOB_CLOSED', 'job', id, { title: job.title });

    return successResponse(res, updatedRes.rows[0], 'Job closed successfully');
  } catch (error) {
    next(error);
  }
};

const saveJob = async (req, res, next) => {
  try {
    const candidateId = req.user.id;
    const { id: jobId } = req.params;

    const jobCheck = await query('SELECT id, title FROM jobs WHERE id = $1', [jobId]);
    if (jobCheck.rows.length === 0) {
      return errorResponse(res, 'Job not found', 404);
    }

    await query(
      `INSERT INTO saved_jobs (candidate_id, job_id)
       VALUES ($1, $2)
       ON CONFLICT (candidate_id, job_id) DO NOTHING`,
      [candidateId, jobId]
    );

    await auditLog(candidateId, 'JOB_SAVED', 'job', jobId);

    return successResponse(res, null, 'Job saved successfully');
  } catch (error) {
    next(error);
  }
};

const unsaveJob = async (req, res, next) => {
  try {
    const candidateId = req.user.id;
    const { id: jobId } = req.params;

    await query(
      `DELETE FROM saved_jobs WHERE candidate_id = $1 AND job_id = $2`,
      [candidateId, jobId]
    );

    await auditLog(candidateId, 'JOB_UNSAVED', 'job', jobId);

    return successResponse(res, null, 'Job removed from saved jobs');
  } catch (error) {
    next(error);
  }
};

const getSavedJobs = async (req, res, next) => {
  try {
    const candidateId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;

    const countRes = await query(
      'SELECT COUNT(*)::int as total FROM saved_jobs WHERE candidate_id = $1',
      [candidateId]
    );
    const total = countRes.rows[0].total;

    const jobsSql = `
      SELECT 
        j.*,
        rp.company_name,
        rp.company_logo_url,
        sj.created_at as saved_at,
        COALESCE(
          json_agg(DISTINCT jsonb_build_object('id', s.id, 'name', s.name)) 
          FILTER (WHERE s.id IS NOT NULL), '[]'
        ) as skills
      FROM saved_jobs sj
      JOIN jobs j ON j.id = sj.job_id
      LEFT JOIN recruiter_profiles rp ON rp.user_id = j.recruiter_id
      LEFT JOIN job_skills js ON js.job_id = j.id
      LEFT JOIN skills s ON s.id = js.skill_id
      WHERE sj.candidate_id = $1
      GROUP BY j.id, rp.company_name, rp.company_logo_url, sj.created_at
      ORDER BY sj.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const dataRes = await query(jobsSql, [candidateId, limit, offset]);

    return successResponse(
      res,
      dataRes.rows,
      'Saved jobs fetched successfully',
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

module.exports = {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  publishJob,
  closeJob,
  saveJob,
  unsaveJob,
  getSavedJobs
};
