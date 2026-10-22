const mongoose = require('mongoose');

/**
 * MentorshipRequest Model
 *
 * Tracks connection requests, acceptance/rejection, and scheduled meetings
 * between students and alumni.
 *
 * VIVA ARCHITECTURE TIP:
 * "MentorshipRequest acts as the association entity in our relational model.
 *  It binds a Student User with an Alumni User, tracks status transitions
 *  (pending -> accepted/rejected -> completed), and encapsulates session scheduling
 *  data once accepted."
 */
const mentorshipRequestSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
      index: true,
    },
    alumni: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Alumni ID is required'],
      index: true,
    },
    topic: {
      type: String,
      trim: true,
      maxlength: [100, 'Topic cannot exceed 100 characters'],
      default: 'General Career Guidance',
    },
    message: {
      type: String,
      required: [true, 'Introduction / request message is required'],
      trim: true,
      minlength: [10, 'Message must be at least 10 characters'],
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
        message: 'Status must be pending, accepted, rejected, completed, or cancelled',
      },
      default: 'pending',
      index: true,
    },
    responseNote: {
      type: String,
      trim: true,
      maxlength: [500, 'Response note cannot exceed 500 characters'],
      default: '',
    },
    session: {
      isScheduled: {
        type: Boolean,
        default: false,
      },
      date: {
        type: Date,
      },
      time: {
        type: String,
        trim: true,
        default: '10:00 AM',
      },
      duration: {
        type: Number,
        default: 45, // Duration in minutes
        min: [15, 'Duration must be at least 15 minutes'],
        max: [180, 'Duration cannot exceed 180 minutes'],
      },
      mode: {
        type: String,
        enum: ['online', 'in-person'],
        default: 'online',
      },
      locationDetails: {
        type: String,
        trim: true,
        default: 'Google Meet / Zoom (link will be sent via email)',
      },
      notes: {
        type: String,
        trim: true,
        default: '',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to quickly find requests between specific student and alumni
mentorshipRequestSchema.index({ student: 1, alumni: 1, status: 1 });

const MentorshipRequest = mongoose.model(
  'MentorshipRequest',
  mentorshipRequestSchema
);

module.exports = MentorshipRequest;
