const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const requireAuth = require('../middleware/requireAuth');

// Submit contact form (public)
router.post('/', async (req, res) => {
    try {
        const contactData = new Contact(req.body);
        await contactData.save();
        
        res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            data: contactData
        });
    } catch (error) {
        console.error('Contact submission error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to send message'
        });
    }
});

// Get all contact messages with pagination (admin)
router.get('/', requireAuth, async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
        const skip = (page - 1) * limit;
        const total = await Contact.countDocuments();
        const messages = await Contact.find().sort({ submittedAt: -1 }).skip(skip).limit(limit).lean();
        res.json({
            success: true,
            data: messages,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Error fetching contacts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch contact messages'
        });
    }
});

// Get single contact message (admin - for View)
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const message = await Contact.findById(req.params.id).lean();
        if (!message) return res.status(404).json({ success: false, message: 'Message not found' });
        res.json({ success: true, data: message });
    } catch (error) {
        console.error('Error fetching contact:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch message' });
    }
});

// Delete contact message (admin)
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const deleted = await Contact.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ success: false, message: 'Message not found' });
        res.json({ success: true, message: 'Contact message deleted' });
    } catch (error) {
        console.error('Error deleting contact:', error);
        res.status(500).json({ success: false, message: 'Failed to delete message' });
    }
});

module.exports = router;

