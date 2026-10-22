const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Model — Defines how user data is stored in MongoDB.
 *
 * FIELDS:
 * - name:     Full name (required)
 * - email:    Unique email address (required, lowercased, indexed)
 * - password: Bcrypt-hashed password (required, never returned in queries)
 * - role:     'student', 'alumni', or 'admin'
 *
 * HOW PASSWORD HASHING WORKS (viva answer):
 * "We use a Mongoose pre-save hook. Before any user document is saved,
 *  the hook checks if the password field changed. If it did, it hashes
 *  the password using bcrypt with 12 salt rounds. This means the plain
 *  password is NEVER stored — only the hash. To verify a login, we use
 *  bcrypt.compare() which hashes the attempt and checks if it matches."
 *
 * WHY select: false ON password?
 * "By default, Mongoose will NOT include the password field when you
 *  query for users (e.g., User.find()). You must explicitly ask for it
 *  with .select('+password'). This prevents accidentally leaking hashes
 *  in API responses."
 */

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true, // Creates a unique index in MongoDB
      lowercase: true, // Always store emails in lowercase
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't include password in queries by default
    },
    role: {
      type: String,
      enum: {
        values: ['student', 'alumni', 'admin'],
        message: 'Role must be student, alumni, or admin',
      },
      default: 'student',
    },
    // Profile fields (will be expanded in later phases)
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: '',
    },
    skills: {
      type: [String],
      default: [],
    },
    branch: {
      type: String,
      default: '',
    },
    graduationYear: {
      type: Number,
    },
    company: {
      type: String,
      default: '',
    },
    jobTitle: {
      type: String,
      default: '',
    },
    interests: {
      type: [String],
      default: [],
    },
    avatar: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// ──── Pre-save Hook: Hash Password ────
// In modern Mongoose, async pre-hooks return a Promise (no `next` parameter needed).
userSchema.pre('save', async function () {
  // Only hash if the password field was modified (not on every save)
  if (!this.isModified('password')) {
    return;
  }

  // Generate a salt (random data to make the hash unique)
  // 12 rounds = good balance of security and speed
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// ──── Instance Method: Compare Passwords ────
// Usage: const isMatch = await user.comparePassword('plaintext');
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ──── Instance Method: Return safe user object (no password) ────
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
