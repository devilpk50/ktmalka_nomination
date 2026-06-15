const { put } = require('@vercel/blob');
const formidableModule = require('formidable');
const formidable = formidableModule.default || formidableModule.formidable || formidableModule;
const fs = require('fs');
const os = require('os');

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS,HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = formidable({
      multiples: false,
      uploadDir: os.tmpdir(),
      keepExtensions: true,
    });
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
}

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    res.setHeader('Allow', 'POST,OPTIONS,HEAD');
    return res.status(204).end();
  }

  if (req.method === 'HEAD') {
    setCorsHeaders(res);
    res.setHeader('Allow', 'POST,OPTIONS,HEAD');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    setCorsHeaders(res);
    return res.status(405).json({ error: 'Method not allowed', allowed: 'POST' });
  }

  try {
    setCorsHeaders(res);
    const filename = req.query.filename || `file-${Date.now()}`;

    // Decide whether the client sent multipart/form-data (browser FormData)
    // or a raw stream (octet-stream / image / pdf). Support both for iOS compatibility.
    const contentType = (req.headers['content-type'] || '').toLowerCase();

    let blob;

    if (contentType.includes('multipart/form-data')) {
      const { files } = await parseForm(req);
      const incomingFile = files.file || files.upload || Object.values(files)[0];
      if (!incomingFile) {
        return res.status(400).json({ error: 'No file uploaded (multipart)' });
      }

      const filePath = incomingFile.filepath
        || incomingFile.path
        || incomingFile.tmpfile?.filepath
        || incomingFile.tempFilePath
        || incomingFile.tempFile?.filepath
        || incomingFile._writeStream?.path;
      const mimeType = incomingFile.mimetype || incomingFile.type || incomingFile.mime || 'application/octet-stream';
      if (!filePath) {
        const fileKeys = Object.keys(incomingFile || {});
        return res.status(400).json({ error: 'Unable to read uploaded file (multipart)', fileKeys });
      }

      blob = await put(filename, fs.createReadStream(filePath), {
        access: 'public',
        contentType: mimeType,
      });

      // Best-effort cleanup of temp file created by formidable
      try {
        fs.unlink(filePath, () => {});
      } catch (e) {
        // ignore cleanup errors
      }
    } else {
      // For non-multipart uploads (raw binary), stream req directly to blob
      // e.g., some iOS clients may send application/octet-stream or image/* without multipart
      const mimeType = contentType || 'application/octet-stream';
      blob = await put(filename, req, {
        access: 'public',
        contentType: mimeType,
      });
    }

    return res.status(200).json(blob);
  } catch (error) {
    console.error('Server upload error:', error);
    return res.status(500).json({ error: error.message });
  }
};

module.exports.config = {
  api: {
    bodyParser: false,
  },
};
