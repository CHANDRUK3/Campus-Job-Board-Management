const XLSX = require('xlsx');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
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
      const insertedJobs = await Company.insertMany(validatedJobs);
      
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
      jobTitle: row['Job Title'] || row.jobTitle || row['JobTitle'],
      description: row.Description || row.description,
      skills: row.Skills || row.skills,
      salaryMin: row['Salary Min'] || row.salaryMin || row['SalaryMin'],
      salaryMax: row['Salary Max'] || row.salaryMax || row['SalaryMax'],
      location: row.Location || row.location,
      jobType: row['Job Type'] || row.jobType || row['JobType'],
      experienceLevel: row['Experience Level'] || row.experienceLevel || row['ExperienceLevel'],
      members: row.Members || row.members || row.Positions || row.positions,
      applicationDeadline: row['Application Deadline'] || row.applicationDeadline || row['ApplicationDeadline'],
      contactEmail: row['Contact Email'] || row.contactEmail || row['ContactEmail'],
      website: row.Website || row.website
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
        if (!job.company || !job.jobTitle || !job.description) {
          throw new Error(`Row ${i + 1}: Missing required fields (company, jobTitle, description)`);
        }

        // Process skills
        const skills = Array.isArray(job.skills) ? job.skills : 
                      job.skills ? job.skills.split(',').map(s => s.trim()) : [];

        // Process salary
        const salaryMin = parseFloat(job.salaryMin) || 0;
        const salaryMax = parseFloat(job.salaryMax) || salaryMin;

        // Process deadline
        let applicationDeadline = new Date();
        if (job.applicationDeadline) {
          applicationDeadline = new Date(job.applicationDeadline);
          if (isNaN(applicationDeadline.getTime())) {
            applicationDeadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
          }
        } else {
          applicationDeadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
        }

        const validatedJob = {
          company: job.company.trim(),
          jobTitle: job.jobTitle.trim(),
          description: job.description.trim(),
          skills: skills,
          salary: {
            min: salaryMin,
            max: salaryMax,
            currency: 'INR'
          },
          location: job.location?.trim() || 'Not specified',
          jobType: job.jobType?.trim() || 'full-time',
          experienceLevel: job.experienceLevel?.trim() || 'fresher',
          members: parseInt(job.members) || 1,
          applicationDeadline: applicationDeadline,
          contactEmail: job.contactEmail?.trim(),
          website: job.website?.trim(),
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
      const jobs = await Company.find(query).lean();

      const exportData = jobs.map(job => ({
        'Company': job.company,
        'Job Title': job.jobTitle,
        'Description': job.description,
        'Skills': Array.isArray(job.skills) ? job.skills.join(', ') : job.skills,
        'Salary Min': job.salary?.min || 0,
        'Salary Max': job.salary?.max || 0,
        'Location': job.location,
        'Job Type': job.jobType,
        'Experience Level': job.experienceLevel,
        'Positions': job.members,
        'Application Deadline': new Date(job.applicationDeadline).toLocaleDateString(),
        'Status': job.status,
        'Contact Email': job.contactEmail || '',
        'Website': job.website || '',
        'Created At': new Date(job.createdAt).toLocaleDateString()
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
      const result = await Company.updateMany(
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
      const result = await Company.deleteMany({
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
        'Job Title': 'Software Developer',
        'Description': 'We are looking for a skilled software developer...',
        'Skills': 'JavaScript, React, Node.js',
        'Salary Min': 5,
        'Salary Max': 8,
        'Location': 'Bangalore',
        'Job Type': 'full-time',
        'Experience Level': 'fresher',
        'Members': 2,
        'Application Deadline': '2024-12-31',
        'Contact Email': 'hr@example.com',
        'Website': 'https://example.com'
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
