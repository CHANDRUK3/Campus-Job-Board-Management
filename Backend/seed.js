const mongoose = require('mongoose');
const Company = require('./models/company');
const User = require('./models/user');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/jobboard', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const sampleJobs = [
  {
    company: 'TechCorp Solutions',
    jobTitle: 'Software Engineer',
    description: 'We are looking for a talented software engineer to join our development team. You will work on cutting-edge projects using modern technologies.',
    skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
    salary: { min: 6, max: 10, currency: 'INR' },
    location: 'Bangalore',
    jobType: 'full-time',
    experienceLevel: 'fresher',
    members: 3,
    applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    contactEmail: 'hr@techcorp.com',
    website: 'https://techcorp.com',
    status: 'active',
    createdBy: 'admin@campus.edu'
  },
  {
    company: 'DataFlow Inc',
    jobTitle: 'Data Analyst',
    description: 'Join our data team to analyze large datasets and provide insights for business decisions. Experience with Python and SQL required.',
    skills: ['Python', 'SQL', 'Pandas', 'Machine Learning'],
    salary: { min: 5, max: 8, currency: 'INR' },
    location: 'Mumbai',
    jobType: 'full-time',
    experienceLevel: '1-2 years',
    members: 2,
    applicationDeadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    contactEmail: 'careers@dataflow.com',
    website: 'https://dataflow.com',
    status: 'active',
    createdBy: 'admin@campus.edu'
  },
  {
    company: 'CloudTech Systems',
    jobTitle: 'DevOps Engineer',
    description: 'We need a DevOps engineer to manage our cloud infrastructure and deployment pipelines. AWS and Docker experience preferred.',
    skills: ['AWS', 'Docker', 'Kubernetes', 'Linux'],
    salary: { min: 7, max: 12, currency: 'INR' },
    location: 'Hyderabad',
    jobType: 'full-time',
    experienceLevel: '3-5 years',
    members: 1,
    applicationDeadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    contactEmail: 'jobs@cloudtech.com',
    website: 'https://cloudtech.com',
    status: 'active',
    createdBy: 'admin@campus.edu'
  },
  {
    company: 'StartupXYZ',
    jobTitle: 'Frontend Developer',
    description: 'Join our fast-growing startup as a frontend developer. Work with React, TypeScript, and modern web technologies.',
    skills: ['React', 'TypeScript', 'CSS', 'Webpack'],
    salary: { min: 4, max: 7, currency: 'INR' },
    location: 'Pune',
    jobType: 'full-time',
    experienceLevel: 'fresher',
    members: 2,
    applicationDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    contactEmail: 'team@startupxyz.com',
    website: 'https://startupxyz.com',
    status: 'active',
    createdBy: 'admin@campus.edu'
  },
  {
    company: 'FinanceFirst',
    jobTitle: 'Backend Developer',
    description: 'Develop robust backend systems for our financial platform. Experience with Java Spring Boot and microservices architecture.',
    skills: ['Java', 'Spring Boot', 'Microservices', 'PostgreSQL'],
    salary: { min: 8, max: 15, currency: 'INR' },
    location: 'Delhi',
    jobType: 'full-time',
    experienceLevel: '3-5 years',
    members: 1,
    applicationDeadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
    contactEmail: 'careers@financefirst.com',
    website: 'https://financefirst.com',
    status: 'active',
    createdBy: 'admin@campus.edu'
  }
];

const sampleUsers = [
  {
    name: 'Admin User',
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
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Check if database is already populated
    const existingJobs = await Company.countDocuments({});
    const existingUsers = await User.countDocuments({});
    
    if (existingJobs > 0 || existingUsers > 0) {
      console.log('📊 Database already contains data. Skipping seed to preserve existing data.');
      console.log(`   Jobs: ${existingJobs}, Users: ${existingUsers}`);
      return;
    }

    console.log('📝 Database is empty, adding sample data...');

    // Create sample users
    const users = await User.insertMany(sampleUsers);
    console.log(`👥 Created ${users.length} users`);

    // Create sample jobs
    const jobs = await Company.insertMany(sampleJobs);
    console.log(`💼 Created ${jobs.length} jobs`);

    console.log('✅ Database seeded successfully!');
    console.log('\n📋 Sample Accounts:');
    console.log('Admin: admin@campus.edu / Admin123!');
    console.log('Student: john@student.edu / Student123!');
    console.log('Student: jane@student.edu / Student123!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    mongoose.connection.close();
  }
}

seedDatabase();
