const mongoose = require('mongoose');
const StudentProfile = require('../models/StudentProfile');
const AlumniProfile = require('../models/AlumniProfile');
const User = require('../models/User');

/**
 * Helper to normalize arrays (e.g., from "React, Node, Mongo" or ["React", "Node"])
 */
const normalizeArray = (val) => {
  if (Array.isArray(val)) {
    return val.map((item) => (typeof item === 'string' ? item.trim() : item)).filter(Boolean);
  }
  if (typeof val === 'string') {
    return val
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  return [];
};

/**
 * GET /api/profile/me
 * Retrieves current authenticated user's profile based on their role (Student or Alumni).
 */
const getMyProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;

    let profile = null;

    if (role === 'student') {
      profile = await StudentProfile.findOne({ user: userId });
      // If profile does not exist yet, create default empty profile for user
      if (!profile) {
        profile = await StudentProfile.create({
          user: userId,
          branch: '',
          academicYear: '1st Year',
          skills: [],
          interests: [],
          bio: '',
          careerGoals: '',
        });
      }
    } else if (role === 'alumni') {
      profile = await AlumniProfile.findOne({ user: userId });
    }

    res.status(200).json({
      success: true,
      data: {
        user: req.user.toSafeObject(),
        role,
        profile,
      },
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving your profile',
    });
  }
};

/**
 * PUT /api/profile/me
 * Updates the authenticated user's profile and basic info.
 * Security: Users can only update their own profile (req.user from JWT).
 */
const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;

    // Optional user name or avatar update
    if (req.body.name && req.body.name.trim().length >= 2) {
      req.user.name = req.body.name.trim();
      await req.user.save();
    }

    let updatedProfile = null;

    if (role === 'student') {
      const allowedStudentFields = {};

      if (req.body.branch !== undefined) allowedStudentFields.branch = req.body.branch.trim();
      if (req.body.academicYear !== undefined) allowedStudentFields.academicYear = req.body.academicYear.trim();
      if (req.body.bio !== undefined) allowedStudentFields.bio = req.body.bio.trim();
      if (req.body.careerGoals !== undefined) allowedStudentFields.careerGoals = req.body.careerGoals.trim();
      if (req.body.githubUrl !== undefined) allowedStudentFields.githubUrl = req.body.githubUrl.trim();
      if (req.body.linkedinUrl !== undefined) allowedStudentFields.linkedinUrl = req.body.linkedinUrl.trim();
      if (req.body.portfolioUrl !== undefined) allowedStudentFields.portfolioUrl = req.body.portfolioUrl.trim();

      if (req.body.skills !== undefined) {
        allowedStudentFields.skills = normalizeArray(req.body.skills);
      }
      if (req.body.interests !== undefined) {
        allowedStudentFields.interests = normalizeArray(req.body.interests);
      }

      updatedProfile = await StudentProfile.findOneAndUpdate(
        { user: userId },
        { $set: allowedStudentFields },
        { new: true, upsert: true, runValidators: true }
      );
    } else if (role === 'alumni') {
      const allowedAlumniFields = {};

      if (req.body.company !== undefined) allowedAlumniFields.company = req.body.company.trim();
      if (req.body.designation !== undefined) allowedAlumniFields.designation = req.body.designation.trim();
      if (req.body.graduationYear !== undefined) allowedAlumniFields.graduationYear = Number(req.body.graduationYear);
      if (req.body.experience !== undefined) allowedAlumniFields.experience = Number(req.body.experience);
      if (req.body.bio !== undefined) allowedAlumniFields.bio = req.body.bio.trim();
      if (req.body.location !== undefined) allowedAlumniFields.location = req.body.location.trim();
      if (req.body.linkedinUrl !== undefined) allowedAlumniFields.linkedinUrl = req.body.linkedinUrl.trim();
      if (req.body.availableForMentorship !== undefined) {
        allowedAlumniFields.availableForMentorship = Boolean(req.body.availableForMentorship);
      }

      if (req.body.skills !== undefined) {
        allowedAlumniFields.skills = normalizeArray(req.body.skills);
      }
      if (req.body.expertise !== undefined) {
        allowedAlumniFields.expertise = normalizeArray(req.body.expertise);
      }

      updatedProfile = await AlumniProfile.findOneAndUpdate(
        { user: userId },
        { $set: allowedAlumniFields },
        { new: true, upsert: true, runValidators: true }
      );
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid user role for profile update',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: req.user.toSafeObject(),
        role,
        profile: updatedProfile,
      },
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages[0],
        errors: messages,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error updating profile',
    });
  }
};

/**
 * GET /api/profile/alumni
 * Public or authenticated directory search for alumni with filter tags and pagination.
 *
 * Query parameters supported:
 * - search: keyword matched in user name, company, designation, skills, expertise
 * - skill: exact or regex skill match
 * - company: company name regex
 * - designation: designation regex
 * - graduationYear: numeric year
 * - page: page number (default 1)
 * - limit: results per page (default 9)
 */
