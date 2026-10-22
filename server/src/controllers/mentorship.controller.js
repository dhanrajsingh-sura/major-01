const mongoose = require('mongoose');
const MentorshipRequest = require('../models/MentorshipRequest');
const Notification = require('../models/Notification');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const AlumniProfile = require('../models/AlumniProfile');

/**
 * Mentorship Controller
 *
 * Implements end-to-end mentorship workflows:
 * - Request creation with duplicate protection
 * - Role-based authorization & data isolation
 * - Acceptance & rejection with reason notes
 * - Session scheduling & status tracking
 * - Synchronous notification dispatch
 */

/**
 * POST /api/mentorship/request
 * Student sends a mentorship request to a verified alumni.
 */
const createRequest = async (req, res) => {
  try {
    const studentId = req.user._id;

    // 1. Role enforcement
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only registered students can send mentorship requests',
      });
    }

    const { alumniId, message, topic } = req.body;

    if (!alumniId || !mongoose.Types.ObjectId.isValid(alumniId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid alumni ID is required',
      });
    }

    if (!message || message.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an introductory message (minimum 10 characters)',
      });
    }

    // 2. Verify target alumni exists and is an alumni
    // Supports both User ID and AlumniProfile ID for maximum client compatibility
    let alumniUser = await User.findById(alumniId);
    if (!alumniUser) {
      const alumniProfile = await AlumniProfile.findById(alumniId);
      if (alumniProfile && alumniProfile.user) {
        alumniUser = await User.findById(alumniProfile.user);
      }
    }

    if (!alumniUser || alumniUser.role !== 'alumni') {
      return res.status(404).json({
        success: false,
        message: 'Selected mentor is not a registered alumni',
      });
    }

    const targetAlumniUserId = alumniUser._id;

    // Prevent requesting oneself
    if (targetAlumniUserId.toString() === studentId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot send a mentorship request to yourself',
      });
    }

    // 3. Duplicate Prevention: Check for existing active or pending request
    const existingActiveRequest = await MentorshipRequest.findOne({
      student: studentId,
      alumni: targetAlumniUserId,
      status: { $in: ['pending', 'accepted'] },
    });

    if (existingActiveRequest) {
      const statusText = existingActiveRequest.status === 'pending' ? 'pending' : 'active (already accepted)';
      return res.status(400).json({
        success: false,
        message: `You already have a ${statusText} mentorship request with ${alumniUser.name}.`,
      });
    }

    // 4. Create request in MongoDB with the verified User._id
    const mentorshipRequest = await MentorshipRequest.create({
      student: studentId,
      alumni: targetAlumniUserId,
      topic: topic?.trim() || 'General Career Guidance',
      message: message.trim(),
      status: 'pending',
    });

    // 5. Create in-app Notification for the Alumni
    await Notification.create({
      recipient: targetAlumniUserId,
      sender: studentId,
      type: 'request_received',
      title: 'New Mentorship Request',
      message: `${req.user.name} sent you a mentorship request: "${mentorshipRequest.topic}".`,
      relatedId: mentorshipRequest._id,
    });

    // Populate user details for response
    const populated = await MentorshipRequest.findById(mentorshipRequest._id)
      .populate('student', 'name email avatar role')
      .populate('alumni', 'name email avatar role');

    res.status(201).json({
      success: true,
      message: 'Mentorship request sent successfully!',
      data: populated,
    });
  } catch (error) {
    console.error('Error creating mentorship request:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending mentorship request',
    });
  }
};

/**
 * GET /api/mentorship/my-requests
 * Retrieves requests for the authenticated user (incoming for alumni, outgoing for students).
 */
