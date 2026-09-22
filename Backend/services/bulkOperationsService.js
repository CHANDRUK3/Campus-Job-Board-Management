const XLSX = require('xlsx');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const Drive = require('../models/Drive');
const Company = require('../models/company');
const User = require('../models/user');
const emailService = require('./emailService');

class BulkOperationsService {
  // Bulk import jobs from Excel/CSV
  static async importJobsFromFile(filePath, adminEmail) {
    try {
      const fileExtension = path.extname(filePath).toLowerCase();
      let jobs = [];

      if (fileExtension === '.xlsx' || fileExtension === '.xls') {
        jobs = await this.parseExcelFile(filePath);
      } else if (fileExtension === '.csv') {
        jobs = await this.parseCSVFile(filePath);
      } else {
        throw new Error('Unsupported file format. Please use Excel (.xlsx, .xls) or CSV files.');
      }

      // Validate and process jobs
      const validatedJobs = await this.validateAndProcessJobs(jobs, adminEmail);
      
      // Bulk insert jobs
      const insertedJobs = await Drive.insertMany(validatedJobs);
      
      // Send notifications to students
      await this.notifyStudentsAboutNewJobs(insertedJobs);

      return {
        success: true,
        totalProcessed: jobs.length,
        successfullyImported: insertedJobs.length,
        failed: jobs.length - insertedJobs.length,
        jobs: insertedJobs
      };
    } catch (error) {
      throw new Error(`Bulk import failed: ${error.message}`);
    }
  }

  // Parse Excel file
  static async parseExcelFile(filePath) {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    return data.map(row => ({
      company: row.Company || row.company,
      role: row.Role || row.role || row['Job Title'] || row.jobTitle,
      description: row.Description || row.description,
      skills: row.Skills || row.skills,
      package: row.Package || row.package || row.Salary || row.salary,
      location: row.Location || row.location,
      jobType: row['Job Type'] || row.jobType || row['JobType'],
      workMode: row['Work Mode'] || row.workMode || row['WorkMode'],
      members: row.Members || row.members || row.Positions || row.positions,
      registrationDeadline: row['Registration Deadline'] || row.registrationDeadline || row['RegistrationDeadline'] || row['Application Deadline'],
    }));
  }

  // Parse CSV file
  static async parseCSVFile(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  }

