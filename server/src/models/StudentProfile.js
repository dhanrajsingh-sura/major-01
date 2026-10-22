const mongoose = require('mongoose');

/**
 * StudentProfile Model
 *
 * Stores academic, skill, and career details specific to students.
 * Linked to the User model via a 1-to-1 ObjectId reference.
 *
 * VIVA ARCHITECTURE TIP:
 * "We use a reference relationship (user: ObjectId, ref: 'User') with unique: true.
 *  This keeps the User authentication table lean and fast, while giving students
 *  dedicated fields like branch, academic year, and career aspirations."
 */
const studentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    branch: {
      type: String,
      trim: true,
      default: '',
    },
    academicYear: {
      type: String,
      trim: true,
      enum: {
        values: ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate', 'Other', ''],
        message: 'Academic year must be 1st, 2nd, 3rd, 4th Year, Postgraduate, or Other',
      },
      default: '1st Year',
    },
    skills: {
      type: [String],
      default: [],
    },
    interests: {
      type: [String],
      default: [],
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [1000, 'Bio cannot exceed 1000 characters'],
      default: '',
    },
    careerGoals: {
      type: String,
      trim: true,
      maxlength: [1000, 'Career goals cannot exceed 1000 characters'],
      default: '',
    },
    githubUrl: {
      type: String,
      trim: true,
      default: '',
    },
    linkedinUrl: {
      type: String,
      trim: true,
      default: '',
    },
    portfolioUrl: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const StudentProfile = mongoose.model('StudentProfile', studentProfileSchema);

module.exports = StudentProfile;
