const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieSession = require('cookie-session');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const sessionOptions = {
    name: 'session',
    keys: [process.env.SESSION_SECRET || 'leo-club-admin-secret'],
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
};

app.use(cookieSession(sessionOptions));

// API routes first (so /api/* is never served as static files)
app.use('/api/admin', require('./routes/auth'));
app.use('/api/membership', require('./routes/membership'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/newsletter', require('./routes/newsletter'));

// Nomination Form APIs
app.all('/api/nominations', require('../api/nominations'));
app.all('/api/members', require('../api/members'));
app.all('/api/settings', require('../api/settings'));
app.all('/api/setup', require('../api/setup'));
app.all('/api/upload', require('../api/upload'));
app.all('/api/upload-server', require('../api/upload-server'));
app.all('/api/menu', require('../api/menu'));
app.all('/api/pages', require('../api/pages'));
app.all('/api/projects', require('../api/projects'));
app.all('/api/events', require('../api/events'));
app.all('/api/sliders', require('../api/sliders'));

app.use(express.static(path.join(__dirname, '../frontend')));

// Serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'about.html'));
});

app.get('/board', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'board.html'));
});

app.get('/gallery', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'gallery.html'));
});

app.get('/events', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'events.html'));
});

app.get('/awards', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'awards.html'));
});

app.get('/achievements', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'achievements.html'));
});

app.get('/membership', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'membership.html'));
});

app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'contact.html'));
});

app.get('/admin/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'admin-login.html'));
});
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'admin.html'));
});
app.get('/admin/members', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'admin-members.html'));
});
app.get('/admin/contacts', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'admin-contacts.html'));
});
app.get('/admin/newsletter', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'admin-newsletter.html'));
});
app.get('/admin/menu', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'admin-menu.html'));
});
app.get('/admin/pages', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'admin-pages.html'));
});
app.get('/admin/projects', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'admin-projects.html'));
});
app.get('/admin/events', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'admin-events.html'));
});
app.get('/admin/sliders', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'admin-sliders.html'));
});

// Start Server if run locally
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

// Export app for Vercel
module.exports = app;
