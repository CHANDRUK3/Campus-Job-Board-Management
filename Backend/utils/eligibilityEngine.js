const Application = require('../models/Application');

/**
 * Checks if a student is eligible for a given recruitment drive.
 * @param {Object} studentProfile - The student profile Mongoose document/object.
 * @param {Object} drive - The recruitment drive Mongoose document/object.
 * @returns {Promise<Object>} - Returns { eligible: Boolean, reasons: String[] }
 */
async function checkEligibility(studentProfile, drive) {
  const reasons = [];

  if (!studentProfile) {
    return { eligible: false, reasons: ['Student profile not found.'] };
  }

  // 1. Check Profile Verification Status
  if (studentProfile.profileStatus !== 'verified') {
    return { eligible: false, reasons: ['Profile is not verified by placement cell.'] };
  }

  // 2. Check CGPA
  const minCgpa = drive.eligibilityRules?.minCgpa || 0;
  if (studentProfile.cgpa < minCgpa) {
    reasons.push(`CGPA is ${studentProfile.cgpa}, but minimum required is ${minCgpa}.`);
  }

  // 3. Check Backlogs
  const maxBacklogs = drive.eligibilityRules?.maxBacklogs !== undefined ? drive.eligibilityRules.maxBacklogs : 0;
  if (studentProfile.backlogs > maxBacklogs) {
    reasons.push(`Student has ${studentProfile.backlogs} backlogs, but maximum allowed is ${maxBacklogs}.`);
  }

  // 4. Check Department
  const allowedDepts = drive.eligibilityRules?.allowedDepartments || [];
  if (allowedDepts.length > 0 && studentProfile.department) {
    const isDeptAllowed = allowedDepts.some(
      dept => dept.toLowerCase().trim() === studentProfile.department.toLowerCase().trim()
    );
    if (!isDeptAllowed) {
      reasons.push(`Department '${studentProfile.department}' is not eligible. Allowed departments: ${allowedDepts.join(', ')}.`);
    }
  }

  // 5. Check Graduation Year
  const allowedGradYears = drive.eligibilityRules?.gradYears || [];
  if (allowedGradYears.length > 0 && studentProfile.gradYear) {
    if (!allowedGradYears.includes(studentProfile.gradYear)) {
      reasons.push(`Graduation year ${studentProfile.gradYear} is not eligible. Allowed years: ${allowedGradYears.join(', ')}.`);
    }
  }

  // 6. Check Placement Status (Multiple Offer Rule)
  const allowPlaced = drive.eligibilityRules?.allowPlaced !== undefined ? drive.eligibilityRules.allowPlaced : true;
  if (!allowPlaced) {
    const priorPlacement = await Application.findOne({
      student: studentProfile.user,
      status: 'selected'
    });
    if (priorPlacement) {
      reasons.push('Student is already placed and this drive does not permit multiple offers.');
    }
  }

  return {
    eligible: reasons.length === 0,
    reasons
  };
}

module.exports = { checkEligibility };
