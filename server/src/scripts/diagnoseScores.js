/**
 * diagnoseScores.js — Diagnose Phase 5 recommendation scores
 *
 * Runs the exact updated scoring logic from recommendation.controller.js
 * against the test student Aarav Sharma and each seeded alumni.
 */

const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../../.env') });

const mongoose = require('mongoose');
const StudentProfile = require('../models/StudentProfile');
const AlumniProfile  = require('../models/AlumniProfile');
const User           = require('../models/User');

const STOP_WORDS = new Set([
  'a','an','the','and','or','in','on','at','to','for','of','with','by',
  'i','my','me','we','is','are','was','be','as','it','its','this','that',
  'have','has','will','would','can','could','do','does','from','into',
  'not','but','if','so','up','out','about','over','more','also','very',
]);

const toTokens = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val
      .map((s) => (typeof s === 'string' ? s.trim().toLowerCase() : ''))
      .filter(Boolean);
  }
  if (typeof val === 'string') {
    return val
      .split(/[,\s]+/)
      .map((s) => s.trim().toLowerCase().replace(/[^a-z0-9]/g, ''))
      .filter((s) => s.length > 2 && !STOP_WORDS.has(s));
  }
  return [];
};

const countMatches = (aList, bList) => {
  if (aList.length === 0 || bList.length === 0) return { matched: [], count: 0 };
  const matched = [];
  for (const a of aList) {
    for (const b of bList) {
      if (a.includes(b) || b.includes(a)) {
        if (!matched.includes(a)) matched.push(a);
        break;
      }
      const aWords = a.split(/\s+/).filter(w => w.length >= 4);
      const bWords = b.split(/\s+/).filter(w => w.length >= 4);
      if (aWords.some(aw => bWords.some(bw => aw.includes(bw) || bw.includes(aw)))) {
        if (!matched.includes(a)) matched.push(a);
        break;
      }
    }
  }
  return { matched, count: matched.length };
};

const scoreAlumni = (studentProfile, alumniProfile) => {
  let score = 0;
  const reasons = [];

  const studentSkills = toTokens(studentProfile?.skills);
  const alumniSkills  = toTokens(alumniProfile?.skills);
  if (studentSkills.length > 0 && alumniSkills.length > 0) {
    const { matched: skillMatches, count: skillCount } = countMatches(studentSkills, alumniSkills);
    if (skillCount > 0) {
      const skillPoints = Math.min(40, Math.round((skillCount / Math.max(studentSkills.length, 1)) * 40));
      score += skillPoints;
      reasons.push(`Shared skills (${skillPoints} pts): ${skillMatches.slice(0, 4).join(', ')}`);
    }
  }

  const studentInterests = toTokens(studentProfile?.interests);
  const alumniExpertise  = toTokens(alumniProfile?.expertise);
  if (studentInterests.length > 0 && alumniExpertise.length > 0) {
    const { matched: interestMatches, count: interestCount } = countMatches(studentInterests, alumniExpertise);
    if (interestCount > 0) {
      const interestPoints = Math.min(30, Math.round((interestCount / Math.max(studentInterests.length, 1)) * 30));
      score += interestPoints;
      reasons.push(`Domain match (${interestPoints} pts): Your interest in ${interestMatches.slice(0, 2).join(', ')} aligns with this mentor's expertise`);
    }
  }

  const careerGoalTokens = toTokens(studentProfile?.careerGoals);
  const expertiseTokens  = toTokens(alumniProfile?.expertise);
  if (careerGoalTokens.length > 0 && expertiseTokens.length > 0) {
    const { matched: goalMatches, count: goalCount } = countMatches(careerGoalTokens, expertiseTokens);
    if (goalCount > 0) {
      const goalPoints = Math.min(20, Math.round((goalCount / Math.max(careerGoalTokens.length, 1)) * 20));
      score += goalPoints;
      reasons.push(`Career goals match (${goalPoints} pts): Your goals align with expertise in ${goalMatches.slice(0, 2).join(', ')}`);
    }
  }

  const branchTokens = toTokens(studentProfile?.branch);
  const alumniContextTokens = [
    ...toTokens(alumniProfile?.designation),
    ...toTokens(alumniProfile?.company),
    ...alumniSkills,
    ...expertiseTokens,
  ];
  if (branchTokens.length > 0 && alumniContextTokens.length > 0) {
    const { count: branchCount } = countMatches(branchTokens, alumniContextTokens);
    if (branchCount > 0) {
      score += 10;
      reasons.push(`Branch relevance (10 pts): Your branch "${studentProfile.branch}" aligns with ${alumniProfile.designation} at ${alumniProfile.company}`);
    }
  }

  return { score, reasons };
};

async function run() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: 'anvaya' });

  const studentUser = await User.findOne({ email: 'aarav.sharma@anvaya.edu' });
  const sp = studentUser
    ? await StudentProfile.findOne({ user: studentUser._id }).lean()
    : await StudentProfile.findOne({}).lean();

  const ownerUser = studentUser || await User.findById(sp.user);
  console.log(`\nStudent: ${ownerUser?.name} (${ownerUser?.email})`);
  console.log(`  skills:      ${JSON.stringify(sp.skills)}`);
  console.log(`  interests:   ${JSON.stringify(sp.interests)}`);
  console.log(`  careerGoals: ${JSON.stringify(sp.careerGoals)}`);
  console.log(`  branch:      ${JSON.stringify(sp.branch)}\n`);

  const allAlumni = await AlumniProfile.find({}).populate('user', 'name').lean();

  const results = allAlumni
    .filter(a => a.user !== null && a.user._id.toString() !== sp.user.toString())
    .map(ap => {
      const { score, reasons } = scoreAlumni(sp, ap);
      return { name: ap.user?.name, company: ap.company, score, reasons };
    })
    .sort((a, b) => b.score - a.score);

  console.log('── Scored Results ──');
  for (const r of results) {
    console.log(`${r.score}% | ${r.name.padEnd(16)} @ ${r.company.padEnd(22)}`);
    for (const reason of r.reasons) {
      console.log(`     ↳ ${reason}`);
    }
  }

  const personalised = results.filter(r => r.score > 0);
  const discovery    = results.filter(r => r.score === 0);
  console.log(`\nPersonalised matches (score > 0): ${personalised.length}`);
  console.log(`Discovery mentors    (score = 0): ${discovery.length}`);

  await mongoose.disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
