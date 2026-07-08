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

  if (method === 'POST') {
    const n = req.body;
    try {
      // Fetch current active tenure from settings
      let activeTenure = 'L.Y. 2025/26';
      try {
        const settingsRes = await sql`SELECT value FROM settings WHERE key = 'leoNominationTenure';`;
        if (settingsRes.rowCount > 0) {
          activeTenure = settingsRes.rows[0].value;
        }
      } catch (err) {
        console.error('Failed to fetch tenure for duplicate check:', err);
      }

      // Check for duplicate nomination for registered member path under the current active tenure
      if (n.hasLeoId === 'yes' && n.leoId) {
        const check = await sql`SELECT id FROM nominations WHERE has_leo_id = 'yes' AND leo_id = ${n.leoId} AND tenure = ${activeTenure};`;
        if (check.rowCount > 0) {
          return res.status(400).json({ error: 'You have already submitted a nomination for the current tenure.' });
        }
      }

      await sql`
        INSERT INTO nominations (
          id, date, has_leo_id, leo_id, full_name, contact_no, email_id, current_position,
          position_applying_for, position_value, fee, transaction_code, cover_letter_url,
          past_experience, areas_of_interest, future_plans, formal_photo_url, signature_url,
          citizenship_url, dues_receipt_url, nomination_receipt_url, status, tenure
        ) VALUES (
          ${n.id}, ${n.date}, ${n.hasLeoId}, ${n.leoId || ''}, ${n.fullName}, ${n.contactNo || ''},
          ${n.emailId || ''}, ${n.currentPosition || ''}, ${n.positionApplyingFor}, ${n.positionValue},
          ${n.fee}, ${n.transactionCode}, ${n.coverLetterUrl || ''}, ${n.pastExperience},
          ${n.areasOfInterest}, ${n.futurePlans}, ${n.formalPhotoUrl || ''}, ${n.signatureUrl || ''},
          ${n.citizenshipUrl || ''}, ${n.duesReceiptUrl || ''}, ${n.nominationReceiptUrl || ''}, 'Pending', ${activeTenure}
        );
      `;
      return res.status(201).json({ success: true, message: 'Nomination submitted successfully!' });
    } catch (error) {
      console.error('Submit error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Allow public checking of Leo ID submission status for the current tenure
  if (method === 'GET' && req.query.checkLeoId) {
    try {
      let activeTenure = 'L.Y. 2025/26';
      try {
        const settingsRes = await sql`SELECT value FROM settings WHERE key = 'leoNominationTenure';`;
        if (settingsRes.rowCount > 0) activeTenure = settingsRes.rows[0].value;
      } catch (err) {}
      
      const check = await sql`SELECT id FROM nominations WHERE has_leo_id = 'yes' AND leo_id = ${req.query.checkLeoId} AND tenure = ${activeTenure};`;
      return res.status(200).json({ hasSubmitted: check.rowCount > 0 });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Admin authorization required for all other endpoints
  if (!verifyAdmin(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (method === 'GET') {
    try {
      const { rows } = await sql`SELECT * FROM nominations ORDER BY date DESC;`;
      const formatted = rows.map(r => ({
        id: r.id,
        date: r.date,
        hasLeoId: r.has_leo_id,
        leoId: r.leo_id,
        fullName: r.full_name,
        contactNo: r.contact_no,
        emailId: r.email_id,
        currentPosition: r.current_position,
        positionApplyingFor: r.position_applying_for,
        positionValue: r.position_value,
        fee: r.fee,
        transactionCode: r.transaction_code,
        coverLetterUrl: r.cover_letter_url,
        pastExperience: r.past_experience,
        areasOfInterest: r.areas_of_interest,
        futurePlans: r.future_plans,
        formalPhotoUrl: r.formal_photo_url,
        signatureUrl: r.signature_url,
        citizenshipUrl: r.citizenship_url,
        duesReceiptUrl: r.dues_receipt_url,
        nominationReceiptUrl: r.nomination_receipt_url,
        status: r.status,
        tenure: r.tenure || 'L.Y. 2025/26'
      }));
      return res.status(200).json(formatted);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else if (method === 'PUT') {
    const { id, status } = req.body;
    if (!id || !status) return res.status(400).json({ error: 'Missing ID or Status' });
    try {
      await sql`UPDATE nominations SET status = ${status} WHERE id = ${id};`;
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else if (method === 'DELETE') {
    const id = req.query.id;
    try {
      if (id === 'all') {
        const tenure = req.query.tenure;
        if (tenure) {
          await sql`DELETE FROM nominations WHERE tenure = ${tenure};`;
          return res.status(200).json({ success: true, message: `All submissions for tenure ${tenure} cleared` });
        } else {
          await sql`TRUNCATE TABLE nominations;`;
          return res.status(200).json({ success: true, message: 'All submissions cleared' });
        }
      } else if (id) {
        await sql`DELETE FROM nominations WHERE id = ${id};`;
        return res.status(200).json({ success: true });
      } else {
        return res.status(400).json({ error: 'Missing id query parameter' });
      }
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
};

