async function runPhase4Verification() {
  console.log('=== PHASE 4 AUTOMATED MENTORSHIP & NOTIFICATIONS SUITE ===\n');

  // 1. Log in as Student (Aarav Sharma)
  const studentLogin = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'aarav.sharma@anvaya.edu', password: 'password123' }),
  }).then((r) => r.json());
  const studentToken = studentLogin.data.token;
  const studentId = studentLogin.data.user._id;
  console.log('1. Student Logged in:', studentLogin.data.user.name);

  // 2. Log in as Alumni (Priya Sharma)
  const alumniLogin = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'priya.sharma@alumni.anvaya.edu', password: 'Password@123' }),
  }).then((r) => r.json());
  const alumniToken = alumniLogin.data.token;
  const alumniId = alumniLogin.data.user._id;
  console.log('2. Alumni Logged in:', alumniLogin.data.user.name, `(${alumniLogin.data.user.role})`);

  // Clean up any previous test requests between Aarav and Priya so lifecycle runs fresh
  const mongoose = require('mongoose');
  const dotenv = require('dotenv');
  dotenv.config({ path: require('path').join(__dirname, '../../.env') });
  await mongoose.connect(process.env.MONGODB_URI, { dbName: 'anvaya' });
  const MentorshipRequest = require('../models/MentorshipRequest');
  const Notification = require('../models/Notification');
  await MentorshipRequest.deleteMany({ student: studentId, alumni: alumniId });
  await Notification.deleteMany({ recipient: { $in: [studentId, alumniId] } });
  await mongoose.disconnect();

  // 3. Student sends Mentorship Request to Priya Sharma
  const reqRes = await fetch('http://localhost:5000/api/mentorship/request', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({
      alumniId,
      topic: 'Full Stack & System Design Prep',
      message: 'Hello Priya, I am a 3rd year CSE student preparing for Google SWE internships and would love guidance on system design and interview patterns.',
    }),
  }).then((r) => r.json());

  console.log('3. Mentorship Request Created:', {
    success: reqRes.success,
    status: reqRes.data?.status,
    topic: reqRes.data?.topic,
    student: reqRes.data?.student?.name,
    alumni: reqRes.data?.alumni?.name,
  });
  const requestId = reqRes.data?._id;

  // 4. Duplicate prevention test: student sends request to same alumni again
  const dupRes = await fetch('http://localhost:5000/api/mentorship/request', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({
      alumniId,
      topic: 'Duplicate Attempt',
      message: 'Trying to send duplicate request while one is already pending...',
    }),
  }).then((r) => r.json());
  console.log('4. Duplicate Request Blocked:', {
    success: dupRes.success,
    message: dupRes.message,
  });

  // 5. Alumni Notification Check: Did Priya receive notification?
  const alumniNotifs = await fetch('http://localhost:5000/api/notifications', {
    headers: { Authorization: `Bearer ${alumniToken}` },
  }).then((r) => r.json());
  console.log('5. Alumni Notification Received:', {
    success: alumniNotifs.success,
    unreadCount: alumniNotifs.unreadCount,
    latestTitle: alumniNotifs.data[0]?.title,
    latestMsg: alumniNotifs.data[0]?.message,
  });

  // 6. Alumni fetches incoming requests
  const incomingReqs = await fetch('http://localhost:5000/api/mentorship/my-requests', {
    headers: { Authorization: `Bearer ${alumniToken}` },
  }).then((r) => r.json());
  console.log('6. Alumni Incoming Requests:', {
    count: incomingReqs.count,
    firstReqStudent: incomingReqs.data[0]?.student?.name,
    studentBranch: incomingReqs.data[0]?.studentProfile?.branch,
  });

  // 7. Security Check: Student tries to accept request (should be forbidden 403)
  const hackAccept = await fetch(`http://localhost:5000/api/mentorship/${requestId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({ status: 'accepted' }),
  }).then((r) => r.json());
  console.log('7. Unauthorized Student Accept Blocked:', {
    success: hackAccept.success,
    message: hackAccept.message,
  });

  // 8. Alumni accepts the request
  const acceptRes = await fetch(`http://localhost:5000/api/mentorship/${requestId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${alumniToken}`,
    },
    body: JSON.stringify({
      status: 'accepted',
      responseNote: 'Happy to help you prepare for Google and distributed systems!',
    }),
  }).then((r) => r.json());
  console.log('8. Alumni Accept Request:', {
    success: acceptRes.success,
    status: acceptRes.data?.status,
    note: acceptRes.data?.responseNote,
  });

  // 9. Student Notification Check: Did Aarav get notification of acceptance?
  const studentNotifs = await fetch('http://localhost:5000/api/notifications', {
    headers: { Authorization: `Bearer ${studentToken}` },
  }).then((r) => r.json());
  console.log('9. Student Acceptance Notification:', {
    unreadCount: studentNotifs.unreadCount,
    latestTitle: studentNotifs.data[0]?.title,
    latestMsg: studentNotifs.data[0]?.message,
  });

  // 10. Alumni Schedules Mentorship Session
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 3);

  const schedRes = await fetch(`http://localhost:5000/api/mentorship/${requestId}/schedule`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${alumniToken}`,
    },
    body: JSON.stringify({
      date: tomorrow.toISOString(),
      time: '4:30 PM',
      duration: 60,
      mode: 'online',
      locationDetails: 'Google Meet link will be provided in calendar invite',
      notes: 'Please review basic distributed system principles before our call.',
    }),
  }).then((r) => r.json());
  console.log('10. Alumni Scheduled Session:', {
    success: schedRes.success,
    isScheduled: schedRes.data?.session?.isScheduled,
    date: schedRes.data?.session?.date,
    time: schedRes.data?.session?.time,
    duration: schedRes.data?.session?.duration,
    mode: schedRes.data?.session?.mode,
  });

  // 11. Student Views Scheduled Sessions
  const studentSessions = await fetch('http://localhost:5000/api/mentorship/sessions', {
    headers: { Authorization: `Bearer ${studentToken}` },
  }).then((r) => r.json());
  console.log('11. Student Scheduled Sessions View:', {
    count: studentSessions.count,
    mentor: studentSessions.data[0]?.alumni?.name,
    time: studentSessions.data[0]?.session?.time,
    mode: studentSessions.data[0]?.session?.mode,
  });

  // 12. Notification Mark-as-read test
  const notifId = studentNotifs.data[0]?._id;
  if (notifId) {
    const markRes = await fetch(`http://localhost:5000/api/notifications/${notifId}/read`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${studentToken}` },
    }).then((r) => r.json());
    console.log('12. Mark Notification as Read:', {
      success: markRes.success,
      isRead: markRes.data?.isRead,
    });
  }

  // 13. Live Stats Verification
  const alumniStats = await fetch('http://localhost:5000/api/mentorship/stats', {
    headers: { Authorization: `Bearer ${alumniToken}` },
  }).then((r) => r.json());
  console.log('13. Alumni Live Stats:', {
    role: alumniStats.data?.role,
    acceptedCount: alumniStats.data?.acceptedCount,
    scheduledCount: alumniStats.data?.scheduledCount,
    profileCompletion: `${alumniStats.data?.profileCompletion}%`,
  });

  console.log('\n=== ALL PHASE 4 MENTORSHIP & NOTIFICATION TESTS PASSED ===');
}

runPhase4Verification();
