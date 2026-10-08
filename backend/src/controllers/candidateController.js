const path = require('path');
const fs = require('fs');
const { query } = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');
const { auditLog } = require('../utils/auditLogger');

// Helper to calculate candidate profile completion
const calculateProfileCompletion = (profile, skills = []) => {
  const sections = [
    { name: 'Phone number', check: Boolean(profile.phone) },
    { name: 'Location', check: Boolean(profile.location) },
    { name: 'Highest Qualification', check: Boolean(profile.qualification) },
    { name: 'University / College', check: Boolean(profile.university) },
    { name: 'Graduation Year', check: Boolean(profile.graduation_year) },
    { name: 'Professional Bio', check: Boolean(profile.bio && profile.bio.trim().length > 10) },
    { name: 'Resume', check: Boolean(profile.resume_url) },
    { name: 'Profile Photo', check: Boolean(profile.profile_photo_url) },
    { name: 'At least 2 skills', check: skills.length >= 2 }
  ];

  const completed = sections.filter((s) => s.check).length;
  const percentage = Math.round((completed / sections.length) * 100);
  const missing = sections.filter((s) => !s.check).map((s) => s.name);

  return { percentage, missing };
};

const getCandidateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const profileRes = await query(
      `SELECT cp.*, u.name, u.email, u.created_at as member_since
       FROM candidate_profiles cp
       JOIN users u ON u.id = cp.user_id
       WHERE cp.user_id = $1`,
      [userId]
    );

    if (profileRes.rows.length === 0) {
      return errorResponse(res, 'Candidate profile not found', 404);
    }

    const profile = profileRes.rows[0];

    // Fetch skills
    const skillsRes = await query(
      `SELECT s.id, s.name
       FROM candidate_skills cs
       JOIN skills s ON s.id = cs.skill_id
       WHERE cs.candidate_id = $1`,
      [userId]
    );

    const skills = skillsRes.rows;
    const completion = calculateProfileCompletion(profile, skills);

    return successResponse(res, {
      ...profile,
      skills,
      completion
    });
  } catch (error) {
    next(error);
  }
};

const updateCandidateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      name,
      phone,
      date_of_birth,
      gender,
      location,
      qualification,
      university,
      graduation_year,
      experience_years,
      bio,
      skills = []
    } = req.body;

    // Update user name if changed
    if (name) {
      await query('UPDATE users SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [
        name,
        userId
      ]);
    }

    const updateSql = `
      INSERT INTO candidate_profiles (
        user_id, phone, date_of_birth, gender, location, qualification,
        university, graduation_year, experience_years, bio, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id) DO UPDATE SET
        phone = COALESCE(EXCLUDED.phone, candidate_profiles.phone),
        date_of_birth = COALESCE(EXCLUDED.date_of_birth, candidate_profiles.date_of_birth),
        gender = COALESCE(EXCLUDED.gender, candidate_profiles.gender),
        location = COALESCE(EXCLUDED.location, candidate_profiles.location),
        qualification = COALESCE(EXCLUDED.qualification, candidate_profiles.qualification),
        university = COALESCE(EXCLUDED.university, candidate_profiles.university),
        graduation_year = COALESCE(EXCLUDED.graduation_year, candidate_profiles.graduation_year),
        experience_years = COALESCE(EXCLUDED.experience_years, candidate_profiles.experience_years),
        bio = COALESCE(EXCLUDED.bio, candidate_profiles.bio),
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const profileRes = await query(updateSql, [
      userId,
      phone || null,
      date_of_birth || null,
      gender || null,
      location || null,
      qualification || null,
      university || null,
      graduation_year || null,
      experience_years !== undefined && experience_years !== '' ? experience_years : 0,
      bio || null
    ]);

    // Update candidate skills if provided
    if (Array.isArray(skills)) {
      await query('DELETE FROM candidate_skills WHERE candidate_id = $1', [userId]);

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

        await query(
          `INSERT INTO candidate_skills (candidate_id, skill_id)
           VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [userId, skillId]
        );
      }
    }

    await auditLog(userId, 'CANDIDATE_PROFILE_UPDATED', 'candidate_profile', profileRes.rows[0].id);

    return successResponse(res, profileRes.rows[0], 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

const uploadResumeHandler = async (req, res, next) => {
  try {
    const userId = req.user.id;
    if (!req.file) {
      return errorResponse(res, 'No file uploaded', 400);
    }

    const resumeUrl = `/uploads/resumes/${req.file.filename}`;

    // Get old resume to clean up if exists
    const oldRes = await query('SELECT resume_url FROM candidate_profiles WHERE user_id = $1', [
      userId
    ]);
    if (oldRes.rows.length > 0 && oldRes.rows[0].resume_url) {
      const oldPath = path.join(__dirname, '../../', oldRes.rows[0].resume_url);
      if (fs.existsSync(oldPath)) {
        try {
          fs.unlinkSync(oldPath);
        } catch (e) {
          // non blocking
        }
      }
    }

    await query(
      `INSERT INTO candidate_profiles (user_id, resume_url)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET resume_url = $2, updated_at = CURRENT_TIMESTAMP`,
      [userId, resumeUrl]
    );

    await auditLog(userId, 'RESUME_UPLOADED', 'candidate_profile', userId, {
      filename: req.file.filename,
      size: req.file.size
    });

    return successResponse(
      res,
      { resume_url: resumeUrl, filename: req.file.originalname },
      'Resume uploaded successfully'
    );
  } catch (error) {
    next(error);
  }
};

const uploadPhotoHandler = async (req, res, next) => {
  try {
    const userId = req.user.id;
    if (!req.file) {
      return errorResponse(res, 'No file uploaded', 400);
    }

    const photoUrl = `/uploads/photos/${req.file.filename}`;

    await query(
      `INSERT INTO candidate_profiles (user_id, profile_photo_url)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET profile_photo_url = $2, updated_at = CURRENT_TIMESTAMP`,
      [userId, photoUrl]
    );

    await auditLog(userId, 'PROFILE_PHOTO_UPLOADED', 'candidate_profile', userId);

    return successResponse(
      res,
      { profile_photo_url: photoUrl },
      'Profile photo uploaded successfully'
    );
  } catch (error) {
    next(error);
  }
};

const getCandidateById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const profileRes = await query(
      `SELECT cp.*, u.name, u.email, u.created_at as member_since
       FROM candidate_profiles cp
       JOIN users u ON u.id = cp.user_id
       WHERE cp.user_id = $1`,
      [id]
    );

    if (profileRes.rows.length === 0) {
      return errorResponse(res, 'Candidate profile not found', 404);
    }

    const profile = profileRes.rows[0];

    const skillsRes = await query(
      `SELECT s.id, s.name
       FROM candidate_skills cs
       JOIN skills s ON s.id = cs.skill_id
       WHERE cs.candidate_id = $1`,
      [id]
    );

    return successResponse(res, {
      ...profile,
      skills: skillsRes.rows
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCandidateProfile,
  updateCandidateProfile,
  uploadResumeHandler,
  uploadPhotoHandler,
  getCandidateById
};
