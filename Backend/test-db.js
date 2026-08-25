const mongoose = require('mongoose');
const Company = require('./models/company');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/jobboard', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('✅ MongoDB connected');
  
  // Get all companies
  const allCompanies = await Company.find({});
  console.log('\n📋 All companies in database:');
  allCompanies.forEach((company, index) => {
    console.log(`${index + 1}. ${company.company} - ${company.jobTitle}`);
    console.log(`   Status: ${company.status}`);
    console.log(`   Created: ${company.createdAt}`);
    console.log(`   Deadline: ${company.applicationDeadline}`);
    console.log(`   ID: ${company._id}`);
    console.log('---');
  });
  
  // Check specifically for TCS
  const tcsJobs = await Company.find({ company: { $regex: 'tcs', $options: 'i' } });
  console.log('\n🔍 TCS jobs found:');
  tcsJobs.forEach((job, index) => {
    console.log(`${index + 1}. ${job.company} - ${job.jobTitle}`);
    console.log(`   Status: ${job.status}`);
    console.log(`   Created: ${job.createdAt}`);
    console.log(`   Deadline: ${job.applicationDeadline}`);
    console.log(`   ID: ${job._id}`);
  });
  
  // Check active jobs only
  const activeJobs = await Company.find({ status: 'active' });
  console.log('\n✅ Active jobs:');
  activeJobs.forEach((job, index) => {
    console.log(`${index + 1}. ${job.company} - ${job.jobTitle}`);
  });
  
  // Check jobs with future deadlines
  const now = new Date();
  const futureJobs = await Company.find({ 
    status: 'active',
    applicationDeadline: { $gt: now }
  });
  console.log('\n⏰ Jobs with future deadlines:');
  futureJobs.forEach((job, index) => {
    console.log(`${index + 1}. ${job.company} - ${job.jobTitle}`);
    console.log(`   Deadline: ${job.applicationDeadline}`);
  });
  
  process.exit(0);
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});
