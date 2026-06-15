const http = require('http');
const { spawnSync } = require('child_process');
const formidable = require('formidable');
const os = require('os');

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

server.listen(3001, () => {
  console.log('listening 3001');
  const curl = spawnSync('curl', ['-F', 'file=@package.json', 'http://127.0.0.1:3001/test'], { encoding: 'utf8' });
  console.log('curl stdout:', curl.stdout);
  console.log('curl stderr:', curl.stderr);
  server.close();
});
