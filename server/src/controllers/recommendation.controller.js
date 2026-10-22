const StudentProfile = require('../models/StudentProfile');
const AlumniProfile = require('../models/AlumniProfile');

/**
 * Recommendation Controller — Phase 5: Intelligent Alumni Recommendations
 *
 * ALGORITHM OVERVIEW (for viva):
 * "We use a deterministic, weighted scoring algorithm — not machine learning.
 *  Every recommendation can be fully explained by showing which fields matched
 *  and how many points each match contributed. The weights are:
 *    - Shared skills between student and alumni:      40 points max
 *    - Student interests matching alumni expertise:   30 points max
 *    - Career goals matched to alumni expertise:      20 points max
 *    - Academic branch relevance to alumni domain:    10 points max
 *  Maximum possible score = 100. Results are sorted highest-first."
 *
 * DESIGN DECISIONS:
 * 1. Missing fields score 0 for that dimension — they never inflate or deflate
 *    other categories. A student with no skills still gets scored fairly on
 *    interests and career goals.
 * 2. All string comparisons are case-insensitive and trim whitespace.
 * 3. Alumni without a valid user account are excluded.
 * 4. The requesting student's own user ID is excluded (students cannot be alumni
 *    simultaneously, but this guard is still good practice).
 * 5. Scores are normalised to a 0–100 integer so the UI can show a percentage bar.
 */

/**
 * Normalises a raw string/array value into a lowercased, trimmed string array.
 * Always returns a safe array — never throws, never returns null.
 *
 * @param {string|string[]|null|undefined} val
 * @returns {string[]}
 */
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
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  }
  return [];
};

/**
 * Counts how many tokens from `aList` appear anywhere in `bList`.
 * Uses substring containment so "react" matches "reactjs" and vice-versa.
 *
 * @param {string[]} aList  Student tokens
 * @param {string[]} bList  Alumni tokens
 * @returns {{ matched: string[], count: number }}
 */
const countMatches = (aList, bList) => {
  if (aList.length === 0 || bList.length === 0) return { matched: [], count: 0 };

  const matched = [];
  for (const a of aList) {
    for (const b of bList) {
      // Accept if either token contains the other (handles "React" / "React.js" etc.)
      if (a.includes(b) || b.includes(a)) {
        if (!matched.includes(a)) matched.push(a);
        break;
      }
    }
  }
  return { matched, count: matched.length };
};

/**
 * Scores a single student–alumni pair.
 *
 * @param {object} studentProfile   Mongoose StudentProfile document
 * @param {object} alumniProfile    Mongoose AlumniProfile document (with populated .user)
 * @returns {{ score: number, reasons: string[] }}
 */
const scoreAlumni = (studentProfile, alumniProfile) => {
  let score = 0;
  const reasons = [];

  // ── Dimension 1: Shared Skills (max 40 pts) ──────────────────────────────
  const studentSkills = toTokens(studentProfile?.skills);
  const alumniSkills  = toTokens(alumniProfile?.skills);

  if (studentSkills.length > 0 && alumniSkills.length > 0) {
    const { matched: skillMatches, count: skillCount } = countMatches(studentSkills, alumniSkills);
    if (skillCount > 0) {
      // Scale: each matched skill worth 40 / max(studentSkills, 5) pts, capped at 40
      const skillPoints = Math.min(40, Math.round((skillCount / Math.max(studentSkills.length, 1)) * 40));
      score += skillPoints;
      reasons.push(
        `Shared skills (${skillPoints} pts): ${skillMatches.slice(0, 4).join(', ')}${skillMatches.length > 4 ? ` +${skillMatches.length - 4} more` : ''}`
      );
    }
  }

  // ── Dimension 2: Student Interests ↔ Alumni Expertise (max 30 pts) ───────
  const studentInterests = toTokens(studentProfile?.interests);
  const alumniExpertise  = toTokens(alumniProfile?.expertise);

  if (studentInterests.length > 0 && alumniExpertise.length > 0) {
    const { matched: interestMatches, count: interestCount } = countMatches(studentInterests, alumniExpertise);
    if (interestCount > 0) {
      const interestPoints = Math.min(30, Math.round((interestCount / Math.max(studentInterests.length, 1)) * 30));
      score += interestPoints;
      reasons.push(
        `Interest ↔ Expertise match (${interestPoints} pts): ${interestMatches.slice(0, 3).join(', ')}`
      );
    }
  }

  // ── Dimension 3: Career Goals ↔ Alumni Expertise (max 20 pts) ────────────
  // Career goals is a free-text field, so we tokenise the words and match
  // against alumni expertise tags.
  const careerGoalTokens = toTokens(studentProfile?.careerGoals);
  const expertiseTokens  = toTokens(alumniProfile?.expertise);

  if (careerGoalTokens.length > 0 && expertiseTokens.length > 0) {
    const { matched: goalMatches, count: goalCount } = countMatches(careerGoalTokens, expertiseTokens);
    if (goalCount > 0) {
      const goalPoints = Math.min(20, Math.round((goalCount / Math.max(careerGoalTokens.length, 1)) * 20));
      score += goalPoints;
      reasons.push(
        `Career goals match (${goalPoints} pts): Goal keywords align with alumni expertise in ${goalMatches.slice(0, 2).join(', ')}`
      );
    }
  }

  // ── Dimension 4: Academic Branch ↔ Alumni Designation/Company (max 10 pts) ─
  // Branch relevance: check if the student's branch keyword appears in the
  // alumni's designation, company, skills, or expertise fields.
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
      reasons.push(
        `Branch relevance (10 pts): Your branch "${studentProfile.branch}" aligns with ${alumniProfile.designation} at ${alumniProfile.company}`
      );
    }
  }

  return { score, reasons };
};

