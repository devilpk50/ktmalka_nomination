const http = require('http');
const fs = require('fs');
const os = require('os');
const formidable = require('formidable');

function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = formidable({ multiples: false, uploadDir: os.tmpdir(), keepExtensions: true });
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/test') {
    try {
      const { fields, files } = await parseForm(req);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ fields, files }, null, 2));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message, stack: err.stack }, null, 2));
    }
  } else {
    res.writeHead(404).end('not found');
  }
});

server.listen(3001, async () => {
  console.log('listening 3001');
  const form = new FormData();
  form.append('file', fs.createReadStream('./package.json'));
  const response = await fetch('http://127.0.0.1:3001/test', { method: 'POST', body: form });
  console.log('status', response.status);
  console.log('headers', Object.fromEntries(response.headers.entries()));
  const text = await response.text();
  console.log('body', text);
  server.close();
});
