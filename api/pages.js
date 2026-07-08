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
    const { slug } = req.query;
    try {
      if (slug) {
        const { rows } = await sql`SELECT * FROM pages WHERE slug = ${slug};`;
        if (rows.length > 0) {
          return res.status(200).json(rows[0]);
        } else {
          return res.status(404).json({ error: 'Page not found' });
        }
      } else {
        const { rows } = await sql`SELECT slug, title, last_updated FROM pages ORDER BY title ASC;`;
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
    const { slug, title, html_content } = req.body;
    if (!slug || !title) return res.status(400).json({ error: 'Missing slug or title' });
    try {
      const { rows } = await sql`
        INSERT INTO pages (slug, title, html_content)
        VALUES (${slug}, ${title}, ${html_content || ''})
        RETURNING *;
      `;
      return res.status(201).json({ success: true, item: rows[0] });
    } catch (error) {
      if (error.message.includes('duplicate key value')) {
        return res.status(409).json({ error: 'Slug already exists. Use PUT to update.' });
      }
      return res.status(500).json({ error: error.message });
    }
  } else if (method === 'PUT') {
    const { slug, title, html_content } = req.body;
    if (!slug || !title) return res.status(400).json({ error: 'Missing slug or title' });
    
    try {
      const { rows } = await sql`
        UPDATE pages
        SET title = ${title}, html_content = ${html_content || ''}, last_updated = CURRENT_TIMESTAMP
        WHERE slug = ${slug}
        RETURNING *;
      `;
      return res.status(200).json({ success: true, item: rows[0] });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else if (method === 'DELETE') {
    const slug = req.query.slug;
    if (!slug) return res.status(400).json({ error: 'Missing page slug' });
    try {
      await sql`DELETE FROM pages WHERE slug = ${slug};`;
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
};

