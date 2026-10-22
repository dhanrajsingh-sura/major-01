const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const AlumniProfile = require('../models/AlumniProfile');

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

async function seed() {
  try {
    console.log('Connecting to MongoDB Atlas (dbName: anvaya)...');
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'anvaya' });
    console.log('Connected to database.');

    let createdCount = 0;
    for (const item of DEMO_ALUMNI) {
      // Find or create User
      let user = await User.findOne({ email: item.email });
      if (!user) {
        user = await User.create({
          name: item.name,
          email: item.email,
          password: 'Password@123',
          role: 'alumni',
          bio: item.bio,
        });
        console.log(`Created User: ${user.name} (${user.email})`);
      }

      // Upsert AlumniProfile
      await AlumniProfile.findOneAndUpdate(
        { user: user._id },
        {
          $set: {
            user: user._id,
            graduationYear: item.graduationYear,
            company: item.company,
            designation: item.designation,
            experience: item.experience,
            skills: item.skills,
            expertise: item.expertise,
            bio: item.bio,
            location: item.location,
            availableForMentorship: item.availableForMentorship,
          },
        },
        { new: true, upsert: true }
      );
      createdCount++;
    }

    console.log(`Successfully seeded ${createdCount} alumni demo profiles!`);
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

seed();
