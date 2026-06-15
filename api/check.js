const { sql } = require('@vercel/postgres');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { leoId } = req.query;
  if (!leoId) {
    return res.status(400).json({ error: 'Missing leoId' });
  }

  try {
    let activeTenure = 'L.Y. 2025/26';
    try {
      const settingsRes = await sql`SELECT value FROM settings WHERE key = 'leoNominationTenure';`;
      if (settingsRes.rowCount > 0) {
        activeTenure = settingsRes.rows[0].value;
      }
    } catch (err) {
      console.error('Failed to fetch tenure for duplicate check:', err);
    }

    const check = await sql`SELECT id FROM nominations WHERE has_leo_id = 'yes' AND leo_id = ${leoId} AND tenure = ${activeTenure};`;
    
    if (check.rowCount > 0) {
      return res.status(200).json({ submitted: true });
    } else {
      return res.status(200).json({ submitted: false });
    }
  } catch (err) {
    console.error('Error checking submission:', err);
    return res.status(500).json({ error: err.message });
  }
};
