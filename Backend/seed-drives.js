const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/user');
const Company = require('./models/company');
const Drive = require('./models/Drive');
const StudentProfile = require('./models/StudentProfile');
const Application = require('./models/Application');
const Notification = require('./models/Notification');
const OptStatus = require('./models/OptStatus');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/jobboard', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('✅ MongoDB connected for seeding'))
  .catch(err => console.error('❌ Connection error:', err));

const sampleUsers = [
  {
    name: 'Placement Admin',
    email: 'admin@campus.edu',
    password: 'Admin123!',
    role: 'admin',
    isActive: true
  },
  {
    name: 'HR Recruiter',
    email: 'recruiter@techcorp.com',
    password: 'Recruiter123!',
    role: 'recruiter',
    isActive: true
  },
  {
    name: 'John Doe',
    email: 'john@student.edu',
    password: 'Student123!',
    role: 'student',
    isActive: true
  },
  {
    name: 'Jane Smith',
    email: 'jane@student.edu',
    password: 'Student123!',
    role: 'student',
    isActive: true
  },
  {
    name: 'Bob Jenkins',
    email: 'bob@student.edu',
    password: 'Student123!',
    role: 'student',
    isActive: true
  }
];

const sampleCompanies = [
  {
    name: 'TechCorp Solutions',
    description: 'TechCorp Solutions is a global IT services and consulting company delivering digital transformation solutions to fortune 500 enterprises.',
    logo: 'https://logo.clearbit.com/techcorp.com',
    website: 'https://techcorp.com',
    industry: 'Information Technology',
    contactEmail: 'hr@techcorp.com'
  },
  {
    name: 'DataFlow Inc',
    description: 'DataFlow Inc is a pioneering product analytics company building scalable ML platforms for real-time customer data intelligence.',
    logo: 'https://logo.clearbit.com/dataflow.com',
    website: 'https://dataflow.com',
    industry: 'Software / Data Analytics',
    contactEmail: 'careers@dataflow.com'
  },
  {
    name: 'CloudTech Systems',
    description: 'CloudTech Systems is an industry-leading DevOps and enterprise cloud operations consultancy supporting serverless infra setups.',
    logo: 'https://logo.clearbit.com/cloudtech.com',
    website: 'https://cloudtech.com',
    industry: 'Cloud Infrastructure',
    contactEmail: 'jobs@cloudtech.com'
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Company.deleteMany({});
    await Drive.deleteMany({});
    await StudentProfile.deleteMany({});
    await Application.deleteMany({});
    await Notification.deleteMany({});
    await OptStatus.deleteMany({});
    console.log('🗑️ Cleared existing database collections.');

    // 1. Create Users
    const hashedUsers = [];
    for (const u of sampleUsers) {
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(u.password, salt);
      hashedUsers.push({
        ...u,
        password: hashedPassword
      });
    }

    const createdUsers = await User.insertMany(hashedUsers);
    console.log(`👥 Created ${createdUsers.length} users`);

    const adminUser = createdUsers.find(u => u.role === 'admin');
    const johnUser = createdUsers.find(u => u.email === 'john@student.edu');
    const janeUser = createdUsers.find(u => u.email === 'jane@student.edu');
    const bobUser = createdUsers.find(u => u.email === 'bob@student.edu');

    // 2. Create Companies
    const createdCompanies = await Company.insertMany(sampleCompanies);
    console.log(`🏢 Created ${createdCompanies.length} companies`);

    const techCorp = createdCompanies.find(c => c.name === 'TechCorp Solutions');
    const dataFlow = createdCompanies.find(c => c.name === 'DataFlow Inc');
    const cloudTech = createdCompanies.find(c => c.name === 'CloudTech Systems');

    // 3. Create Drives
    const sampleDrives = [
      {
        companyId: techCorp._id,
        role: 'Software Engineer',
        package: 10, // 10 LPA
        description: 'Join the core platform engineering team working on React dashboard frameworks, microservices architecture in Node.js, and high performance MongoDB query engines. Requires analytical thinking and solid understanding of data structures.',
        skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
        location: ['Bangalore', 'Remote'],
        workMode: 'hybrid',
        jobType: 'full-time',
        members: 5,
        eligibilityRules: {
          minCgpa: 6.5,
          allowedDepartments: ['CSE', 'ECE'],
          maxBacklogs: 0,
          gradYears: [2026, 2027],
          allowPlaced: true
        },
        importantDates: {
          registrationDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
          testDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
          interviewDate: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000)
        },
        selectionProcess: ['Online Aptitude Test', 'Technical Round 1', 'Managerial Interview', 'HR round'],
        status: 'active',
        createdBy: adminUser.email
      },
      {
        companyId: dataFlow._id,
        role: 'Data Analyst',
        package: 7.5,
        description: 'Responsible for building ETL pipelines, analyzing user engagement event streams, and creating business visualization dashboards. Experience with Python, Pandas, SQL, and Tableau is required.',
        skills: ['Python', 'SQL', 'Pandas', 'Tableau'],
        location: ['Mumbai'],
        workMode: 'onsite',
        jobType: 'full-time',
        members: 3,
        eligibilityRules: {
          minCgpa: 6.0,
          allowedDepartments: ['CSE', 'ECE', 'EEE'],
          maxBacklogs: 1,
          gradYears: [2025, 2026],
          allowPlaced: true
        },
        importantDates: {
          registrationDeadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          testDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
          interviewDate: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000)
        },
        selectionProcess: ['Resume Shortlisting', 'Online Coding Test', 'Technical Interview'],
        status: 'active',
        createdBy: adminUser.email
      },
      {
        companyId: cloudTech._id,
        role: 'DevOps Intern',
        package: 4.8, // 4.8 LPA (equivalent to 40k monthly)
        description: 'Help manage cloud infrastructure provisioning using Terraform. Set up CI/CD automation pipelines in GitHub actions. Monitor AWS cloud metrics and maintain Docker swarm container registries.',
        skills: ['AWS', 'Docker', 'Linux', 'GitHub Actions'],
        location: ['Hyderabad'],
        workMode: 'remote',
        jobType: 'internship',
        members: 2,
        eligibilityRules: {
          minCgpa: 7.5,
          allowedDepartments: ['CSE'],
          maxBacklogs: 0,
          gradYears: [2026],
          allowPlaced: false // Places check! Block placed students
        },
        importantDates: {
          registrationDeadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
          testDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
          interviewDate: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000)
        },
        selectionProcess: ['Technical MCQs Test', 'AWS Hands-on Test', 'Technical/HR round'],
        status: 'active',
        createdBy: adminUser.email
      }
    ];

    const createdDrives = await Drive.insertMany(sampleDrives);
    console.log(`💼 Created ${createdDrives.length} active recruitment drives`);

    // 4. Create Student Profiles (John: CSE 8.2 verified, Jane: ECE 6.8 verified, Bob: CSE null pending)
    const sampleStudentProfiles = [
      {
        user: johnUser._id,
        rollNo: 'CS202301',
        department: 'CSE',
        branch: 'B.Tech',
        cgpa: 8.2,
        backlogs: 0,
        gradYear: 2026,
        phone: '9876543210',
        skills: ['JavaScript', 'React', 'Node.js', 'Python'],
        locationPref: ['Bangalore', 'Remote'],
        profileStatus: 'verified',
        academicHistory: 'B.Tech Computer Science and Engineering, CGPA: 8.2/10.0 (Aggregate). 12th State Board: 94%. 10th CBSE: 9.8 CGPA.',
        portfolioUrl: 'https://johndoe.dev',
        resumePath: '/uploads/resumes/john_sample.pdf'
      },
      {
        user: janeUser._id,
        rollNo: 'EC202302',
        department: 'ECE',
        branch: 'B.Tech',
        cgpa: 6.5,
        backlogs: 0,
        gradYear: 2026,
        phone: '9876543211',
        skills: ['Python', 'SQL', 'C++', 'Embedded Systems'],
        locationPref: ['Mumbai', 'Hyderabad'],
        profileStatus: 'verified',
        academicHistory: 'B.Tech Electronics and Communication Engineering, CGPA: 6.5/10.0. 12th Board: 88%.',
        portfolioUrl: 'https://janesmith.dev',
        resumePath: '/uploads/resumes/jane_sample.pdf'
      }
      // Bob is left without profile to test onboarding profile setup wizard on first login
    ];

    const createdProfiles = await StudentProfile.insertMany(sampleStudentProfiles);
    console.log(`👨‍🎓 Created ${createdProfiles.length} verified student profiles. Bob Jenkins email = bob@student.edu is left unseeded to verify profile setup flow.`);

    console.log('✅ Seeding completed successfully!');
    console.log('\n🔐 Credentials:');
    console.log('   Admin:      admin@campus.edu / Admin123!');
    console.log('   Recruiter:  recruiter@techcorp.com / Recruiter123!');
    console.log('   Student 1:  john@student.edu / Student123! (Verified, CSE, 8.2 CGPA)');
    console.log('   Student 2:  jane@student.edu / Student123! (Verified, ECE, 6.5 CGPA)');
    console.log('   Student 3:  bob@student.edu / Student123!  (Pending setup, CSE)');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    mongoose.connection.close();
  }
}

seedDatabase();
