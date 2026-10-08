const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function seed() {
  console.log('--- Seeding Recruitment Management System Database ---');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Clean existing records in cascade
    console.log('Clearing old data...');
    await client.query(`
      TRUNCATE TABLE 
        audit_logs,
        saved_jobs,
        candidate_skills,
        job_skills,
        skills,
        notifications,
        interviews,
        applications,
        jobs,
        recruiter_profiles,
        candidate_profiles,
        users
      RESTART IDENTITY CASCADE;
    `);

    // 2. Prepare passwords
    const adminPassHash = await bcrypt.hash('Admin@123', 10);
    const recruiterPassHash = await bcrypt.hash('Recruiter@123', 10);
    const candidatePassHash = await bcrypt.hash('Candidate@123', 10);

    // 3. Insert Skills
    console.log('Inserting skills...');
    const skillsList = [
      'JavaScript', 'TypeScript', 'React.js', 'Node.js', 'Express.js',
      'PostgreSQL', 'MongoDB', 'Python', 'Docker', 'Kubernetes',
      'AWS', 'GraphQL', 'Tailwind CSS', 'Next.js', 'Redis',
      'Git', 'CI/CD', 'REST APIs', 'System Design', 'UI/UX Design',
      'Agile / Scrum', 'Linux', 'Microservices', 'Jest'
    ];

    const skillIdMap = {};
    for (const name of skillsList) {
      const res = await client.query(
        'INSERT INTO skills (name) VALUES ($1) RETURNING id, name',
        [name]
      );
      skillIdMap[name] = res.rows[0].id;
    }

    // 4. Insert Admin
    console.log('Inserting Admin user...');
    const adminRes = await client.query(
      `INSERT INTO users (name, email, password_hash, role, is_active)
       VALUES ($1, $2, $3, 'admin', TRUE) RETURNING id`,
      ['Platform Administrator', 'admin@example.com', adminPassHash]
    );
    const adminId = adminRes.rows[0].id;

    // 5. Insert 3 Recruiters
    console.log('Inserting Recruiters...');
    const recruitersData = [
      {
        name: 'Sarah Jenkins',
        email: 'recruiter@example.com',
        company_name: 'Apex Global Tech',
        company_description: 'Apex Global Tech builds world-class enterprise SaaS solutions powering high-frequency data applications across Fortune 500 companies.',
        company_website: 'https://apextech.io',
        designation: 'Senior Talent Acquisition Lead',
        phone: '+1 415-555-0199',
        company_logo_url: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=128&auto=format&fit=crop&q=80'
      },
      {
        name: 'Marcus Vance',
        email: 'techrecruiter@example.com',
        company_name: 'CloudScale Infrastructure',
        company_description: 'Next-generation cloud optimization and distributed server mesh technology designed for developer velocity.',
        company_website: 'https://cloudscale.net',
        designation: 'Director of People & Talent',
        phone: '+1 212-555-0143',
        company_logo_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=128&auto=format&fit=crop&q=80'
      },
      {
        name: 'Elena Rostova',
        email: 'hiring@innovate.io',
        company_name: 'Innovate AI Labs',
        company_description: 'Pushing boundaries in foundation model fine-tuning, retrieval systems, and intelligent agent workflows.',
        company_website: 'https://innovate.io',
        designation: 'Head of Technical Recruiting',
        phone: '+1 650-555-0188',
        company_logo_url: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=128&auto=format&fit=crop&q=80'
      }
    ];

    const recruiterIds = [];
    for (const rec of recruitersData) {
      const uRes = await client.query(
        `INSERT INTO users (name, email, password_hash, role, is_active)
         VALUES ($1, $2, $3, 'recruiter', TRUE) RETURNING id`,
        [rec.name, rec.email, recruiterPassHash]
      );
      const rId = uRes.rows[0].id;
      recruiterIds.push(rId);

      await client.query(
        `INSERT INTO recruiter_profiles (
          user_id, company_name, company_description, company_website,
          designation, phone, company_logo_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          rId,
          rec.company_name,
          rec.company_description,
          rec.company_website,
          rec.designation,
          rec.phone,
          rec.company_logo_url
        ]
      );
    }

    // 6. Insert 8 Candidates
    console.log('Inserting 8 Candidates...');
    const candidatesData = [
      {
        name: 'Alex Rivera',
        email: 'candidate@example.com',
        phone: '+1 415-555-7821',
        date_of_birth: '1998-05-14',
        gender: 'Male',
        location: 'San Francisco, CA',
        qualification: 'Bachelor of Science in Computer Science',
        university: 'UC Berkeley',
        graduation_year: 2020,
        experience_years: 4.5,
        bio: 'Senior full-stack engineer passionate about high-throughput distributed systems, React interfaces, and developer-first APIs.',
        skills: ['React.js', 'Node.js', 'PostgreSQL', 'TypeScript', 'Docker', 'REST APIs'],
        resume_url: '/uploads/resumes/sample-alex-rivera-resume.pdf',
        profile_photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&auto=format&fit=crop&q=80'
      },
      {
        name: 'Priya Sharma',
        email: 'priya.sharma@example.com',
        phone: '+91 98765-43210',
        date_of_birth: '1997-11-22',
        gender: 'Female',
        location: 'Bangalore, India',
        qualification: 'Master of Technology in Software Systems',
        university: 'BITS Pilani',
        graduation_year: 2021,
        experience_years: 5.0,
        bio: 'Backend specialist with extensive expertise in PostgreSQL optimization, microservices, and asynchronous event streams.',
        skills: ['Node.js', 'PostgreSQL', 'Redis', 'Docker', 'Microservices', 'Git'],
        resume_url: '/uploads/resumes/sample-priya-sharma-resume.pdf',
        profile_photo_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=256&auto=format&fit=crop&q=80'
      },
      {
        name: 'David Kim',
        email: 'david.kim@example.com',
        phone: '+1 206-555-0912',
        date_of_birth: '1996-03-08',
        gender: 'Male',
        location: 'Seattle, WA',
        qualification: 'Bachelor of Science in Software Engineering',
        university: 'University of Washington',
        graduation_year: 2018,
        experience_years: 6.0,
        bio: 'DevOps & Cloud Engineer specializing in Kubernetes cluster orchestration, Terraform IaC, and reliable CI/CD pipelines.',
        skills: ['Docker', 'Kubernetes', 'AWS', 'Linux', 'CI/CD', 'Python'],
        resume_url: '/uploads/resumes/sample-david-kim-resume.pdf',
        profile_photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&auto=format&fit=crop&q=80'
      },
      {
        name: 'Sophia Chen',
        email: 'sophia.chen@example.com',
        phone: '+1 646-555-3344',
        date_of_birth: '1999-07-19',
        gender: 'Female',
        location: 'New York, NY',
        qualification: 'Bachelor of Fine Arts in Interaction Design',
        university: 'Rhode Island School of Design',
        graduation_year: 2021,
        experience_years: 3.5,
        bio: 'Product and UI/UX Designer dedicated to accessible web interfaces, human-centered design systems, and rapid prototyping.',
        skills: ['UI/UX Design', 'Tailwind CSS', 'React.js', 'TypeScript'],
        resume_url: '/uploads/resumes/sample-sophia-chen-resume.pdf',
        profile_photo_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=256&auto=format&fit=crop&q=80'
      },
      {
        name: 'Liam O’Connor',
        email: 'liam.oconnor@example.com',
        phone: '+353 1 496 0000',
        date_of_birth: '1995-09-30',
        gender: 'Male',
        location: 'Dublin, Ireland',
        qualification: 'Master of Science in Artificial Intelligence',
        university: 'Trinity College Dublin',
        graduation_year: 2019,
        experience_years: 5.5,
        bio: 'Machine learning practitioner and Python backend engineer building vector search pipelines and scalable data ingestion.',
        skills: ['Python', 'PostgreSQL', 'Docker', 'REST APIs', 'System Design'],
        resume_url: '/uploads/resumes/sample-liam-oconnor-resume.pdf',
        profile_photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&auto=format&fit=crop&q=80'
      },
      {
        name: 'Amara Okafor',
        email: 'amara.okafor@example.com',
        phone: '+234 802 123 4567',
        date_of_birth: '1998-01-15',
        gender: 'Female',
        location: 'Lagos, Nigeria',
        qualification: 'Bachelor of Science in Computer Science',
        university: 'University of Lagos',
        graduation_year: 2020,
        experience_years: 4.0,
        bio: 'Frontend architect crafting high-performance web applications with React, Next.js, and state-of-the-art animations.',
        skills: ['React.js', 'TypeScript', 'Next.js', 'Tailwind CSS', 'Jest'],
        resume_url: '/uploads/resumes/sample-amara-okafor-resume.pdf',
        profile_photo_url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=256&auto=format&fit=crop&q=80'
      },
      {
        name: 'Lucas Silva',
        email: 'lucas.silva@example.com',
        phone: '+55 11 98765-1122',
        date_of_birth: '1996-12-05',
        gender: 'Male',
        location: 'São Paulo, Brazil',
        qualification: 'Bachelor in Information Systems',
        university: 'University of São Paulo',
        graduation_year: 2019,
        experience_years: 5.0,
        bio: 'Quality engineering enthusiast specializing in end-to-end automated testing, load resilience, and contract testing.',
        skills: ['Jest', 'JavaScript', 'Node.js', 'CI/CD', 'REST APIs'],
        resume_url: '/uploads/resumes/sample-lucas-silva-resume.pdf',
        profile_photo_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=256&auto=format&fit=crop&q=80'
      },
      {
        name: 'Emma Watson',
        email: 'emma.watson@example.com',
        phone: '+44 20 7946 0912',
        date_of_birth: '1997-04-18',
        gender: 'Female',
        location: 'London, UK',
        qualification: 'Master of Science in Software Engineering',
        university: 'Imperial College London',
        graduation_year: 2020,
        experience_years: 4.0,
        bio: 'Full stack developer focused on Node.js microservices, GraphQL gateways, and scalable React design systems.',
        skills: ['GraphQL', 'Node.js', 'React.js', 'PostgreSQL', 'TypeScript'],
        resume_url: '/uploads/resumes/sample-emma-watson-resume.pdf',
        profile_photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=256&auto=format&fit=crop&q=80'
      }
    ];

    const candidateIds = [];
    for (const cand of candidatesData) {
      const uRes = await client.query(
        `INSERT INTO users (name, email, password_hash, role, is_active)
         VALUES ($1, $2, $3, 'candidate', TRUE) RETURNING id`,
        [cand.name, cand.email, candidatePassHash]
      );
      const cId = uRes.rows[0].id;
      candidateIds.push(cId);

      await client.query(
        `INSERT INTO candidate_profiles (
          user_id, phone, date_of_birth, gender, location, qualification,
          university, graduation_year, experience_years, bio, resume_url, profile_photo_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          cId,
          cand.phone,
          cand.date_of_birth,
          cand.gender,
          cand.location,
          cand.qualification,
          cand.university,
          cand.graduation_year,
          cand.experience_years,
          cand.bio,
          cand.resume_url,
          cand.profile_photo_url
        ]
      );

      // Link candidate skills
      for (const skillName of cand.skills) {
        if (skillIdMap[skillName]) {
          await client.query(
            `INSERT INTO candidate_skills (candidate_id, skill_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [cId, skillIdMap[skillName]]
          );
        }
      }
    }

    // 7. Insert 10 Jobs
    console.log('Inserting 10 Jobs...');
    const jobsData = [
      {
        recruiter_id: recruiterIds[0], // Apex Global Tech
        title: 'Senior Full Stack Engineer',
        description: `We are looking for a Senior Full Stack Engineer to drive core architectural initiatives across our SaaS platform.
You will architect resilient React frontends, scale high-load Node.js services, and design optimized relational database schemas in PostgreSQL.

Responsibilities:
- Build and maintain mission-critical client applications using React, Vite, and Tailwind CSS.
- Design performant REST and GraphQL APIs with Node.js and Express.
- Optimize complex database queries and indexing strategies in PostgreSQL.
- Mentor junior engineers and champion clean code standards.`,
        location: 'San Francisco, CA (Hybrid)',
        employment_type: 'Full-time',
        experience_required: '4-7 years',
        salary_min: 140000,
        salary_max: 185000,
        application_deadline: '2026-12-31',
        status: 'published',
        skills: ['React.js', 'Node.js', 'PostgreSQL', 'TypeScript', 'Docker']
      },
      {
        recruiter_id: recruiterIds[0], // Apex Global Tech
        title: 'Lead Frontend Architect',
        description: `Lead our frontend engineering group in creating responsive, accessible, and modular design components.
Focus on web performance metrics, bundle splitting, and component libraries.`,
        location: 'Remote',
        employment_type: 'Full-time',
        experience_required: '5+ years',
        salary_min: 155000,
        salary_max: 195000,
        application_deadline: '2026-11-30',
        status: 'published',
        skills: ['React.js', 'TypeScript', 'Tailwind CSS', 'Next.js', 'Jest']
      },
      {
        recruiter_id: recruiterIds[0], // Apex Global Tech
        title: 'Junior QA Automation Engineer',
        description: `Help ensure the highest reliability across our customer-facing web services. Write integration tests, E2E browser automation scripts, and regression suites.`,
        location: 'San Francisco, CA',
        employment_type: 'Full-time',
        experience_required: '1-3 years',
        salary_min: 80000,
        salary_max: 105000,
        application_deadline: '2026-11-15',
        status: 'draft',
        skills: ['JavaScript', 'Jest', 'Git', 'REST APIs']
      },
      {
        recruiter_id: recruiterIds[1], // CloudScale Infrastructure
        title: 'Senior Cloud Platform & DevOps Engineer',
        description: `Join CloudScale to modernize distributed infrastructure. You will manage multi-region Kubernetes clusters, orchestrate infrastructure as code, and construct resilient CI/CD pipelines.`,
        location: 'New York, NY (Hybrid)',
        employment_type: 'Full-time',
        experience_required: '5+ years',
        salary_min: 160000,
        salary_max: 200000,
        application_deadline: '2026-12-15',
        status: 'published',
        skills: ['Docker', 'Kubernetes', 'AWS', 'Linux', 'CI/CD']
      },
      {
        recruiter_id: recruiterIds[1], // CloudScale Infrastructure
        title: 'Backend Node.js & Distributed Systems Engineer',
        description: `Design high-throughput microservices handling millions of events daily. Low-latency database interactions, Redis cache layers, and scalable concurrency patterns.`,
        location: 'Remote',
        employment_type: 'Contract',
        experience_required: '4+ years',
        salary_min: 130000,
        salary_max: 165000,
        application_deadline: '2026-10-31',
        status: 'published',
        skills: ['Node.js', 'Express.js', 'PostgreSQL', 'Redis', 'Microservices']
      },
      {
        recruiter_id: recruiterIds[1], // CloudScale Infrastructure
        title: 'Systems Security & Infrastructure Lead',
        description: `Define security benchmarks, perform vulnerability assessments, maintain IAM roles, and safeguard our cloud perimeter against threats.`,
        location: 'Austin, TX',
        employment_type: 'Full-time',
        experience_required: '6+ years',
        salary_min: 175000,
        salary_max: 220000,
        application_deadline: '2026-12-01',
        status: 'closed',
        skills: ['AWS', 'Linux', 'Docker', 'System Design']
      },
      {
        recruiter_id: recruiterIds[2], // Innovate AI Labs
        title: 'Staff Machine Learning & Python Engineer',
        description: `Build low-latency inference servers and retrieval pipelines for foundation AI models. Work closely with research scientists to take prototype models to scalable web deployments.`,
        location: 'Palo Alto, CA (Onsite)',
        employment_type: 'Full-time',
        experience_required: '5+ years',
        salary_min: 180000,
        salary_max: 235000,
        application_deadline: '2027-01-31',
        status: 'published',
        skills: ['Python', 'Docker', 'REST APIs', 'PostgreSQL', 'System Design']
      },
      {
        recruiter_id: recruiterIds[2], // Innovate AI Labs
        title: 'UI/UX Product Designer & Design Systems Lead',
        description: `Transform sophisticated AI interaction paradigms into intuitive, clear, and delightful experiences. Craft unified UI design tokens and responsive interfaces.`,
        location: 'Remote',
        employment_type: 'Full-time',
        experience_required: '3-6 years',
        salary_min: 120000,
        salary_max: 155000,
        application_deadline: '2026-11-20',
        status: 'published',
        skills: ['UI/UX Design', 'Tailwind CSS', 'React.js']
      },
      {
        recruiter_id: recruiterIds[2], // Innovate AI Labs
        title: 'Full Stack Web & Data Visualization Specialist',
        description: `Create interactive visual dashboards that display model accuracy, token telemetry, and neural embeddings using React, Recharts, and TypeScript.`,
        location: 'Remote',
        employment_type: 'Full-time',
        experience_required: '3+ years',
        salary_min: 125000,
        salary_max: 160000,
        application_deadline: '2026-12-30',
        status: 'published',
        skills: ['React.js', 'TypeScript', 'Node.js', 'Tailwind CSS']
      },
      {
        recruiter_id: recruiterIds[2], // Innovate AI Labs
        title: 'Summer 2027 Software Engineering Intern',
        description: `Exciting internship opportunity for university students passionate about software engineering, web architectures, and scalable cloud solutions.`,
        location: 'Palo Alto, CA',
        employment_type: 'Internship',
        experience_required: '0-1 years',
        salary_min: 55000,
        salary_max: 75000,
        application_deadline: '2027-03-01',
        status: 'published',
        skills: ['JavaScript', 'Python', 'Git']
      }
    ];

    const jobIds = [];
    for (const j of jobsData) {
      const jRes = await client.query(
        `INSERT INTO jobs (
          recruiter_id, title, description, location, employment_type,
          experience_required, salary_min, salary_max, application_deadline, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
        [
          j.recruiter_id,
          j.title,
          j.description,
          j.location,
          j.employment_type,
          j.experience_required,
          j.salary_min,
          j.salary_max,
          j.application_deadline,
          j.status
        ]
      );
      const newJobId = jRes.rows[0].id;
      jobIds.push(newJobId);

      for (const skillName of j.skills) {
        if (skillIdMap[skillName]) {
          await client.query(
            `INSERT INTO job_skills (job_id, skill_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [newJobId, skillIdMap[skillName]]
          );
        }
      }
    }

    // 8. Insert Applications
    console.log('Inserting Applications across stages...');
    // Alex Rivera (Candidate #1, candidateIds[0]) applied to Senior Full Stack Engineer (jobIds[0])
    const app1 = await client.query(
      `INSERT INTO applications (job_id, candidate_id, resume_url, cover_letter, status, applied_at)
       VALUES ($1, $2, $3, $4, 'interview_scheduled', CURRENT_TIMESTAMP - INTERVAL '5 days') RETURNING id`,
      [
        jobIds[0],
        candidateIds[0],
        '/uploads/resumes/sample-alex-rivera-resume.pdf',
        'I am deeply excited to apply for the Senior Full Stack role. Having built similar event-driven architectures, I would love to bring my experience in React and PostgreSQL to Apex Global Tech.'
      ]
    );

    // Priya Sharma (candidateIds[1]) applied to Backend Node Engineer (jobIds[4]) -> status: shortlisted
    const app2 = await client.query(
      `INSERT INTO applications (job_id, candidate_id, resume_url, cover_letter, status, applied_at)
       VALUES ($1, $2, $3, $4, 'shortlisted', CURRENT_TIMESTAMP - INTERVAL '4 days') RETURNING id`,
      [
        jobIds[4],
        candidateIds[1],
        '/uploads/resumes/sample-priya-sharma-resume.pdf',
        'With 5 years specializing in PostgreSQL optimization and distributed Node microservices, I can make an immediate impact on CloudScale’s distributed backend services.'
      ]
    );

    // David Kim (candidateIds[2]) applied to Senior Cloud DevOps (jobIds[3]) -> status: selected
    const app3 = await client.query(
      `INSERT INTO applications (job_id, candidate_id, resume_url, cover_letter, status, applied_at)
       VALUES ($1, $2, $3, $4, 'selected', CURRENT_TIMESTAMP - INTERVAL '10 days') RETURNING id`,
      [
        jobIds[3],
        candidateIds[2],
        '/uploads/resumes/sample-david-kim-resume.pdf',
        'I have designed Kubernetes infrastructures and automated multi-region deployments on AWS for over 6 years.'
      ]
    );

    // Sophia Chen (candidateIds[3]) applied to UI/UX Product Designer (jobIds[7]) -> status: interview_scheduled
    const app4 = await client.query(
      `INSERT INTO applications (job_id, candidate_id, resume_url, cover_letter, status, applied_at)
       VALUES ($1, $2, $3, $4, 'interview_scheduled', CURRENT_TIMESTAMP - INTERVAL '3 days') RETURNING id`,
      [
        jobIds[7],
        candidateIds[3],
        '/uploads/resumes/sample-sophia-chen-resume.pdf',
        'Designing intuitive interfaces for AI tooling is my passion. Enclosed is my portfolio and resume.'
      ]
    );

    // Liam O'Connor (candidateIds[4]) applied to Staff ML Engineer (jobIds[6]) -> status: under_review
    await client.query(
      `INSERT INTO applications (job_id, candidate_id, resume_url, cover_letter, status, applied_at)
       VALUES ($1, $2, $3, $4, 'under_review', CURRENT_TIMESTAMP - INTERVAL '2 days') RETURNING id`,
      [
        jobIds[6],
        candidateIds[4],
        '/uploads/resumes/sample-liam-oconnor-resume.pdf',
        'Strong background in vector search pipelines, model hosting with FastAPI, and distributed computing.'
      ]
    );

    // Amara Okafor (candidateIds[5]) applied to Lead Frontend Architect (jobIds[1]) -> status: applied
    await client.query(
      `INSERT INTO applications (job_id, candidate_id, resume_url, cover_letter, status, applied_at)
       VALUES ($1, $2, $3, $4, 'applied', CURRENT_TIMESTAMP - INTERVAL '1 day') RETURNING id`,
      [
        jobIds[1],
        candidateIds[5],
        '/uploads/resumes/sample-amara-okafor-resume.pdf',
        'Excited to help scale the frontend architecture and design systems at Apex.'
      ]
    );

    // Lucas Silva (candidateIds[6]) applied to Senior Full Stack Engineer (jobIds[0]) -> status: rejected
    await client.query(
      `INSERT INTO applications (job_id, candidate_id, resume_url, cover_letter, status, applied_at)
       VALUES ($1, $2, $3, $4, 'rejected', CURRENT_TIMESTAMP - INTERVAL '6 days') RETURNING id`,
      [
        jobIds[0],
        candidateIds[6],
        '/uploads/resumes/sample-lucas-silva-resume.pdf',
        'Experienced developer interested in full stack development.'
      ]
    );

    // Emma Watson (candidateIds[7]) applied to Lead Frontend Architect (jobIds[1]) -> status: under_review
    await client.query(
      `INSERT INTO applications (job_id, candidate_id, resume_url, cover_letter, status, applied_at)
       VALUES ($1, $2, $3, $4, 'under_review', CURRENT_TIMESTAMP - INTERVAL '2 days') RETURNING id`,
      [
        jobIds[1],
        candidateIds[7],
        '/uploads/resumes/sample-emma-watson-resume.pdf',
        'Looking to build performant web interfaces with modern React.'
      ]
    );

    // 9. Insert Interviews
    console.log('Inserting Interviews...');
    // Interview for Alex Rivera with Apex Global Tech
    await client.query(
      `INSERT INTO interviews (
        application_id, scheduled_date, scheduled_time, mode, location,
        meeting_link, interviewer_notes, candidate_notes, status
      ) VALUES ($1, CURRENT_DATE + INTERVAL '3 days', '14:30:00', 'online', 'Google Meet', 'https://meet.google.com/rms-apex-interview', 'Technical system architecture & React state evaluation', 'Looking forward to meeting the lead architect', 'scheduled')`,
      [app1.rows[0].id]
    );

    // Interview for Sophia Chen with Innovate AI Labs
    await client.query(
      `INSERT INTO interviews (
        application_id, scheduled_date, scheduled_time, mode, location,
        meeting_link, interviewer_notes, status
      ) VALUES ($1, CURRENT_DATE + INTERVAL '4 days', '10:00:00', 'online', 'Zoom', 'https://zoom.us/j/987654321', 'Portfolio review and design tokens discussion', 'scheduled')`,
      [app4.rows[0].id]
    );

    // Past completed interview for David Kim with CloudScale
    await client.query(
      `INSERT INTO interviews (
        application_id, scheduled_date, scheduled_time, mode, location,
        meeting_link, interviewer_notes, status
      ) VALUES ($1, CURRENT_DATE - INTERVAL '3 days', '11:00:00', 'online', 'Zoom', 'https://zoom.us/j/123456789', 'Outstanding Kubernetes domain expertise. Highly recommend offer extension.', 'completed')`,
      [app3.rows[0].id]
    );

    // 10. Saved Jobs
    console.log('Inserting Saved Jobs...');
    await client.query(
      `INSERT INTO saved_jobs (candidate_id, job_id) VALUES ($1, $2), ($1, $3), ($4, $5) ON CONFLICT DO NOTHING`,
      [candidateIds[0], jobIds[1], jobIds[8], candidateIds[3], jobIds[7]]
    );

    // 11. Notifications
    console.log('Inserting Notifications...');
    // Notifications for candidate Alex Rivera
    await client.query(
      `INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
       VALUES 
       ($1, 'Interview Scheduled 📅', 'Your interview for Senior Full Stack Engineer at Apex Global Tech is scheduled for 3 days from now at 14:30.', 'INTERVIEW_SCHEDULED', FALSE, CURRENT_TIMESTAMP - INTERVAL '1 day'),
       ($1, 'Application Received', 'Your application for Senior Full Stack Engineer was submitted successfully.', 'APPLICATION_SUBMITTED', TRUE, CURRENT_TIMESTAMP - INTERVAL '5 days'),
       ($1, 'Welcome to RMS', 'Welcome Alex Rivera! Complete your profile to boost visibility with top tech recruiters.', 'WELCOME', TRUE, CURRENT_TIMESTAMP - INTERVAL '7 days')`,
      [candidateIds[0]]
    );

    // Notifications for recruiter Sarah Jenkins
    await client.query(
      `INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
       VALUES 
       ($1, 'New Candidate Application', 'Alex Rivera applied for Senior Full Stack Engineer.', 'APPLICATION_RECEIVED', FALSE, CURRENT_TIMESTAMP - INTERVAL '5 days'),
       ($1, 'Interview Confirmed', 'Interview with Alex Rivera scheduled for 14:30.', 'INTERVIEW_SCHEDULED', TRUE, CURRENT_TIMESTAMP - INTERVAL '1 day')`,
      [recruiterIds[0]]
    );

    // 12. Audit Logs
    console.log('Inserting initial audit logs...');
    await client.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, created_at)
       VALUES 
       ($1, 'SYSTEM_BOOTSTRAP', 'system', NULL, '{"version":"1.0.0"}', CURRENT_TIMESTAMP - INTERVAL '10 days'),
       ($2, 'JOB_CREATED', 'job', $4, '{"title":"Senior Full Stack Engineer"}', CURRENT_TIMESTAMP - INTERVAL '9 days'),
       ($2, 'JOB_PUBLISHED', 'job', $4, '{"status":"published"}', CURRENT_TIMESTAMP - INTERVAL '9 days'),
       ($3, 'APPLICATION_SUBMITTED', 'application', $5, '{"candidate":"Alex Rivera"}', CURRENT_TIMESTAMP - INTERVAL '5 days'),
       ($2, 'INTERVIEW_SCHEDULED', 'interview', 1, '{"mode":"online"}', CURRENT_TIMESTAMP - INTERVAL '1 day')`,
      [adminId, recruiterIds[0], candidateIds[0], jobIds[0], app1.rows[0].id]
    );

    await client.query('COMMIT');
    console.log('✅ Database seeded successfully with demo accounts and data!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    client.release();
    if (require.main === module) {
      await pool.end();
    }
  }
}

if (require.main === module) {
  seed();
}

module.exports = seed;
