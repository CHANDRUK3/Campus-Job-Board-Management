// routes/companies.js — Company employer profile management
const express = require('express');
const router = express.Router();
const Company = require('../models/company');
const { authenticate, authorize } = require('../middleware/auth');

// Legacy compatibility: delegate drive listing to /api/drives
// Mount point in server.js also registers drives at /api/companies for backward compat

// GET: List all company profiles
router.get('/profiles', async (req, res) => {
  try {
    const companies = await Company.find().sort({ name: 1 });
    res.json(companies);
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ message: 'Error fetching companies', error: error.message });
  }
});

// GET: Single company profile
router.get('/profiles/:companyId', async (req, res) => {
  try {
    const company = await Company.findById(req.params.companyId);
    if (!company) return res.status(404).json({ message: 'Company not found' });
    res.json(company);
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ message: 'Error fetching company', error: error.message });
  }
});

// POST: Create company profile (admin/recruiter)
router.post('/profiles', authenticate, authorize('admin', 'recruiter'), async (req, res) => {
  try {
    const { name, description, logo, website, industry, contactEmail } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Company name is required' });

    const existing = await Company.findOne({ name: name.trim() });
    if (existing) return res.status(409).json({ message: 'Company with this name already exists' });

    const company = await new Company({
      name: name.trim(),
      description: description || '',
      logo: logo || '',
      website: website || '',
      industry: industry || '',
      contactEmail: contactEmail || ''
    }).save();

    res.status(201).json({ message: 'Company profile created', company });
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({ message: 'Failed to create company', error: error.message });
  }
});

// PUT: Update company profile (admin/recruiter)
router.put('/profiles/:companyId', authenticate, authorize('admin', 'recruiter'), async (req, res) => {
  try {
    const company = await Company.findById(req.params.companyId);
    if (!company) return res.status(404).json({ message: 'Company not found' });

    const fields = ['description', 'logo', 'website', 'industry', 'contactEmail'];
    fields.forEach(field => {
      if (req.body[field] !== undefined) company[field] = req.body[field];
    });

    await company.save();
    res.json({ message: 'Company profile updated', company });
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({ message: 'Failed to update company', error: error.message });
  }
});

module.exports = router;
