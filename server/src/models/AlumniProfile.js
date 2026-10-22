const mongoose = require('mongoose');

/**
 * AlumniProfile Model
 *
 * Stores industry, career, mentorship, and experience details for alumni.
 * Linked to the User model via a 1-to-1 ObjectId reference.
 *
 * VIVA ARCHITECTURE TIP:
 * "Alumni profiles capture industry career progression (company, designation,
 *  years of experience, mentorship expertise). Storing this separately from
 *  StudentProfile enables tailored indexes (e.g. searching on company, graduationYear,
 *  or mentorship availability) without cluttering student records."
 */
const alumniProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    graduationYear: {
      type: Number,
      required: [true, 'Graduation year is required'],
      min: [1970, 'Graduation year must be 1970 or later'],
      max: [2035, 'Graduation year cannot exceed 2035'],
      index: true,
    },
    company: {
      type: String,
      required: [true, 'Current company or organization is required'],
      trim: true,
      index: true,
    },
    designation: {
      type: String,
      required: [true, 'Current designation or job title is required'],
      trim: true,
      index: true,
    },
    experience: {
      type: Number,
      default: 1,
      min: [0, 'Experience cannot be negative'],
    },
    skills: {
      type: [String],
      default: [],
      index: true,
    },
    expertise: {
      type: [String],
      default: [],
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [1000, 'Bio cannot exceed 1000 characters'],
      default: '',
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    linkedinUrl: {
      type: String,
      trim: true,
      default: '',
    },
    availableForMentorship: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound text index for powerful fuzzy / substring searching across multiple fields
alumniProfileSchema.index({
  company: 'text',
  designation: 'text',
  skills: 'text',
  expertise: 'text',
  bio: 'text',
});

const AlumniProfile = mongoose.model('AlumniProfile', alumniProfileSchema);

module.exports = AlumniProfile;
