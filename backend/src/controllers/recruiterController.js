const path = require('path');
const fs = require('fs');
const { query } = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');
const { auditLog } = require('../utils/auditLogger');

const getRecruiterProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const profileRes = await query(
      `SELECT rp.*, u.name, u.email, u.created_at as member_since
       FROM recruiter_profiles rp
       JOIN users u ON u.id = rp.user_id
       WHERE rp.user_id = $1`,
      [userId]
    );

    if (profileRes.rows.length === 0) {
      return errorResponse(res, 'Recruiter profile not found', 404);
    }

    return successResponse(res, profileRes.rows[0]);
  } catch (error) {
    next(error);
  }
};

const updateRecruiterProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      name,
      company_name,
      company_description,
      company_website,
      designation,
      phone
    } = req.body;

    if (name) {
      await query('UPDATE users SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [
        name,
        userId
      ]);
    }

    const updateSql = `
      INSERT INTO recruiter_profiles (
        user_id, company_name, company_description, company_website,
        designation, phone, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id) DO UPDATE SET
        company_name = COALESCE(EXCLUDED.company_name, recruiter_profiles.company_name),
        company_description = COALESCE(EXCLUDED.company_description, recruiter_profiles.company_description),
        company_website = COALESCE(EXCLUDED.company_website, recruiter_profiles.company_website),
        designation = COALESCE(EXCLUDED.designation, recruiter_profiles.designation),
        phone = COALESCE(EXCLUDED.phone, recruiter_profiles.phone),
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const profileRes = await query(updateSql, [
      userId,
      company_name || 'My Company',
      company_description || null,
      company_website || null,
      designation || null,
      phone || null
    ]);

    await auditLog(userId, 'RECRUITER_PROFILE_UPDATED', 'recruiter_profile', profileRes.rows[0].id);

    return successResponse(res, profileRes.rows[0], 'Company profile updated successfully');
  } catch (error) {
    next(error);
  }
};

const uploadCompanyLogo = async (req, res, next) => {
  try {
    const userId = req.user.id;
    if (!req.file) {
      return errorResponse(res, 'No logo file provided', 400);
    }

    const logoUrl = `/uploads/logos/${req.file.filename}`;

    await query(
      `INSERT INTO recruiter_profiles (user_id, company_logo_url, company_name)
       VALUES ($1, $2, 'Company')
       ON CONFLICT (user_id) DO UPDATE SET
         company_logo_url = $2, updated_at = CURRENT_TIMESTAMP`,
      [userId, logoUrl]
    );

    await auditLog(userId, 'COMPANY_LOGO_UPLOADED', 'recruiter_profile', userId);

    return successResponse(res, { company_logo_url: logoUrl }, 'Company logo uploaded successfully');
  } catch (error) {
    next(error);
  }
};

const getRecruiterJobs = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;
    const { status, search } = req.query;

    const conditions = ['j.recruiter_id = $1'];
    const values = [userId];
    let paramIndex = 2;

    if (status) {
      conditions.push(`j.status = $${paramIndex++}`);
      values.push(status);
    }

    if (search) {
      conditions.push(`(j.title ILIKE $${paramIndex} OR j.location ILIKE $${paramIndex})`);
      values.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const countSql = `SELECT COUNT(*)::int as total FROM jobs j ${whereClause}`;
    const countRes = await query(countSql, values);
    const total = countRes.rows[0].total;

    const dataSql = `
      SELECT 
        j.*,
        COALESCE(
          json_agg(DISTINCT jsonb_build_object('id', s.id, 'name', s.name)) 
          FILTER (WHERE s.id IS NOT NULL), '[]'
        ) as skills,
        (SELECT COUNT(*)::int FROM applications a WHERE a.job_id = j.id) as total_applications,
        (SELECT COUNT(*)::int FROM applications a WHERE a.job_id = j.id AND a.status = 'shortlisted') as shortlisted_count,
        (SELECT COUNT(*)::int FROM applications a WHERE a.job_id = j.id AND a.status = 'selected') as selected_count
      FROM jobs j
      LEFT JOIN job_skills js ON js.job_id = j.id
      LEFT JOIN skills s ON s.id = js.skill_id
      ${whereClause}
      GROUP BY j.id
      ORDER BY j.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    const dataRes = await query(dataSql, [...values, limit, offset]);

    return successResponse(
      res,
      dataRes.rows,
      'Recruiter jobs fetched successfully',
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

const getRecruiterApplications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;

    const { job_id, status, search } = req.query;

    const conditions = ['j.recruiter_id = $1'];
    const values = [userId];
    let paramIndex = 2;

    if (job_id) {
      conditions.push(`a.job_id = $${paramIndex++}`);
      values.push(parseInt(job_id, 10));
    }

    if (status) {
      conditions.push(`a.status = $${paramIndex++}`);
      values.push(status);
    }

    if (search) {
      conditions.push(`(u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR j.title ILIKE $${paramIndex})`);
      values.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const countSql = `
      SELECT COUNT(DISTINCT a.id)::int as total
      FROM applications a
      JOIN jobs j ON j.id = a.job_id
      JOIN users u ON u.id = a.candidate_id
      ${whereClause}
    `;
    const countRes = await query(countSql, values);
    const total = countRes.rows[0].total;

    const dataSql = `
      SELECT 
        a.*,
        j.title as job_title,
        j.location as job_location,
        j.status as job_status,
        u.name as candidate_name,
        u.email as candidate_email,
        cp.phone as candidate_phone,
        cp.experience_years as candidate_experience,
        cp.qualification as candidate_qualification,
        cp.location as candidate_location,
        cp.profile_photo_url as candidate_photo_url,
        (
          SELECT json_build_object(
            'id', i.id,
            'scheduled_date', i.scheduled_date,
            'scheduled_time', i.scheduled_time,
            'mode', i.mode,
            'status', i.status,
            'meeting_link', i.meeting_link
          )
          FROM interviews i
          WHERE i.application_id = a.id
          ORDER BY i.created_at DESC
          LIMIT 1
        ) as latest_interview
      FROM applications a
      JOIN jobs j ON j.id = a.job_id
      JOIN users u ON u.id = a.candidate_id
      LEFT JOIN candidate_profiles cp ON cp.user_id = a.candidate_id
      ${whereClause}
      ORDER BY a.applied_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    const dataRes = await query(dataSql, [...values, limit, offset]);

    return successResponse(
      res,
      dataRes.rows,
      'Recruiter applications fetched successfully',
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

const getRecruiterStatistics = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Overview KPIs
    const kpiSql = `
      SELECT 
        (SELECT COUNT(*)::int FROM jobs WHERE recruiter_id = $1) as total_jobs,
        (SELECT COUNT(*)::int FROM jobs WHERE recruiter_id = $1 AND status = 'published') as active_jobs,
        (SELECT COUNT(*)::int FROM applications a JOIN jobs j ON j.id = a.job_id WHERE j.recruiter_id = $1) as total_applications,
        (SELECT COUNT(*)::int FROM applications a JOIN jobs j ON j.id = a.job_id WHERE j.recruiter_id = $1 AND a.status = 'shortlisted') as shortlisted_count,
        (SELECT COUNT(*)::int FROM applications a JOIN jobs j ON j.id = a.job_id WHERE j.recruiter_id = $1 AND a.status = 'selected') as selected_count,
        (
          SELECT COUNT(*)::int FROM interviews i
          JOIN applications a ON a.id = i.application_id
          JOIN jobs j ON j.id = a.job_id
          WHERE j.recruiter_id = $1 AND i.status = 'scheduled'
        ) as upcoming_interviews
    `;
    const kpiRes = await query(kpiSql, [userId]);
    const overview = kpiRes.rows[0];

    // Status breakdown chart data
    const statusSql = `
      SELECT a.status, COUNT(*)::int as count
      FROM applications a
      JOIN jobs j ON j.id = a.job_id
      WHERE j.recruiter_id = $1
      GROUP BY a.status
    `;
    const statusRes = await query(statusSql, [userId]);

    // Applications per job chart data
    const perJobSql = `
      SELECT j.id, j.title, COUNT(a.id)::int as count
      FROM jobs j
      LEFT JOIN applications a ON a.job_id = j.id
      WHERE j.recruiter_id = $1
      GROUP BY j.id, j.title
      ORDER BY count DESC
      LIMIT 8
    `;
    const perJobRes = await query(perJobSql, [userId]);

    // Monthly applications timeline (last 6 months)
    const monthlySql = `
      SELECT TO_CHAR(a.applied_at, 'Mon YYYY') as month,
             DATE_TRUNC('month', a.applied_at) as sort_month,
             COUNT(*)::int as count
      FROM applications a
      JOIN jobs j ON j.id = a.job_id
      WHERE j.recruiter_id = $1 AND a.applied_at >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY TO_CHAR(a.applied_at, 'Mon YYYY'), DATE_TRUNC('month', a.applied_at)
      ORDER BY sort_month ASC
    `;
    const monthlyRes = await query(monthlySql, [userId]);

    // Recent applications
    const recentSql = `
      SELECT 
        a.id, a.status, a.applied_at, a.resume_url,
        j.title as job_title,
        u.name as candidate_name, u.email as candidate_email,
        cp.experience_years
      FROM applications a
      JOIN jobs j ON j.id = a.job_id
      JOIN users u ON u.id = a.candidate_id
      LEFT JOIN candidate_profiles cp ON cp.user_id = a.candidate_id
      WHERE j.recruiter_id = $1
      ORDER BY a.applied_at DESC
      LIMIT 5
    `;
    const recentRes = await query(recentSql, [userId]);

    return successResponse(res, {
      overview,
      charts: {
        applicationsByStatus: statusRes.rows,
        applicationsPerJob: perJobRes.rows,
        monthlyApplications: monthlyRes.rows
      },
      recentApplications: recentRes.rows
    });
  } catch (error) {
    next(error);
  }
};

const downloadResume = async (req, res, next) => {
  try {
    const { filename } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Sanitize filename to prevent directory traversal
    const safeFilename = path.basename(filename);
    const resumePath = path.join(__dirname, '../../uploads/resumes', safeFilename);

    if (!fs.existsSync(resumePath)) {
      return errorResponse(res, 'Requested resume file not found', 404);
    }

    // Verify authorized access:
    // Admin has access
    // Candidate can download if it's their own resume
    // Recruiter can download if applicant applied to recruiter's job
    if (userRole === 'admin') {
      return res.download(resumePath);
    }

    const checkSql = `
      SELECT a.id FROM applications a
      JOIN jobs j ON j.id = a.job_id
      WHERE (a.candidate_id = $1 OR j.recruiter_id = $1)
        AND a.resume_url LIKE $2
      LIMIT 1
    `;
    const checkRes = await query(checkSql, [userId, `%${safeFilename}`]);

    if (checkRes.rows.length === 0) {
      // Check candidate profile
      const profCheck = await query(
        'SELECT id FROM candidate_profiles WHERE user_id = $1 AND resume_url LIKE $2',
        [userId, `%${safeFilename}`]
      );
      if (profCheck.rows.length === 0) {
        return errorResponse(res, 'Access to this resume is unauthorized', 403);
      }
    }

    return res.download(resumePath);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRecruiterProfile,
  updateRecruiterProfile,
  uploadCompanyLogo,
  getRecruiterJobs,
  getRecruiterApplications,
  getRecruiterStatistics,
  downloadResume
};
