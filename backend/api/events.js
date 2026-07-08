const { sql } = require('@vercel/postgres');

const ADMIN_USER = process.env.ADMIN_USER || 'nomination';
const ADMIN_PASS = process.env.ADMIN_PASS || 'Ktm@lka26';

function verifyAdmin(req) {
  if (req.session && req.session.admin) return true;
  const authHeader = req.headers.authorization;
  if (!authHeader) return false;
  const [type, credentials] = authHeader.split(' ');
  if (type !== 'Basic' || !credentials) return false;
  const decoded = Buffer.from(credentials, 'base64').toString('ascii');
  const [username, password] = decoded.split(':');
  return username === ADMIN_USER && password === ADMIN_PASS;
}

module.exports = async (req, res) => {
  const method = req.method;

  if (method === 'GET') {
    const { id } = req.query;
    try {
      if (id) {
        const { rows } = await sql`SELECT * FROM events WHERE id = ${id};`;
        if (rows.length > 0) {
          return res.status(200).json(rows[0]);
        } else {
          return res.status(404).json({ error: 'Event not found' });
        }
      } else {
        const { rows } = await sql`SELECT * FROM events ORDER BY id DESC;`;
        return res.status(200).json(rows);
      }
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Write methods require admin credentials
  if (!verifyAdmin(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (method === 'POST') {
    const { title, date, location, description, image_url, status, time, category, details, objectives, contact_info } = req.body;
    if (!title) return res.status(400).json({ error: 'Missing title' });
    try {
      const { rows } = await sql`
        INSERT INTO events (title, date, location, description, image_url, status, time, category, details, objectives, contact_info)
        VALUES (${title}, ${date}, ${location}, ${description}, ${image_url}, ${status}, ${time}, ${category}, ${details}, ${objectives}, ${contact_info})
        RETURNING *;
      `;
      return res.status(201).json({ success: true, item: rows[0] });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else if (method === 'PUT') {
    const { id, title, date, location, description, image_url, status, time, category, details, objectives, contact_info } = req.body;
    if (!id || !title) return res.status(400).json({ error: 'Missing id or title' });
    
    try {
      const { rows } = await sql`
        UPDATE events
        SET title = ${title}, date = ${date}, location = ${location}, description = ${description}, image_url = ${image_url}, status = ${status}, time = ${time}, category = ${category}, details = ${details}, objectives = ${objectives}, contact_info = ${contact_info}
        WHERE id = ${id}
        RETURNING *;
      `;
      return res.status(200).json({ success: true, item: rows[0] });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else if (method === 'DELETE') {
    const id = req.query.id || req.body.id;
    if (!id) return res.status(400).json({ error: 'Missing event id' });
    try {
      await sql`DELETE FROM events WHERE id = ${id};`;
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
};

