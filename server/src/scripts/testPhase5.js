/**
 * testPhase5.js — ANVAYA Phase 5 Recommendation Engine Verification Suite
 *
 * Tests the GET /api/recommendations/alumni endpoint end-to-end.
 * Uses fictional test accounts — never deletes existing production users.
 *
 * RUN: node src/scripts/testPhase5.js  (from the server/ directory)
 *
 * REQUIREMENTS:
 *   - Backend must be running on localhost:5000
 *   - MongoDB Atlas must be connected
 *   - At least the 6 demo alumni must be seeded (POST /api/profile/seed-alumni)
 *
 * TEST ACCOUNTS USED (fictional, created fresh each run):
 *   Student A (full profile) — skills: React, Node.js  /  interests: System Design
 *   Student B (partial — no interests or goals)
 *   Student C (empty profile — all arrays empty, no career goals)
 *
 * NOTHING IS DELETED after the run except the 3 test student accounts that were
 * created specifically for this test.
 */

const BASE = 'http://localhost:5000/api';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function post(path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const r = await fetch(`${BASE}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  return r.json();
}

async function put(path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const r = await fetch(`${BASE}${path}`, { method: 'PUT', headers, body: JSON.stringify(body) });
  return r.json();
}

async function get(path, token) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const r = await fetch(`${BASE}${path}`, { headers });
  return r.json();
}

let passCount = 0;
let failCount = 0;

function report(label, passed, detail = '') {
  const icon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`  ${icon}  ${label}`);
  if (detail) console.log(`         ↳ ${detail}`);
  passed ? passCount++ : failCount++;
}

// ── Main Test Runner ──────────────────────────────────────────────────────────

async function runPhase5Tests() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  ANVAYA Phase 5 — Recommendation Engine Verification Suite  ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // ── Seed demo alumni if not present ───────────────────────────────────────
  console.log('0. Ensuring demo alumni exist...');
  await post('/profile/seed-alumni', {});
  const alumniDir = await get('/profile/alumni?limit=10');
  const alumniCount = alumniDir.total || 0;
  console.log(`   Found ${alumniCount} alumni in directory.\n`);

  // ── Setup: Register three fictional test students ─────────────────────────
  console.log('── Setup: Creating test student accounts ──');

  const suffix = Date.now();
  const studentAEmail = `phase5.full.${suffix}@test.anvaya.edu`;
  const studentBEmail = `phase5.partial.${suffix}@test.anvaya.edu`;
  const studentCEmail = `phase5.empty.${suffix}@test.anvaya.edu`;

  const regA = await post('/auth/register', {
    name: 'Phase5 FullProfile',
    email: studentAEmail,
    password: 'Test@12345',
    confirmPassword: 'Test@12345',
    role: 'student',
  });
  const tokenA = regA.data?.token;
  console.log(`   Student A (full profile) registered: ${regA.success ? 'OK' : 'FAILED – ' + regA.message}`);

  const regB = await post('/auth/register', {
    name: 'Phase5 PartialProfile',
    email: studentBEmail,
    password: 'Test@12345',
    confirmPassword: 'Test@12345',
    role: 'student',
  });
  const tokenB = regB.data?.token;
  console.log(`   Student B (partial profile) registered: ${regB.success ? 'OK' : 'FAILED – ' + regB.message}`);

  const regC = await post('/auth/register', {
    name: 'Phase5 EmptyProfile',
    email: studentCEmail,
    password: 'Test@12345',
    confirmPassword: 'Test@12345',
    role: 'student',
  });
  const tokenC = regC.data?.token;
  console.log(`   Student C (empty profile) registered: ${regC.success ? 'OK' : 'FAILED – ' + regC.message}\n`);

  // Set Student A's full profile
  await put('/profile/me', {
    branch:      'Computer Science Engineering',
    academicYear:'3rd Year',
    skills:      ['React', 'Node.js', 'Python'],
    interests:   ['System Design', 'Machine Learning'],
    careerGoals: 'Crack FAANG interview prep and learn system design',
  }, tokenA);

  // Student B: only skills, no interests or careerGoals
  await put('/profile/me', {
    branch:  'Information Technology',
    skills:  ['Java', 'AWS'],
  }, tokenB);

  // Student C: nothing filled in — all defaults (empty arrays, empty string)

  console.log('── TC-01: Student-only authorization ──');
  // Alumni should get 403
  const alumniLogin = await post('/auth/login', {
    email: 'priya.sharma@alumni.anvaya.edu',
    password: 'Password@123',
  });
  const alumniToken = alumniLogin.data?.token;

  if (alumniToken) {
    const alumniRec = await get('/recommendations/alumni', alumniToken);
    report(
      'Alumni cannot access student recommendation endpoint',
      alumniRec.success === false,
      `Status message: "${alumniRec.message}"`
    );
  } else {
    report('Alumni login for auth test', false, 'Alumni login failed — seed alumni first');
  }

  // No token → 401
  const noTokenRec = await get('/recommendations/alumni', null);
  report(
    'Unauthenticated request is rejected (401)',
    noTokenRec.success === false,
    `Message: "${noTokenRec.message}"`
  );

  console.log('\n── TC-02: Student A — Full Profile Recommendations ──');
  if (tokenA) {
    const recA = await get('/recommendations/alumni?limit=6', tokenA);
    report(
      'Request succeeds and returns success:true',
      recA.success === true,
      `count: ${recA.count}, total: ${recA.total}`
    );
    report(
      'studentProfileComplete flag is true for full profile',
      recA.studentProfileComplete === true,
      `Flag value: ${recA.studentProfileComplete}`
    );
    report(
      'Returns at least 1 recommendation',
      Array.isArray(recA.data) && recA.data.length > 0,
      `Received ${recA.data?.length ?? 0} recommendations`
    );
    if (recA.data?.length > 0) {
      const top = recA.data[0];
      report(
        'Top recommendation has a score > 0',
        typeof top.score === 'number' && top.score > 0,
        `Score: ${top.score} for "${top.user?.name}" at ${top.company}`
      );
      report(
        'Top recommendation includes reasons array',
        Array.isArray(top.reasons) && top.reasons.length > 0,
        `Reasons: ${top.reasons?.join(' | ')}`
      );
      report(
        'Results are sorted highest-score first',
        recA.data.every((item, i) => i === 0 || recA.data[i - 1].score >= item.score),
        'Scores are in descending order'
      );
      report(
        'Response does not expose alumni email address',
        !('email' in top) && !('email' in (top.user || {})),
        'Email field absent from recommendation object'
      );
      // Check Priya Sharma (React/Node.js/System Design match) ranks high
      const priyaRec = recA.data.find((r) => r.user?.name?.includes('Priya'));
      report(
        'Priya Sharma (Google, React/Node/System Design expert) is ranked in top 3',
        priyaRec !== undefined && recA.data.indexOf(priyaRec) < 3,
        `Priya at position ${priyaRec ? recA.data.indexOf(priyaRec) + 1 : 'not found'}`
      );
    }
  } else {
    report('Student A token valid', false, 'Registration failed — skipping TC-02 subtests');
  }

  console.log('\n── TC-03: Student B — Partial Profile (skills only) ──');
  if (tokenB) {
    const recB = await get('/recommendations/alumni?limit=6', tokenB);
    report(
      'Request succeeds for student with partial profile',
      recB.success === true,
      `count: ${recB.count}`
    );
    report(
      'studentProfileComplete is true (has skills)',
      recB.studentProfileComplete === true,
      `Flag: ${recB.studentProfileComplete}`
    );
    if (recB.data?.length > 0) {
      report(
        'All returned items have non-negative scores',
        recB.data.every((r) => typeof r.score === 'number' && r.score >= 0),
        'Scores valid'
      );
    }
  }

  console.log('\n── TC-04: Student C — Empty Profile ──');
  if (tokenC) {
    const recC = await get('/recommendations/alumni?limit=6', tokenC);
    report(
      'Request succeeds for student with empty profile',
      recC.success === true,
      `Message: ${recC.message || 'N/A'}`
    );
    report(
      'studentProfileComplete is false for empty profile',
      recC.studentProfileComplete === false,
      `Flag: ${recC.studentProfileComplete}`
    );
    // Scores should all be 0 if no profile data at all
    if (Array.isArray(recC.data)) {
      report(
        'All recommendations score 0 for empty profile',
        recC.data.every((r) => r.score === 0),
        `Scores: ${recC.data.map((r) => r.score).join(', ')}`
      );
    }
  }

  console.log('\n── TC-05: Pagination ──');
  if (tokenA) {
    const page1 = await get('/recommendations/alumni?limit=2&page=1', tokenA);
    const page2 = await get('/recommendations/alumni?limit=2&page=2', tokenA);
    report(
      'Page 1 returns up to 2 results',
      page1.success && Array.isArray(page1.data) && page1.data.length <= 2,
      `Page 1 count: ${page1.data?.length}`
    );
    report(
      'totalPages is calculated correctly',
      typeof page1.totalPages === 'number' && page1.totalPages > 0,
      `totalPages: ${page1.totalPages}`
    );
    if (page1.data?.length > 0 && page2.data?.length > 0) {
      const ids1 = page1.data.map((r) => String(r._id));
      const ids2 = page2.data.map((r) => String(r._id));
      const overlap = ids1.filter((id) => ids2.includes(id));
      report(
        'Page 1 and Page 2 contain no duplicate recommendations',
        overlap.length === 0,
        `Overlap: ${overlap.length} items`
      );
    }
  }

  // ── Cleanup: remove the 3 fictional test student accounts ─────────────────
  console.log('\n── Cleanup: Removing Phase 5 test student accounts ──');
  try {
    const mongoose = require('mongoose');
    const dotenv   = require('dotenv');
    dotenv.config({ path: require('path').join(__dirname, '../../.env') });
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'anvaya' });

    const User           = require('../models/User');
    const StudentProfile = require('../models/StudentProfile');

    const testUsers = await User.find({
      email: { $in: [studentAEmail, studentBEmail, studentCEmail] },
    });
    const testUserIds = testUsers.map((u) => u._id);

    await StudentProfile.deleteMany({ user: { $in: testUserIds } });
    await User.deleteMany({ _id: { $in: testUserIds } });
    await mongoose.disconnect();
    console.log(`   Removed ${testUsers.length} test user accounts and their profiles.\n`);
  } catch (cleanupErr) {
    console.log('   (Cleanup step failed — remove test accounts manually if needed)\n');
    console.error('   Error:', cleanupErr.message);
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log(`║  Results: ${passCount} PASSED  |  ${failCount} FAILED                              ║`);
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
}

runPhase5Tests().catch((err) => {
  console.error('Unhandled test runner error:', err.message);
  process.exit(1);
});
