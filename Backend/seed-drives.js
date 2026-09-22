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
mongoose.connect('mongodb://localhost:27017/jobboard')
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
        package: 10.0, // 10 LPA
        description: 'Join the core platform engineering team working on React dashboard frameworks, microservices architecture in Node.js, and high performance MongoDB query engines.',
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
          registrationDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
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
        description: 'Responsible for building ETL pipelines, analyzing user engagement event streams, and creating business visualization dashboards using Python, Pandas, and SQL.',
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
        package: 4.8,
        description: 'Help manage cloud infrastructure provisioning using Terraform. Set up CI/CD automation pipelines in GitHub Actions and monitor AWS cloud metrics.',
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
          allowPlaced: false
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

    const techCorpDrive = createdDrives.find(d => d.role === 'Software Engineer');
    const dataFlowDrive = createdDrives.find(d => d.role === 'Data Analyst');
    const cloudTechDrive = createdDrives.find(d => d.role === 'DevOps Intern');

    // 4. Create Student Profiles for all 3 students
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
        academicHistory: 'B.Tech Computer Science & Engineering, CGPA: 8.2/10.0. 12th Board: 94%. 10th CBSE: 9.8 CGPA.',
        portfolioUrl: 'https://johndoe.dev',
        resumePath: '/uploads/resumes/john_sample.pdf'
      },
      {
        user: janeUser._id,
        rollNo: 'EC202302',
        department: 'ECE',
        branch: 'B.Tech',
        cgpa: 6.8,
        backlogs: 0,
        gradYear: 2026,
        phone: '9876543211',
        skills: ['Python', 'SQL', 'C++', 'Embedded Systems'],
        locationPref: ['Mumbai', 'Hyderabad'],
        profileStatus: 'verified',
        academicHistory: 'B.Tech Electronics & Communication Engineering, CGPA: 6.8/10.0. 12th Board: 88%.',
        portfolioUrl: 'https://janesmith.dev',
        resumePath: '/uploads/resumes/jane_sample.pdf'
      },
      {
        user: bobUser._id,
        rollNo: 'CS202303',
        department: 'CSE',
        branch: 'B.Tech',
        cgpa: 8.5,
        backlogs: 0,
        gradYear: 2026,
        phone: '9876543212',
        skills: ['JavaScript', 'React', 'AWS', 'Docker', 'Python'],
        locationPref: ['Bangalore', 'Hyderabad', 'Remote'],
        profileStatus: 'verified',
        academicHistory: 'B.Tech Computer Science & Engineering, CGPA: 8.5/10.0. 12th Board: 96%.',
        portfolioUrl: 'https://bobjenkins.dev',
        resumePath: '/uploads/resumes/bob_sample.pdf'
      }
    ];

    const createdProfiles = await StudentProfile.insertMany(sampleStudentProfiles);
    console.log(`👨‍🎓 Created ${createdProfiles.length} verified student profiles.`);

    // 5. Create Sample Applications with Rich Timeline Stepper Data
    const sampleApplications = [
      {
        student: johnUser._id,
        drive: techCorpDrive._id,
        status: 'technical_interview',
        timeline: [
          { stage: 'applied', timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), notes: 'Application submitted via student portal.' },
          { stage: 'verified', timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), notes: 'Academic profile verified by Placement Cell.' },
          { stage: 'test_scheduled', timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), notes: 'Online Aptitude & Technical MCQs test scheduled.' },
          { stage: 'test_completed', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), notes: 'Scored 88/100 in Technical MCQs.' },
          { stage: 'shortlisted', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), notes: 'Shortlisted for Technical Round 1.' },
          { stage: 'technical_interview', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), notes: 'Technical Interview scheduled.' }
        ],
        testInterviewDetails: {
          date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          time: '10:30 AM IST',
          venue: 'Placement Block Auditorium / Google Meet',
          meetingLink: 'https://meet.google.com/abc-defg-hij',
          instructions: 'Please bring 2 updated resume copies, valid college ID, and ensure stable internet.'
        }
      },
      {
        student: janeUser._id,
        drive: dataFlowDrive._id,
        status: 'applied',
        timeline: [
          { stage: 'applied', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), notes: 'Application submitted.' }
        ]
      }
    ];

    const createdApps = await Application.insertMany(sampleApplications);
    console.log(`📑 Created ${createdApps.length} sample applications with timeline data`);

    // 6. Create Notifications
    const sampleNotifications = [
      {
        recipient: 'john@student.edu',
        recipientId: johnUser._id,
        type: 'interview_scheduled',
        title: 'Technical Interview Scheduled',
        message: 'Your Technical Interview with TechCorp Solutions for Software Engineer is scheduled for 10:30 AM.',
        link: '/student/applications',
        relatedDriveId: techCorpDrive._id,
        relatedApplicationId: createdApps[0]._id,
        isRead: false
      },
      {
        recipient: 'jane@student.edu',
        recipientId: janeUser._id,
        type: 'drive_published',
        title: 'New Drive Published',
        message: 'DataFlow Inc has posted a Data Analyst drive matching your ECE department criteria.',
        link: '/student/drives',
        relatedDriveId: dataFlowDrive._id,
        isRead: false
      },
      {
        recipient: 'bob@student.edu',
        recipientId: bobUser._id,
        type: 'drive_published',
        title: 'Welcome to Placement Portal',
        message: 'Your student profile is verified! You can now explore placement drives and opt-in.',
        link: '/student/drives',
        isRead: false
      }
    ];

    await Notification.insertMany(sampleNotifications);
    console.log(`🔔 Created ${sampleNotifications.length} sample notifications`);

    console.log('✅ Seeding completed successfully!');
    console.log('\n🔐 Credentials:');
    console.log('   Admin:      admin@campus.edu / Admin123!');
    console.log('   Student 1:  john@student.edu / Student123! (Verified, CSE, 8.2 CGPA - Has Active Application & Interview Scheduled)');
    console.log('   Student 2:  jane@student.edu / Student123! (Verified, ECE, 6.8 CGPA)');
    console.log('   Student 3:  bob@student.edu  / Student123! (Verified, CSE, 8.5 CGPA)');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    mongoose.connection.close();
  }
}

seedDatabase();