/**
 * GET /api/recommendations/alumni
 * Returns a ranked list of recommended alumni mentors for the authenticated student.
 *
 * AUTHORIZATION: Student role only (enforced by `authorize('student')` in routes).
 *
 * QUERY PARAMS:
 *   limit  — Max results to return (1–20, default 6)
 *   page   — Page number (default 1)
 *
 * RESPONSE SHAPE:
 * {
 *   success: true,
 *   count: <number>,
 *   total: <number>,
 *   currentPage: <number>,
 *   totalPages: <number>,
 *   studentProfileComplete: <boolean>,
 *   data: [
 *     {
 *       _id: <AlumniProfile._id>,
 *       score: <0–100>,
 *       reasons: ["Shared skills (32 pts): React, Node.js", ...],
 *       user: { name, avatar, role },
 *       company, designation, experience, skills, expertise, bio, location, availableForMentorship
 *     }
 *   ]
 * }
 */
const getAlumniRecommendations = async (req, res) => {
  try {
    const studentUserId = req.user._id;

    // ── 1. Load student profile ────────────────────────────────────────────
    const studentProfile = await StudentProfile.findOne({ user: studentUserId }).lean();

    // If no profile exists yet, return empty recommendations with a helpful flag
    if (!studentProfile) {
      return res.status(200).json({
        success: true,
        count: 0,
        total: 0,
        currentPage: 1,
        totalPages: 1,
        studentProfileComplete: false,
        message: 'Complete your student profile to receive personalised mentor recommendations.',
        data: [],
      });
    }

    // Flag for frontend: encourages the student to fill in their profile
    const hasSkills     = Array.isArray(studentProfile.skills)    && studentProfile.skills.length > 0;
    const hasInterests  = Array.isArray(studentProfile.interests)  && studentProfile.interests.length > 0;
    const hasGoals      = typeof studentProfile.careerGoals === 'string' && studentProfile.careerGoals.trim().length > 0;
    const studentProfileComplete = hasSkills || hasInterests || hasGoals;

    // ── 2. Load all eligible alumni profiles (with valid user accounts) ────
    const allAlumni = await AlumniProfile.find({})
      .populate('user', 'name avatar role') // never populate password
      .lean();

    // Exclude orphaned profiles (user deleted) and the student's own account
    const eligibleAlumni = allAlumni.filter(
      (a) => a.user !== null && a.user._id.toString() !== studentUserId.toString()
    );

    if (eligibleAlumni.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        total: 0,
        currentPage: 1,
        totalPages: 1,
        studentProfileComplete,
        data: [],
      });
    }

    // ── 3. Score every eligible alumni ────────────────────────────────────
    const scored = eligibleAlumni
      .map((alumni) => {
        const { score, reasons } = scoreAlumni(studentProfile, alumni);
        return { ...alumni, score, reasons };
      })
      .sort((a, b) => b.score - a.score); // highest score first

    // ── 4. Paginate ────────────────────────────────────────────────────────
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 6));
    const page  = Math.max(1, parseInt(req.query.page, 10) || 1);
    const skip  = (page - 1) * limit;
    const total = scored.length;

    const paginated = scored.slice(skip, skip + limit);

    // ── 5. Shape the response — never expose email addresses ──────────────
    const data = paginated.map(({ user, score, reasons, ...profile }) => ({
      _id:                    profile._id,
      score,
      reasons,
      user: {
        _id:    user._id,
        name:   user.name,
        avatar: user.avatar,
        role:   user.role,
      },
      company:               profile.company,
      designation:           profile.designation,
      experience:            profile.experience,
      skills:                profile.skills,
      expertise:             profile.expertise,
      bio:                   profile.bio,
      location:              profile.location,
      graduationYear:        profile.graduationYear,
      availableForMentorship: profile.availableForMentorship,
    }));

    return res.status(200).json({
      success: true,
      count: data.length,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit) || 1,
      studentProfileComplete,
      data,
    });
  } catch (error) {
    console.error('Error computing alumni recommendations:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error generating recommendations',
    });
  }
};

module.exports = { getAlumniRecommendations };
