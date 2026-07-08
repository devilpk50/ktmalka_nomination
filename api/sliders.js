const { sql } = require('@vercel/postgres');

const ADMIN_USER = process.env.ADMIN_USER || 'nomination';
const ADMIN_PASS = process.env.ADMIN_PASS || 'Ktm@lka26';

function verifyAdmin(req) {
  // Support express-session auth (local/server environment)
  if (req.session && req.session.admin) {
    return true;
  }
  
  // Support Basic Auth (stateless serverless environment)
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
        const { rows } = await sql`SELECT * FROM sliders WHERE id = ${id};`;
        if (rows.length > 0) {
          return res.status(200).json(rows[0]);
        } else {
          return res.status(404).json({ error: 'Slider not found' });
        }
      } else {
        const { rows } = await sql`SELECT * FROM sliders ORDER BY position_order ASC, id DESC;`;
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
    const { image_url, title, tagline, btn1_text, btn1_url, btn2_text, btn2_url, position_order, is_active } = req.body;
    if (!image_url) return res.status(400).json({ error: 'Missing image_url' });
    try {
      const { rows } = await sql`
        INSERT INTO sliders (image_url, title, tagline, btn1_text, btn1_url, btn2_text, btn2_url, position_order, is_active)
        VALUES (${image_url}, ${title || ''}, ${tagline || ''}, ${btn1_text || ''}, ${btn1_url || ''}, ${btn2_text || ''}, ${btn2_url || ''}, ${position_order || 0}, ${is_active !== undefined ? is_active : true})
        RETURNING *;
      `;
      return res.status(201).json({ success: true, item: rows[0] });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else if (method === 'PUT') {
    const { id, image_url, title, tagline, btn1_text, btn1_url, btn2_text, btn2_url, position_order, is_active } = req.body;
    if (!id || !image_url) return res.status(400).json({ error: 'Missing id or image_url' });
    
    try {
      const { rows } = await sql`
        UPDATE sliders
        SET image_url = ${image_url}, title = ${title || ''}, tagline = ${tagline || ''}, btn1_text = ${btn1_text || ''}, btn1_url = ${btn1_url || ''}, btn2_text = ${btn2_text || ''}, btn2_url = ${btn2_url || ''}, position_order = ${position_order || 0}, is_active = ${is_active !== undefined ? is_active : true}
        WHERE id = ${id}
        RETURNING *;
      `;
      return res.status(200).json({ success: true, item: rows[0] });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else if (method === 'DELETE') {
    const id = req.query.id || req.body.id;
    if (!id) return res.status(400).json({ error: 'Missing slider id' });
    try {
      await sql`DELETE FROM sliders WHERE id = ${id};`;
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
};
