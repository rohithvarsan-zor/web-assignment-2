const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');

test('Backend API Automated Test Suite', async (t) => {
  let adminToken = '';
  let recruiterToken = '';
  let candidateToken = '';
  let candidateId = null;
  let testJobId = null;
  let testApplicationId = null;

  await t.test('1. Authentication - Login Admin', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'Admin@123'
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.token);
    assert.equal(res.body.data.user.role, 'admin');
    adminToken = res.body.data.token;
  });

  await t.test('2. Authentication - Login Recruiter', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'recruiter@example.com',
        password: 'Recruiter@123'
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.token);
    assert.equal(res.body.data.user.role, 'recruiter');
    recruiterToken = res.body.data.token;
  });

  await t.test('3. Authentication - Register New Candidate', async () => {
    const uniqueEmail = `testcand_${Date.now()}@testrms.com`;
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Automated Candidate',
        email: uniqueEmail,
        password: 'Password@123',
        role: 'candidate'
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.token);
    assert.equal(res.body.data.user.role, 'candidate');
    candidateToken = res.body.data.token;
    candidateId = res.body.data.user.id;
  });

  await t.test('4. Authentication - Reject Invalid Password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'WrongPassword'
      });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  await t.test('5. Auth Middleware - Fetch /api/auth/me', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${candidateToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.id, candidateId);
  });

  await t.test('6. Public Job Retrieval & Filtering', async () => {
    const res = await request(app)
      .get('/api/jobs?page=1&limit=5&status=published');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.pagination);
    assert.ok(res.body.data.length > 0);
  });

  await t.test('7. Job Creation - Authorized Recruiter', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({
        title: 'Senior Systems Architect',
        description: 'Design resilient distributed messaging topologies.',
        location: 'Remote',
        employment_type: 'Full-time',
        experience_required: '5+ years',
        salary_min: 150000,
        salary_max: 200000,
        status: 'published',
        skills: ['Node.js', 'PostgreSQL', 'Docker']
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.id);
    testJobId = res.body.data.id;
  });

  await t.test('8. Job Creation - Block Candidate (Authorization check)', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({
        title: 'Unauthorized Candidate Job',
        description: 'Should fail',
        location: 'Remote',
        employment_type: 'Full-time'
      });

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  await t.test('9. Candidate Profile Update with Skills', async () => {
    const res = await request(app)
      .put('/api/candidates/profile')
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({
        phone: '+1 555-019-2831',
        location: 'Austin, TX',
        qualification: 'B.S. in Computer Science',
        university: 'UT Austin',
        graduation_year: 2021,
        experience_years: 3.5,
        bio: 'Systems software developer with a focus on high reliability.',
        skills: ['Node.js', 'PostgreSQL', 'React.js']
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });

  await t.test('10. Job Application Creation', async () => {
    const res = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({
        job_id: testJobId,
        cover_letter: 'I have significant experience in distributed messaging systems.',
        resume_url: '/uploads/resumes/sample-alex-rivera-resume.pdf'
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.id);
    testApplicationId = res.body.data.id;
  });

  await t.test('11. Duplicate Job Application Prevention', async () => {
    const res = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({
        job_id: testJobId,
        cover_letter: 'Applying again',
        resume_url: '/uploads/resumes/sample-alex-rivera-resume.pdf'
      });

    assert.equal(res.status, 409);
    assert.equal(res.body.success, false);
  });

  await t.test('12. Application Status Update by Recruiter', async () => {
    const res = await request(app)
      .put(`/api/applications/${testApplicationId}/status`)
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({
        status: 'shortlisted'
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, 'shortlisted');
  });

  await t.test('13. Schedule Interview for Application', async () => {
    const res = await request(app)
      .post('/api/interviews')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({
        application_id: testApplicationId,
        scheduled_date: '2026-11-20',
        scheduled_time: '15:00:00',
        mode: 'online',
        meeting_link: 'https://meet.google.com/test-auto-interview',
        interviewer_notes: 'Discuss scalable architecture'
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.id);
  });

  await t.test('14. Candidate Notifications Retrieval', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${candidateToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data.notifications));
  });

  await t.test('15. Admin User Management & Audit Logs', async () => {
    const res = await request(app)
      .get('/api/admin/audit-logs?page=1&limit=5')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
  });

  await t.test('16. Unauthorized Access Rejection on Admin Route', async () => {
    const res = await request(app)
      .get('/api/admin/statistics')
      .set('Authorization', `Bearer ${candidateToken}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });
});