const getAlumniDirectory = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 9));
    const skip = (page - 1) * limit;

    const queryConditions = {};

    // Filter by specific skill
    if (req.query.skill && req.query.skill.trim()) {
      queryConditions.skills = { $regex: new RegExp(req.query.skill.trim(), 'i') };
    }

    // Filter by company
    if (req.query.company && req.query.company.trim()) {
      queryConditions.company = { $regex: new RegExp(req.query.company.trim(), 'i') };
    }

    // Filter by designation
    if (req.query.designation && req.query.designation.trim()) {
      queryConditions.designation = { $regex: new RegExp(req.query.designation.trim(), 'i') };
    }

    // Filter by graduation year
    if (req.query.graduationYear) {
      const gradYear = parseInt(req.query.graduationYear, 10);
      if (!isNaN(gradYear)) {
        queryConditions.graduationYear = gradYear;
      }
    }

    // Broad search across name, company, designation, skills, and expertise
    if (req.query.search && req.query.search.trim()) {
      const searchRegex = new RegExp(req.query.search.trim(), 'i');

      // Find user IDs whose name matches the search query
      const matchingUsers = await User.find({
        role: 'alumni',
        name: { $regex: searchRegex },
      }).select('_id');
      const matchingUserIds = matchingUsers.map((u) => u._id);

      queryConditions.$or = [
        { user: { $in: matchingUserIds } },
        { company: { $regex: searchRegex } },
        { designation: { $regex: searchRegex } },
        { skills: { $in: [searchRegex] } },
        { expertise: { $in: [searchRegex] } },
        { bio: { $regex: searchRegex } },
      ];
    }

    // Total count for pagination
    const total = await AlumniProfile.countDocuments(queryConditions);

    // Fetch paginated results with populated user data (omitting password/sensitive fields)
    const alumniList = await AlumniProfile.find(queryConditions)
      .sort({ graduationYear: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email avatar role createdAt');

    // Filter out any orphaned documents where user is null
    const validAlumni = alumniList.filter((item) => item.user !== null);

    // Fetch distinct filter metadata to populate dynamic filter chips on the frontend
    const [companies, allSkills, years] = await Promise.all([
      AlumniProfile.distinct('company'),
      AlumniProfile.distinct('skills'),
      AlumniProfile.distinct('graduationYear'),
    ]);

    res.status(200).json({
      success: true,
      count: validAlumni.length,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      currentPage: page,
      filters: {
        companies: companies.filter(Boolean).sort(),
        skills: allSkills.filter(Boolean).sort(),
        graduationYears: years.filter(Boolean).sort((a, b) => b - a),
      },
      data: validAlumni,
    });
  } catch (error) {
    console.error('Error fetching alumni directory:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving alumni directory',
    });
  }
};

/**
 * GET /api/profile/alumni/:id
 * Retrieves details for a specific alumni by profile ID or user ID.
 */
const getAlumniById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid alumni ID format',
      });
    }

    // Check if ID is an AlumniProfile ID or a User ID
    let alumni = await AlumniProfile.findById(id).populate(
      'user',
      'name email avatar role createdAt'
    );

    if (!alumni) {
      alumni = await AlumniProfile.findOne({ user: id }).populate(
        'user',
        'name email avatar role createdAt'
      );
    }

    if (!alumni) {
      return res.status(404).json({
        success: false,
        message: 'Alumni profile not found',
      });
    }

    res.status(200).json({
      success: true,
      data: alumni,
    });
  } catch (error) {
    console.error('Error fetching alumni detail:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving alumni details',
    });
  }
};

/**
 * Realistic Demo Alumni Data Set
 */
