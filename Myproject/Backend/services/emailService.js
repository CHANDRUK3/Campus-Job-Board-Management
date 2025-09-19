const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  // Initialize email transporter
  initializeTransporter() {
    // For development, we'll use a test account
    // In production, configure with real SMTP settings
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || 'your-email@gmail.com',
        pass: process.env.SMTP_PASS || 'your-app-password'
      }
    });

    // Verify connection configuration
    this.transporter.verify((error, success) => {
      if (error) {
        console.log('❌ Email service not configured:', error.message);
        console.log('📧 To enable email notifications, configure SMTP settings in environment variables');
      } else {
        console.log('✅ Email service ready');
      }
    });
  }

  // Send email notification
  async sendEmail(to, subject, html, text = null) {
    try {
      if (!this.transporter) {
        throw new Error('Email service not configured');
      }

      const mailOptions = {
        from: `"Campus Job Board" <${process.env.SMTP_USER || 'noreply@campusjobboard.com'}>`,
        to: to,
        subject: subject,
        html: html,
        text: text || this.stripHtml(html)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', result.messageId);
      return result;
    } catch (error) {
      console.error('❌ Email sending failed:', error.message);
      throw error;
    }
  }

  // Send job notification to students
  async sendJobNotification(job, students) {
    const subject = `🎯 New Job Opportunity: ${job.jobTitle} at ${job.company}`;
    
    const html = this.generateJobNotificationHTML(job);
    
    const emailPromises = students.map(student => 
      this.sendEmail(student.email, subject, html)
    );

    try {
      await Promise.all(emailPromises);
      console.log(`✅ Job notifications sent to ${students.length} students`);
    } catch (error) {
      console.error('❌ Failed to send job notifications:', error.message);
      throw error;
    }
  }

  // Send application confirmation to student
  async sendApplicationConfirmation(studentEmail, job, status) {
    const subject = `📋 Application ${status === 'opt-in' ? 'Confirmed' : 'Withdrawn'}: ${job.jobTitle}`;
    
    const html = this.generateApplicationConfirmationHTML(job, status);
    
    try {
      await this.sendEmail(studentEmail, subject, html);
      console.log(`✅ Application confirmation sent to ${studentEmail}`);
    } catch (error) {
      console.error('❌ Failed to send application confirmation:', error.message);
      throw error;
    }
  }

  // Send bulk email to students
  async sendBulkEmail(recipients, subject, message) {
    const html = this.generateBulkEmailHTML(message);
    
    const emailPromises = recipients.map(recipient => 
      this.sendEmail(recipient.email, subject, html)
    );

    try {
      await Promise.all(emailPromises);
      console.log(`✅ Bulk email sent to ${recipients.length} recipients`);
    } catch (error) {
      console.error('❌ Failed to send bulk email:', error.message);
      throw error;
    }
  }

  // Send interview invitation
  async sendInterviewInvitation(studentEmail, job, interviewDetails) {
    const subject = `🎤 Interview Invitation: ${job.jobTitle} at ${job.company}`;
    
    const html = this.generateInterviewInvitationHTML(job, interviewDetails);
    
    try {
      await this.sendEmail(studentEmail, subject, html);
      console.log(`✅ Interview invitation sent to ${studentEmail}`);
    } catch (error) {
      console.error('❌ Failed to send interview invitation:', error.message);
      throw error;
    }
  }

  // Generate job notification HTML
  generateJobNotificationHTML(job) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Job Opportunity</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
          .job-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .job-title { font-size: 24px; font-weight: bold; color: #1f2937; margin-bottom: 10px; }
          .company { font-size: 18px; color: #6b7280; margin-bottom: 15px; }
          .job-details { margin: 15px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 8px 0; }
          .label { font-weight: bold; color: #374151; }
          .value { color: #6b7280; }
          .cta-button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 New Job Opportunity</h1>
            <p>A new job has been posted on the Campus Job Board</p>
          </div>
          <div class="content">
            <div class="job-card">
              <div class="job-title">${job.jobTitle}</div>
              <div class="company">🏢 ${job.company}</div>
              <div class="job-details">
                <div class="detail-row">
                  <span class="label">Location:</span>
                  <span class="value">${job.location}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Salary:</span>
                  <span class="value">${job.salary?.min || 'N/A'} - ${job.salary?.max || 'N/A'} LPA</span>
                </div>
                <div class="detail-row">
                  <span class="label">Experience:</span>
                  <span class="value">${job.experienceLevel || 'Fresher'}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Application Deadline:</span>
                  <span class="value">${new Date(job.applicationDeadline).toLocaleDateString()}</span>
                </div>
              </div>
              <p><strong>Description:</strong></p>
              <p>${job.description || 'No description provided.'}</p>
              <p><strong>Skills Required:</strong></p>
              <p>${Array.isArray(job.skills) ? job.skills.join(', ') : job.skills || 'Not specified'}</p>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/jobs" class="cta-button">
                View & Apply Now
              </a>
            </div>
            <div class="footer">
              <p>This is an automated notification from the Campus Job Board.</p>
              <p>If you no longer wish to receive these notifications, please contact the placement office.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Generate application confirmation HTML
  generateApplicationConfirmationHTML(job, status) {
    const statusText = status === 'opt-in' ? 'confirmed' : 'withdrawn';
    const statusColor = status === 'opt-in' ? '#10b981' : '#ef4444';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Application ${status === 'opt-in' ? 'Confirmed' : 'Withdrawn'}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${statusColor}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
          .status-message { text-align: center; margin: 20px 0; }
          .job-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Application ${status === 'opt-in' ? 'Confirmed' : 'Withdrawn'}</h1>
          </div>
          <div class="content">
            <div class="status-message">
              <h2>Your application has been ${statusText}!</h2>
              <p>${status === 'opt-in' ? 
                'Thank you for your interest. We will keep you updated on the selection process.' : 
                'Your application has been withdrawn successfully.'}
              </p>
            </div>
            <div class="job-info">
              <h3>${job.jobTitle}</h3>
              <p><strong>Company:</strong> ${job.company}</p>
              <p><strong>Location:</strong> ${job.location}</p>
              <p><strong>Application Deadline:</strong> ${new Date(job.applicationDeadline).toLocaleDateString()}</p>
            </div>
            <div class="footer">
              <p>This is an automated confirmation from the Campus Job Board.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Generate bulk email HTML
  generateBulkEmailHTML(message) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Campus Job Board Notification</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
          .message { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📢 Campus Job Board</h1>
          </div>
          <div class="content">
            <div class="message">
              ${message.replace(/\n/g, '<br>')}
            </div>
            <div class="footer">
              <p>This is an automated message from the Campus Job Board.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Generate interview invitation HTML
  generateInterviewInvitationHTML(job, interviewDetails) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Interview Invitation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #7c3aed; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
          .interview-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 8px 0; }
          .label { font-weight: bold; color: #374151; }
          .value { color: #6b7280; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎤 Interview Invitation</h1>
            <p>Congratulations! You have been selected for an interview</p>
          </div>
          <div class="content">
            <div class="interview-details">
              <h3>${job.jobTitle} at ${job.company}</h3>
              <div class="detail-row">
                <span class="label">Interview Date:</span>
                <span class="value">${new Date(interviewDetails.date).toLocaleDateString()}</span>
              </div>
              <div class="detail-row">
                <span class="label">Time:</span>
                <span class="value">${interviewDetails.time}</span>
              </div>
              <div class="detail-row">
                <span class="label">Location:</span>
                <span class="value">${interviewDetails.location}</span>
              </div>
              <div class="detail-row">
                <span class="label">Interviewer:</span>
                <span class="value">${interviewDetails.interviewer}</span>
              </div>
              <p><strong>Instructions:</strong></p>
              <p>${interviewDetails.instructions || 'Please arrive 10 minutes early and bring your resume and any relevant documents.'}</p>
            </div>
            <div class="footer">
              <p>Good luck with your interview!</p>
              <p>This is an automated invitation from the Campus Job Board.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Strip HTML tags for plain text version
  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}

module.exports = new EmailService();
