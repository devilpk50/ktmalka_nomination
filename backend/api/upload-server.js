const { put } = require('@vercel/blob');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const filename = req.query.filename || `file-${Date.now()}`;
    
    // Upload the incoming request stream directly to Vercel Blob
    const blob = await put(filename, req, {
      access: 'public',
    });

    return res.status(200).json(blob);
  } catch (error) {
    console.error('Server upload error:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Disable Vercel's default body parser so we can receive the raw file stream directly
module.exports.config = {
  api: {
    bodyParser: false,
  },
};