const DEMO_ALUMNI = [
  {
    name: 'Priya Sharma',
    email: 'priya.sharma@alumni.anvaya.edu',
    role: 'alumni',
    graduationYear: 2019,
    company: 'Google India',
    designation: 'Senior Software Engineer',
    experience: 5,
    location: 'Bengaluru, Karnataka',
    skills: ['React', 'Node.js', 'Go', 'Kubernetes', 'System Design', 'Cloud Architecture'],
    expertise: ['System Design', 'FAANG Interview Prep', 'Resume Review', 'Career Growth'],
    bio: 'Passionate full-stack & systems engineer at Google. 5+ years building high-scale distributed services. Happy to guide juniors on coding interviews and system design.',
    availableForMentorship: true,
  },
  {
    name: 'Rohan Verma',
    email: 'rohan.verma@alumni.anvaya.edu',
    role: 'alumni',
    graduationYear: 2020,
    company: 'Microsoft',
    designation: 'Software Engineer II',
    experience: 4,
    location: 'Hyderabad, Telangana',
    skills: ['C#', '.NET Core', 'Azure', 'TypeScript', 'Microservices', 'GraphQL'],
    expertise: ['Cloud Infrastructure', 'Backend Engineering', 'Mock Interviews'],
    bio: 'Building enterprise cloud solutions on Azure at Microsoft IDC. Always enthusiastic about helping students transition into software careers.',
    availableForMentorship: true,
  },
  {
    name: 'Sneha Reddy',
    email: 'sneha.reddy@alumni.anvaya.edu',
    role: 'alumni',
    graduationYear: 2021,
    company: 'Amazon',
    designation: 'SDE-2 (AWS)',
    experience: 3,
    location: 'Bengaluru, Karnataka',
    skills: ['Java', 'AWS', 'DynamoDB', 'Distributed Systems', 'Python'],
    expertise: ['DSA Mastery', 'AWS Certifications', 'Campus Placement Strategy'],
    bio: 'Software engineer at AWS working on high-throughput serverless systems. Mentoring students on LeetCode patterns and behavioral rounds.',
    availableForMentorship: true,
  },
  {
    name: 'Vikram Mehta',
    email: 'vikram.mehta@alumni.anvaya.edu',
    role: 'alumni',
    graduationYear: 2018,
    company: 'Zomato',
    designation: 'Lead Product Manager',
    experience: 6,
    location: 'Gurugram, Haryana',
    skills: ['Product Strategy', 'Data Analytics', 'Agile', 'UI/UX', 'A/B Testing', 'Growth'],
    expertise: ['Product Management', 'Startup Careers', 'Case Study Preparation'],
    bio: 'Leading product initiatives for customer growth at Zomato. B.Tech alumnus turned Product Leader. Ready to assist aspiring PMs and founders.',
    availableForMentorship: true,
  },
  {
    name: 'Divya Iyer',
    email: 'divya.iyer@alumni.anvaya.edu',
    role: 'alumni',
    graduationYear: 2022,
    company: 'Infosys Labs',
    designation: 'AI / Machine Learning Engineer',
    experience: 2,
    location: 'Pune, Maharashtra',
    skills: ['Python', 'PyTorch', 'TensorFlow', 'NLP', 'Computer Vision', 'LangChain'],
    expertise: ['Machine Learning', 'Research Papers', 'Final Year Projects'],
    bio: 'AI researcher and practitioner focusing on Generative AI and NLP workflows. Can guide students on machine learning project selection and tech stacks.',
    availableForMentorship: true,
  },
  {
    name: 'Arjun Nair',
    email: 'arjun.nair@alumni.anvaya.edu',
    role: 'alumni',
    graduationYear: 2020,
    company: 'Razorpay',
    designation: 'Staff Frontend Engineer',
    experience: 4,
    location: 'Bengaluru, Karnataka',
    skills: ['React', 'Next.js', 'Web Performance', 'TypeScript', 'TailwindCSS', 'Accessibility'],
    expertise: ['Frontend Architecture', 'Open Source', 'Portfolio Review'],
    bio: 'Fintech web engineer obsessed with micro-interactions, accessibility, and high-performance React architectures at Razorpay.',
    availableForMentorship: true,
  },
];

/**
 * POST /api/profile/seed-alumni
 * Seeds demo alumni into the database if none exist or when force=true.
 * Creates real User and AlumniProfile records with encrypted passwords.
 */
const seedAlumni = async (req, res) => {
  try {
    const existingCount = await AlumniProfile.countDocuments();
    const force = req.query.force === 'true' || req.body.force === true;

    if (existingCount > 0 && !force) {
      return res.status(200).json({
        success: true,
        message: `Database already contains ${existingCount} alumni profile(s). Use ?force=true to re-seed.`,
        count: existingCount,
      });
    }

    const createdProfiles = [];

    for (const data of DEMO_ALUMNI) {
      // Find or create User
      let user = await User.findOne({ email: data.email });
      if (!user) {
        user = await User.create({
          name: data.name,
          email: data.email,
          password: 'Password@123',
          role: 'alumni',
          bio: data.bio,
        });
      }

      // Find or upsert AlumniProfile
      const profile = await AlumniProfile.findOneAndUpdate(
        { user: user._id },
        {
          $set: {
            user: user._id,
            graduationYear: data.graduationYear,
            company: data.company,
            designation: data.designation,
            experience: data.experience,
            skills: data.skills,
            expertise: data.expertise,
            bio: data.bio,
            location: data.location,
            availableForMentorship: data.availableForMentorship,
          },
        },
        { new: true, upsert: true }
      );

      createdProfiles.push(profile);
    }

    res.status(201).json({
      success: true,
      message: `Successfully seeded ${createdProfiles.length} verified demo alumni profiles!`,
      count: createdProfiles.length,
    });
  } catch (error) {
    console.error('Error seeding demo alumni:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while seeding demo alumni: ' + error.message,
    });
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  getAlumniDirectory,
  getAlumniById,
  seedAlumni,
};
