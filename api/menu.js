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
    try {
      const { rows } = await sql`SELECT * FROM menu_items ORDER BY position_order ASC;`;
      return res.status(200).json(rows);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Write methods require admin credentials
  if (!verifyAdmin(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (method === 'POST') {
    const { title, url, parent_id, position_order, is_active } = req.body;
    try {
      const active = is_active !== undefined ? is_active : true;
      const pos = position_order || 0;
      const parent = parent_id || null;
      
      const { rows } = await sql`
        INSERT INTO menu_items (title, url, parent_id, position_order, is_active)
        VALUES (${title}, ${url}, ${parent}, ${pos}, ${active})
        RETURNING *;
      `;
      return res.status(201).json({ success: true, item: rows[0] });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else if (method === 'PUT') {
    const { id, title, url, parent_id, position_order, is_active } = req.body;
    if (!id) return res.status(400).json({ error: 'Missing menu item ID' });
    
    try {
      const active = is_active !== undefined ? is_active : true;
      const pos = position_order || 0;
      const parent = parent_id || null;
      
      const { rows } = await sql`
        UPDATE menu_items
        SET title = ${title}, url = ${url}, parent_id = ${parent}, position_order = ${pos}, is_active = ${active}
        WHERE id = ${id}
        RETURNING *;
      `;
      return res.status(200).json({ success: true, item: rows[0] });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else if (method === 'DELETE') {
    const id = req.query.id;
    if (!id) return res.status(400).json({ error: 'Missing menu item ID' });
    try {
      await sql`DELETE FROM menu_items WHERE id = ${id};`;
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
};