  // Validate and process jobs
  static async validateAndProcessJobs(jobs, adminEmail) {
    const validatedJobs = [];
    const errors = [];

    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      try {
        // Validate required fields
        if (!job.company || !job.role || !job.description || !job.package) {
          throw new Error(`Row ${i + 1}: Missing required fields (company, role, description, package)`);
        }

        // Find or create company
        let companyDoc = await Company.findOne({ name: { $regex: new RegExp(`^${job.company.trim()}$`, 'i') } });
        if (!companyDoc) {
          companyDoc = new Company({
            name: job.company.trim(),
            industry: 'Other',
            description: 'Imported via bulk upload'
          });
          await companyDoc.save();
        }

        // Process skills
        const skills = Array.isArray(job.skills) ? job.skills : 
                      job.skills ? job.skills.split(',').map(s => s.trim()) : [];

        // Process locations
        const locations = Array.isArray(job.location) ? job.location : 
                      job.location ? job.location.split(',').map(s => s.trim()) : ['Not specified'];

        // Process package
        const packageCtc = parseFloat(job.package) || 0;

        // Process deadline
        let registrationDeadline = new Date();
        if (job.registrationDeadline) {
          registrationDeadline = new Date(job.registrationDeadline);
          if (isNaN(registrationDeadline.getTime())) {
            registrationDeadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
          }
        } else {
          registrationDeadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
        }

        const validatedJob = {
          companyId: companyDoc._id,
          role: job.role.trim(),
          description: job.description.trim(),
          skills: skills,
          package: packageCtc,
          location: locations,
          jobType: job.jobType?.trim() || 'full-time',
          workMode: job.workMode?.trim() || 'onsite',
          members: parseInt(job.members) || 1,
          importantDates: {
            registrationDeadline: registrationDeadline
          },
          status: 'active',
          createdBy: adminEmail
        };

        validatedJobs.push(validatedJob);
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error.message}`);
      }
    }

    if (errors.length > 0) {
      console.warn('Validation errors:', errors);
    }

    return validatedJobs;
  }

  // Notify students about new jobs
  static async notifyStudentsAboutNewJobs(jobs) {
    try {
      const students = await User.find({ role: 'student', isActive: true });
      
      for (const job of jobs) {
        await emailService.sendJobNotification(job, students);
      }
    } catch (error) {
      console.error('Failed to notify students:', error.message);
    }
  }

  // Bulk export jobs to Excel
  static async exportJobsToExcel(adminEmail, filters = {}) {
    try {
      const query = { createdBy: adminEmail, ...filters };
      const drives = await Drive.find(query).populate('companyId', 'name').lean();

      const exportData = drives.map(drive => ({
        'Company': drive.companyId?.name || 'Unknown',
        'Role': drive.role,
        'Description': drive.description,
        'Skills': Array.isArray(drive.skills) ? drive.skills.join(', ') : drive.skills,
        'Package': drive.package || 0,
        'Location': Array.isArray(drive.location) ? drive.location.join(', ') : drive.location,
        'Job Type': drive.jobType,
        'Work Mode': drive.workMode,
        'Positions': drive.members,
        'Registration Deadline': drive.importantDates?.registrationDeadline ? new Date(drive.importantDates.registrationDeadline).toLocaleDateString() : '',
        'Status': drive.status,
        'Created At': new Date(drive.createdAt).toLocaleDateString()
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Jobs');

      const fileName = `jobs_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      const filePath = path.join(__dirname, '../uploads/exports', fileName);
      
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      XLSX.writeFile(workbook, filePath);

      return {
        success: true,
        fileName,
        filePath,
        recordCount: exportData.length
      };
    } catch (error) {
      throw new Error(`Export failed: ${error.message}`);
    }
  }

  // Bulk export students to Excel
  static async exportStudentsToExcel(filters = {}) {
    try {
      const query = { role: 'student', ...filters };
      const students = await User.find(query).lean();

      const exportData = students.map(student => ({
        'Name': student.name,
        'Email': student.email,
        'Status': student.isActive ? 'Active' : 'Inactive',
        'Last Login': student.lastLogin ? new Date(student.lastLogin).toLocaleDateString() : 'Never',
        'Created At': new Date(student.createdAt).toLocaleDateString()
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

      const fileName = `students_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      const filePath = path.join(__dirname, '../uploads/exports', fileName);
      
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      XLSX.writeFile(workbook, filePath);

      return {
        success: true,
        fileName,
        filePath,
        recordCount: exportData.length
      };
    } catch (error) {
      throw new Error(`Export failed: ${error.message}`);
    }
  }

  // Bulk email to students
  static async sendBulkEmailToStudents(subject, message, filters = {}) {
    try {
      const query = { role: 'student', isActive: true, ...filters };
      const students = await User.find(query).select('email name');

      if (students.length === 0) {
        throw new Error('No students found matching the criteria');
      }

      await emailService.sendBulkEmail(students, subject, message);

      return {
        success: true,
        recipientsCount: students.length,
        message: 'Bulk email sent successfully'
      };
    } catch (error) {
      throw new Error(`Bulk email failed: ${error.message}`);
    }
  }

  // Bulk update job status
  static async bulkUpdateJobStatus(jobIds, status, adminEmail) {
    try {
      const result = await Drive.updateMany(
        { 
          _id: { $in: jobIds },
          createdBy: adminEmail // Ensure admin can only update their own jobs
        },
        { status: status }
      );

      return {
        success: true,
        modifiedCount: result.modifiedCount,
        message: `${result.modifiedCount} jobs updated to ${status} status`
      };
    } catch (error) {
      throw new Error(`Bulk update failed: ${error.message}`);
    }
  }

  // Bulk delete jobs
  static async bulkDeleteJobs(jobIds, adminEmail) {
    try {
      const result = await Drive.deleteMany({
        _id: { $in: jobIds },
        createdBy: adminEmail // Ensure admin can only delete their own jobs
      });

      return {
        success: true,
        deletedCount: result.deletedCount,
        message: `${result.deletedCount} jobs deleted successfully`
      };
    } catch (error) {
      throw new Error(`Bulk delete failed: ${error.message}`);
    }
  }

  // Get bulk operation template
  static getJobImportTemplate() {
    const templateData = [
      {
        'Company': 'Example Company',
        'Role': 'Software Developer',
        'Description': 'We are looking for a skilled software developer...',
        'Skills': 'JavaScript, React, Node.js',
        'Package': 8,
        'Location': 'Bangalore, Mumbai',
        'Job Type': 'full-time',
        'Work Mode': 'hybrid',
        'Members': 2,
        'Registration Deadline': '2024-12-31'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Job Template');

    const fileName = 'job_import_template.xlsx';
    const filePath = path.join(__dirname, '../uploads/templates', fileName);
    
    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    XLSX.writeFile(workbook, filePath);

    return {
      success: true,
      fileName,
      filePath
    };
  }
}

module.exports = BulkOperationsService;
