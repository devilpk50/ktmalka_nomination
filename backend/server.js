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
app.all('/api/nominations', require('./api/nominations'));
app.all('/api/members', require('./api/members'));
app.all('/api/settings', require('./api/settings'));
app.all('/api/setup', require('./api/setup'));
app.all('/api/upload', require('./api/upload'));
app.all('/api/upload-server', require('./api/upload-server'));
app.all('/api/menu', require('./api/menu'));
app.all('/api/pages', require('./api/pages'));
app.all('/api/projects', require('./api/projects'));
app.all('/api/events', require('./api/events'));
app.all('/api/sliders', require('./api/sliders'));
app.all('/api/debug', require('./api/debug'));

app.use(express.static(path.join(__dirname, '../public'), { extensions: ['html'] }));

// Serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'about.html'));
});

app.get('/board', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'board.html'));
});

app.get('/gallery', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'gallery.html'));
});

app.get('/events', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'events.html'));
});

app.get('/awards', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'awards.html'));
});

app.get('/achievements', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'achievements.html'));
});

app.get('/membership', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'membership.html'));
});

app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'contact.html'));
});



// Start Server if run locally
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

// Export app for Vercel
module.exports = app;
