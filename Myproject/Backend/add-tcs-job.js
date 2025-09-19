const mongoose = require('mongoose');
const Company = require('./models/company');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/jobboard', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('✅ MongoDB connected');
  
  // Add TCS job
  const tcsJob = new Company({
    company: 'TCS',
    jobTitle: 'Software Developer',
    description: 'Join TCS as a Software Developer and work on cutting-edge projects. We are looking for talented individuals with strong programming skills and a passion for technology.',
    skills: ['Java', 'Spring Boot', 'Microservices', 'SQL', 'JavaScript'],
    salary: {
      min: 6,
      max: 12,
      currency: 'INR'
    },
    location: 'Bangalore',
    jobType: 'full-time',
    experienceLevel: 'fresher',
    members: 5,
    applicationDeadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
    contactEmail: 'careers@tcs.com',
    website: 'https://www.tcs.com',
    status: 'active',
    createdBy: 'admin@campus.edu',
    requirements: [
      'Bachelor\'s degree in Computer Science or related field',
      'Strong programming skills in Java',
      'Knowledge of Spring Framework',
      'Good communication skills',
      'Team player attitude'
    ],
    benefits: [
      'Competitive salary package',
      'Health insurance',
      'Learning and development opportunities',
      'Work-life balance',
      'Career growth prospects'
    ]
  });

  try {
    await tcsJob.save();
    console.log('✅ TCS job added successfully!');
    console.log('Job ID:', tcsJob._id);
    console.log('Company:', tcsJob.company);
    console.log('Title:', tcsJob.jobTitle);
    console.log('Status:', tcsJob.status);
    console.log('Deadline:', tcsJob.applicationDeadline);
  } catch (error) {
    console.error('❌ Error adding TCS job:', error);
  }
  
  process.exit(0);
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});