const getMyRequests = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;

    const query = {};
    if (role === 'student') {
      query.student = userId;
    } else if (role === 'alumni') {
      query.alumni = userId;
    } else {
      // Admin sees all
    }

    // Optional status filter
    if (req.query.status && req.query.status !== 'all') {
      query.status = req.query.status;
    }

    const requests = await MentorshipRequest.find(query)
      .sort({ createdAt: -1 })
      .populate('student', 'name email avatar role')
      .populate('alumni', 'name email avatar role')
      .lean();

    // Attach student and alumni profile details for richer display
    const enrichedRequests = await Promise.all(
      requests.map(async (r) => {
        let studentDetails = null;
        let alumniDetails = null;

        if (r.student?._id) {
          studentDetails = await StudentProfile.findOne({ user: r.student._id })
            .select('branch academicYear skills')
            .lean();
        }
        if (r.alumni?._id) {
          alumniDetails = await AlumniProfile.findOne({ user: r.alumni._id })
            .select('company designation graduationYear expertise')
            .lean();
        }

        return {
          ...r,
          studentProfile: studentDetails,
          alumniProfile: alumniDetails,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: enrichedRequests.length,
      data: enrichedRequests,
    });
  } catch (error) {
    console.error('Error retrieving requests:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving mentorship requests',
    });
  }
};

/**
 * PUT /api/mentorship/:id/status
 * Alumni accepts or rejects an incoming request.
 */
const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, responseNote } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either "accepted" or "rejected"',
      });
    }

    const request = await MentorshipRequest.findById(id).populate('student', 'name email');
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Mentorship request not found',
      });
    }

    // Authorization: Only the assigned alumni can accept/reject
    if (request.alumni.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this mentorship request',
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `This request has already been ${request.status}`,
      });
    }

    request.status = status;
    if (responseNote) {
      request.responseNote = responseNote.trim();
    }
    await request.save();

    // Create Notification for Student
    await Notification.create({
      recipient: request.student._id,
      sender: req.user._id,
      type: status === 'accepted' ? 'request_accepted' : 'request_rejected',
      title: status === 'accepted' ? 'Mentorship Request Accepted! 🎉' : 'Mentorship Request Update',
      message:
        status === 'accepted'
          ? `${req.user.name} accepted your mentorship request! They can now schedule a meeting with you.`
          : `${req.user.name} was unable to accept your request at this time.${
              responseNote ? ` Reason: "${responseNote.trim()}"` : ''
            }`,
      relatedId: request._id,
    });

    res.status(200).json({
      success: true,
      message: `Mentorship request ${status} successfully`,
      data: request,
    });
  } catch (error) {
    console.error('Error updating request status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating mentorship request status',
    });
  }
};

/**
 * POST /api/mentorship/:id/schedule
 * Alumni schedules a mentorship session for an accepted request.
 */
const scheduleSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, time, duration, mode, locationDetails, notes } = req.body;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Session date is required',
      });
    }

    const sessionDate = new Date(date);
    if (isNaN(sessionDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session date format',
      });
    }

    const request = await MentorshipRequest.findById(id).populate('student', 'name email');
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Mentorship request not found',
      });
    }

    // Authorization: Only the assigned alumni can schedule sessions
    if (request.alumni.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to schedule sessions for this request',
      });
    }

    if (request.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Sessions can only be scheduled for accepted mentorship requests',
      });
    }

    // Update session data
    request.session = {
      isScheduled: true,
      date: sessionDate,
      time: time?.trim() || '10:00 AM',
      duration: Math.max(15, Math.min(180, Number(duration) || 45)),
      mode: mode === 'in-person' ? 'in-person' : 'online',
      locationDetails:
        locationDetails?.trim() ||
        (mode === 'in-person'
          ? 'Campus Tech Hub / Conference Room'
          : 'Google Meet link will be provided prior to session'),
      notes: notes?.trim() || '',
    };

    await request.save();

    // Create Notification for Student
    await Notification.create({
      recipient: request.student._id,
      sender: req.user._id,
      type: 'session_scheduled',
      title: 'Mentorship Session Scheduled! 📅',
      message: `${req.user.name} scheduled your session for ${sessionDate.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })} at ${request.session.time} (${request.session.mode}).`,
      relatedId: request._id,
    });

    res.status(200).json({
      success: true,
      message: 'Mentorship session scheduled successfully!',
      data: request,
    });
  } catch (error) {
    console.error('Error scheduling mentorship session:', error);
    res.status(500).json({
      success: false,
      message: 'Server error scheduling mentorship session',
    });
  }
};

