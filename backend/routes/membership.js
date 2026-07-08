const express = require('express');
const router = express.Router();
const Membership = require('../models/Membership');
const requireAuth = require('../middleware/requireAuth');
const { sendApprovalEmail, sendRejectionEmail } = require('../utils/emailService');

// Submit membership application (public)
router.post('/', async (req, res) => {
    try {
        // Normalize email to lowercase and trim whitespace
        const normalizedEmail = req.body.email ? req.body.email.toLowerCase().trim() : null;
        
        if (!normalizedEmail) {
            return res.status(400).json({
                success: false,
                message: 'Email address is required'
            });
        }

        // Validate phone number - must contain exactly 10 digits (after country code)
        if (req.body.phone) {
            const phoneDigits = req.body.phone.replace(/\D/g, '').slice(-10);
            if (phoneDigits.length !== 10) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide a valid 10-digit phone number.'
                });
            }
        }

        // Validate age - must be at least 18 years old
        if (req.body.dob) {
            const dob = new Date(req.body.dob);
            const today = new Date();
            let age = today.getFullYear() - dob.getFullYear();
            const monthDiff = today.getMonth() - dob.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
                age--;
            }
            if (age < 18) {
                return res.status(400).json({
                    success: false,
                    message: 'You must be at least 18 years old to apply for membership.'
                });
            }
        }
        
        // Check if email already exists in the database
        // Schema already converts to lowercase, so direct comparison works
        const existingMember = await Membership.findOne({ email: normalizedEmail });
        
        if (existingMember) {
            // Check the status of existing membership
            if (existingMember.status === 'approved') {
                return res.status(400).json({
                    success: false,
                    message: 'You are already a member of Leo Club. This email address is already registered.'
                });
            } else if (existingMember.status === 'pending') {
                return res.status(400).json({
                    success: false,
                    message: 'You already have a pending membership application. Please wait for the review process.'
                });
            } else if (existingMember.status === 'rejected') {
                return res.status(400).json({
                    success: false,
                    message: 'You have already submitted a membership application with this email address. Please contact us if you wish to reapply.'
                });
            }
        }
        
        // Normalize email in request body before creating membership
        req.body.email = normalizedEmail;
        
        // If no existing member found, create new application
        const membershipData = new Membership(req.body);
        await membershipData.save();
        
        res.status(201).json({
            success: true,
            message: 'Membership application submitted successfully',
            data: membershipData
        });
    } catch (error) {
        console.error('Membership submission error:', error);
        
        // Handle duplicate key error (MongoDB unique constraint)
        if (error.code === 11000 || error.message.includes('duplicate')) {
            return res.status(400).json({
                success: false,
                message: 'This email address has already been used for a membership application.'
            });
        }
        
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to submit membership application'
        });
    }
});

// Get all membership applications with pagination (admin)
router.get('/', requireAuth, async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
        const skip = (page - 1) * limit;
        const total = await Membership.countDocuments();
        const applications = await Membership.find().sort({ submittedAt: -1 }).skip(skip).limit(limit).lean();
        res.json({
            success: true,
            data: applications,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Error fetching memberships:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch membership applications'
        });
    }
});

// Get single membership application (admin - for View)
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const application = await Membership.findById(req.params.id).lean();
        if (!application) return res.status(404).json({ success: false, message: 'Application not found' });
        res.json({ success: true, data: application });
    } catch (error) {
        console.error('Error fetching membership:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch application' });
    }
});

// Update membership status - approve/reject (admin)
router.patch('/:id/status', requireAuth, async (req, res) => {
    try {
        const { status } = req.body;
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Status must be approved or rejected' });
        }
        
        // Get the current application to check previous status
        const currentApplication = await Membership.findById(req.params.id);
        if (!currentApplication) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }
        
        // Only send email if status is actually changing
        const statusChanged = currentApplication.status !== status;
        
        // Update the application status
        const application = await Membership.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        
        // Send email notification if status changed and email service is configured
        if (statusChanged && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
            try {
                if (status === 'approved') {
                    await sendApprovalEmail(application);
                } else if (status === 'rejected') {
                    await sendRejectionEmail(application);
                }
            } catch (emailError) {
                // Log email error but don't fail the request
                console.error('Failed to send email notification:', emailError);
                // Still return success since the status was updated
            }
        } else if (statusChanged && (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD)) {
            console.warn('Email service not configured. Email notification not sent.');
        }
        
        res.json({ success: true, data: application });
    } catch (error) {
        console.error('Error updating membership status:', error);
        res.status(500).json({ success: false, message: 'Failed to update status' });
    }
});

// Delete membership application (admin)
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const deleted = await Membership.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ success: false, message: 'Application not found' });
        res.json({ success: true, message: 'Membership application deleted' });
    } catch (error) {
        console.error('Error deleting membership:', error);
        res.status(500).json({ success: false, message: 'Failed to delete application' });
    }
});

module.exports = router;

