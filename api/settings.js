const { sql } = require('@vercel/postgres');

const ADMIN_USER = process.env.ADMIN_USER || 'nomination';
const ADMIN_PASS = process.env.ADMIN_PASS || 'Ktm@lka26';

module.exports = async (req, res) => {
  const method = req.method;

  if (method === 'OPTIONS') {
    res.setHeader('Allow', 'GET,POST,OPTIONS,HEAD');
    return res.status(204).end();
  }

  if (method === 'HEAD') {
    res.setHeader('Allow', 'GET,POST,OPTIONS,HEAD');
    return res.status(200).end();
  }

  if (method === 'GET') {
    try {
      const { rows } = await sql`SELECT * FROM settings;`;
      const settings = {};
      rows.forEach(r => {
        settings[r.key] = r.value;
      });
      return res.status(200).json(settings);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else if (method === 'POST') {
    // Authenticate
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    
    const [type, credentials] = authHeader.split(' ');
    if (type !== 'Basic' || !credentials) return res.status(401).json({ error: 'Unauthorized' });
    
    const decoded = Buffer.from(credentials, 'base64').toString('ascii');
    const [username, password] = decoded.split(':');
    
    if (username !== ADMIN_USER || password !== ADMIN_PASS) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { deadline, tenure } = req.body;
    if (!deadline || !tenure) {
      return res.status(400).json({ error: 'Missing deadline or tenure' });
    }

    try {
      await sql`
        INSERT INTO settings (key, value)
        VALUES ('leoNominationDeadline', ${deadline})
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
      `;
      await sql`
        INSERT INTO settings (key, value)
        VALUES ('leoNominationTenure', ${tenure})
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
      `;
      return res.status(200).json({ success: true, message: 'Settings saved successfully' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
};
