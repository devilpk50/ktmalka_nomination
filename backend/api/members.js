const { sql } = require('../db');

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
      const { rows } = await sql`SELECT * FROM members ORDER BY name ASC;`;
      const membersObj = {};
      rows.forEach(r => {
        membersObj[r.leo_id] = {
          name: r.name,
          position: r.position,
          email: r.email || '',
          contact: r.contact || '',
          duesPaid: !!r.dues_paid
        };
      });
      return res.status(200).json(membersObj);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Write methods require admin credentials
  if (!verifyAdmin(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (method === 'POST') {
    const data = req.body;
    try {
      if (Array.isArray(data)) {
        // Bulk import: clear table and insert new records
        await sql`TRUNCATE TABLE members;`;
        for (const m of data) {
          const duesPaid = !!m.duesPaid;
          await sql`
            INSERT INTO members (leo_id, name, position, email, contact, dues_paid)
            VALUES (${m.leoId}, ${m.name}, ${m.position}, ${m.email || ''}, ${m.contact || ''}, ${duesPaid});
          `;
        }
        return res.status(200).json({ success: true, count: data.length });
      } else {
        // Single create
        const { leoId, name, position, email, contact, duesPaid } = data;
        const dues = !!duesPaid;
        await sql`
          INSERT INTO members (leo_id, name, position, email, contact, dues_paid)
          VALUES (${leoId}, ${name}, ${position}, ${email || ''}, ${contact || ''}, ${dues});
        `;
        return res.status(201).json({ success: true });
      }
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else if (method === 'PUT') {
    const { originalLeoId, newLeoId, name, position, email, contact, duesPaid } = req.body;
    const dues = !!duesPaid;
    try {
      if (originalLeoId !== newLeoId) {
        // Delete original and insert updated ID
        await sql`DELETE FROM members WHERE leo_id = ${originalLeoId};`;
        await sql`
          INSERT INTO members (leo_id, name, position, email, contact, dues_paid)
          VALUES (${newLeoId}, ${name}, ${position}, ${email || ''}, ${contact || ''}, ${dues})
          ON CONFLICT (leo_id) DO UPDATE SET
            name = EXCLUDED.name,
            position = EXCLUDED.position,
            email = EXCLUDED.email,
            contact = EXCLUDED.contact,
            dues_paid = EXCLUDED.dues_paid;
        `;
      } else {
        await sql`
          UPDATE members
          SET name = ${name}, position = ${position}, email = ${email || ''}, contact = ${contact || ''}, dues_paid = ${dues}
          WHERE leo_id = ${newLeoId};
        `;
      }
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else if (method === 'DELETE') {
    const id = req.query.id;
    if (!id) return res.status(400).json({ error: 'Missing member ID' });
    try {
      await sql`DELETE FROM members WHERE leo_id = ${id};`;
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
};

