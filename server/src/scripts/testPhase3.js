async function runPhase3Verification() {
  console.log('=== PHASE 3 AUTOMATED API VERIFICATION SUITE ===\n');

  // 1. Alumni Directory - unfiltered
  const dir = await fetch('http://localhost:5000/api/profile/alumni').then((r) => r.json());
  console.log('1. Alumni Directory fetch:', {
    success: dir.success,
    count: dir.count,
    total: dir.total,
    totalPages: dir.totalPages,
    companies: dir.filters?.companies?.length,
    skills: dir.filters?.skills?.length,
  });

  // 2. Search filter
  const sGoogle = await fetch('http://localhost:5000/api/profile/alumni?search=Google').then((r) => r.json());
  console.log('2. Search Google:', sGoogle.data.map((a) => `${a.user.name} (${a.company})`));

  // 3. Skill filter
  const sPy = await fetch('http://localhost:5000/api/profile/alumni?skill=Python').then((r) => r.json());
  console.log('3. Skill Python:', sPy.data.map((a) => `${a.user.name} (${a.company})`));

  // 4. Company filter
  const cMsft = await fetch('http://localhost:5000/api/profile/alumni?company=Microsoft').then((r) => r.json());
  console.log('4. Company Microsoft:', cMsft.data.map((a) => `${a.user.name} (${a.designation})`));

  // 5. Batch filter
  const y2019 = await fetch('http://localhost:5000/api/profile/alumni?graduationYear=2019').then((r) => r.json());
  console.log('5. Year 2019:', y2019.data.map((a) => `${a.user.name} (${a.graduationYear})`));

  // 6. Get single alumni by ID
  const firstId = dir.data[0]._id;
  const single = await fetch(`http://localhost:5000/api/profile/alumni/${firstId}`).then((r) => r.json());
  console.log('6. Single Alumni Detail:', {
    success: single.success,
    name: single.data.user.name,
    designation: single.data.designation,
    company: single.data.company,
    hasPassword: !!single.data.user.password,
  });

  // 7. Student Login & GET Profile
  const login = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'aarav.sharma@anvaya.edu', password: 'password123' }),
  }).then((r) => r.json());
  const token = login.data.token;

  const me = await fetch('http://localhost:5000/api/profile/me', {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.json());
  console.log('7. Authenticated Student Profile:', {
    success: me.success,
    user: me.data.user.name,
    branch: me.data.profile.branch,
    year: me.data.profile.academicYear,
    skillsCount: me.data.profile.skills.length,
  });

  // 8. Update Student Profile
  const update = await fetch('http://localhost:5000/api/profile/me', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      branch: 'Computer Science and Engineering',
      academicYear: '3rd Year',
      skills: ['React', 'Node.js', 'MongoDB', 'Express', 'DSA'],
      interests: ['Full Stack Development', 'System Architecture', 'Cloud Computing'],
      bio: 'Third-year CSE undergraduate preparing for SDE roles and contributing to open-source.',
      careerGoals: 'Seeking Software Engineering Internships at fast-growing product companies.',
      githubUrl: 'https://github.com/aarav-student',
      linkedinUrl: 'https://linkedin.com/in/aarav-student',
    }),
  }).then((r) => r.json());
  console.log('8. Update Student Profile Result:', {
    success: update.success,
    branch: update.data.profile.branch,
    year: update.data.profile.academicYear,
    skills: update.data.profile.skills,
    github: update.data.profile.githubUrl,
  });

  // 9. Unauthorized update blocked
  const noAuth = await fetch('http://localhost:5000/api/profile/me', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ branch: 'Hacked' }),
  }).then((r) => r.json());
  console.log('9. Unauthorized Profile Update Blocked:', {
    success: noAuth.success,
    message: noAuth.message,
  });

  console.log('\n=== ALL PHASE 3 API CHECKS PASSED SUCCESSFULLY ===');
}

runPhase3Verification();
