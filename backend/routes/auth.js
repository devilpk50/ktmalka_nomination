const express = require('express');
const router = express.Router();

// Admin login (single admin from env)
router.post('/login', (req, res) => {
    const { email, password } = req.body || {};
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@leoclub.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    if (email !== adminEmail || password !== adminPassword) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    req.session.admin = { email };
    res.json({ success: true, message: 'Login successful' });
});

router.post('/logout', (req, res) => {
    req.session = null;
    res.json({ success: true });
});

router.get('/me', (req, res) => {
    if (req.session && req.session.admin) {
        return res.json({ success: true, loggedIn: true });
    }
    res.status(401).json({ success: false, loggedIn: false });
});

module.exports = router;
