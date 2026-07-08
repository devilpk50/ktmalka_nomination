const express = require('express');
const router = express.Router();
const Newsletter = require('../models/Newsletter');
const requireAuth = require('../middleware/requireAuth');
const { sendNewsletterConfirmationEmail, sendNewsletterUnsubscribeEmail } = require('../utils/emailService');

// Subscribe to newsletter
router.post('/subscribe', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // Normalize email
        const normalizedEmail = email.trim().toLowerCase();

        // Check if email already exists
        const existingSubscription = await Newsletter.findOne({ email: normalizedEmail });

        if (existingSubscription) {
            if (existingSubscription.active) {
                return res.status(400).json({
                    success: false,
                    message: 'This email is already subscribed to our newsletter.'
                });
            } else {
                // Reactivate subscription
                existingSubscription.active = true;
                existingSubscription.unsubscribedAt = null;
                await existingSubscription.save();
                
                // Send confirmation email
                try {
                    await sendNewsletterConfirmationEmail(normalizedEmail);
                } catch (emailError) {
                    console.error('Error sending confirmation email:', emailError);
                    // Don't fail the subscription if email fails
                }

                return res.status(200).json({
                    success: true,
                    message: 'Welcome back! Your subscription has been reactivated.',
                    data: existingSubscription
                });
            }
        }

        // Create new subscription
        const newsletter = new Newsletter({
            email: normalizedEmail
        });

        await newsletter.save();

        // Send confirmation email
        try {
            await sendNewsletterConfirmationEmail(normalizedEmail);
        } catch (emailError) {
            console.error('Error sending confirmation email:', emailError);
            // Don't fail the subscription if email fails
        }

        res.status(201).json({
            success: true,
            message: 'Thank you for subscribing! Please check your email for confirmation.',
            data: newsletter
        });
    } catch (error) {
        console.error('Newsletter subscription error:', error);
        
        // Handle duplicate key error (MongoDB unique constraint)
        if (error.code === 11000 || error.message.includes('duplicate')) {
            return res.status(400).json({
                success: false,
                message: 'This email is already subscribed to our newsletter.'
            });
        }
        
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to subscribe to newsletter'
        });
    }
});

// Unsubscribe from newsletter
router.post('/unsubscribe', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const subscription = await Newsletter.findOne({ email: normalizedEmail });

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'Email not found in our newsletter list.'
            });
        }

        if (!subscription.active) {
            return res.status(400).json({
                success: false,
                message: 'This email is already unsubscribed.'
            });
        }

        subscription.active = false;
        subscription.unsubscribedAt = new Date();
        await subscription.save();

        res.status(200).json({
            success: true,
            message: 'You have been successfully unsubscribed from our newsletter.'
        });
    } catch (error) {
        console.error('Newsletter unsubscribe error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to unsubscribe from newsletter'
        });
    }
});

// Get all newsletter subscriptions with pagination (admin only)
router.get('/all', requireAuth, async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
        const skip = (page - 1) * limit;
        const total = await Newsletter.countDocuments();
        const subscriptions = await Newsletter.find()
            .sort({ subscribedAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        res.status(200).json({
            success: true,
            data: subscriptions,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Error fetching newsletter subscriptions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch newsletter subscriptions'
        });
    }
});

// Delete a newsletter subscriber (admin only)
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        // Find the subscriber first to get their email
        const subscriber = await Newsletter.findById(req.params.id);
        if (!subscriber) {
            return res.status(404).json({
                success: false,
                message: 'Subscriber not found.'
            });
        }

        const subscriberEmail = subscriber.email;

        // Delete the subscriber
        await Newsletter.findByIdAndDelete(req.params.id);

        // Send unsubscribe notification email
        if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
            try {
                await sendNewsletterUnsubscribeEmail(subscriberEmail);
            } catch (emailError) {
                console.error('Failed to send unsubscribe email:', emailError);
                // Don't fail the delete if email fails
            }
        }

        res.status(200).json({
            success: true,
            message: 'Subscriber removed and notification email sent.'
        });
    } catch (error) {
        console.error('Error deleting newsletter subscriber:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete subscriber.'
        });
    }
});

module.exports = router;