/**
 * GET /api/mentorship/sessions
 * Returns scheduled sessions for the authenticated user (both student & alumni).
 */
const getScheduledSessions = async (req, res) => {
  try {
    const userId = req.user._id;

    const sessions = await MentorshipRequest.find({
      $or: [{ student: userId }, { alumni: userId }],
      'session.isScheduled': true,
    })
      .sort({ 'session.date': 1 })
      .populate('student', 'name email avatar role')
      .populate('alumni', 'name email avatar role');

    res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions,
    });
  } catch (error) {
    console.error('Error fetching scheduled sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching scheduled sessions',
    });
  }
};

/**
 * GET /api/mentorship/stats
 * Returns live status counts and profile completion metrics for the authenticated user.
 */
const getMentorshipStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;

    let stats = {};

    if (role === 'alumni') {
      const [pendingCount, acceptedCount, rejectedCount, scheduledCount, alumniProfile] =
        await Promise.all([
          MentorshipRequest.countDocuments({ alumni: userId, status: 'pending' }),
          MentorshipRequest.countDocuments({ alumni: userId, status: 'accepted' }),
          MentorshipRequest.countDocuments({ alumni: userId, status: 'rejected' }),
          MentorshipRequest.countDocuments({ alumni: userId, 'session.isScheduled': true }),
          AlumniProfile.findOne({ user: userId }),
        ]);

      // Calculate profile completion percentage
      let completionScore = 30; // base score for account creation
      if (alumniProfile) {
        if (alumniProfile.company) completionScore += 15;
        if (alumniProfile.designation) completionScore += 15;
        if (alumniProfile.skills && alumniProfile.skills.length > 0) completionScore += 15;
        if (alumniProfile.expertise && alumniProfile.expertise.length > 0) completionScore += 15;
        if (alumniProfile.bio) completionScore += 10;
      }

      stats = {
        role: 'alumni',
        pendingCount,
        acceptedCount,
        rejectedCount,
        totalRequests: pendingCount + acceptedCount + rejectedCount,
        scheduledCount,
        profileCompletion: Math.min(100, completionScore),
        profile: alumniProfile,
      };
    } else {
      // Student stats
      const [sentCount, pendingCount, acceptedCount, scheduledCount, studentProfile] =
        await Promise.all([
          MentorshipRequest.countDocuments({ student: userId }),
          MentorshipRequest.countDocuments({ student: userId, status: 'pending' }),
          MentorshipRequest.countDocuments({ student: userId, status: 'accepted' }),
          MentorshipRequest.countDocuments({ student: userId, 'session.isScheduled': true }),
          StudentProfile.findOne({ user: userId }),
        ]);

      let completionScore = 30;
      if (studentProfile) {
        if (studentProfile.branch) completionScore += 15;
        if (studentProfile.academicYear) completionScore += 15;
        if (studentProfile.skills && studentProfile.skills.length > 0) completionScore += 15;
        if (studentProfile.interests && studentProfile.interests.length > 0) completionScore += 15;
        if (studentProfile.bio || studentProfile.careerGoals) completionScore += 10;
      }

      stats = {
        role: 'student',
        sentCount,
        pendingCount,
        acceptedCount,
        scheduledCount,
        profileCompletion: Math.min(100, completionScore),
        profile: studentProfile,
      };
    }

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching mentorship stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving mentorship stats',
    });
  }
};

module.exports = {
  createRequest,
  getMyRequests,
  updateRequestStatus,
  scheduleSession,
  getScheduledSessions,
  getMentorshipStats,
};
