function requireAuth(req, res, next) {
    if (req.session && req.session.admin) {
        return next();
    }
    res.status(401).json({ success: false, message: 'Authentication required' });
}

module.exports = requireAuth;
