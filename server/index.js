import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const port = Number(process.env.PORT) || 3002;
const app = express();

app.disable('x-powered-by');

if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(dist, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => {
    res.status(503).send('dist 目录不存在，请先运行 npm run build');
  });
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).send('Server error');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🦈 Deep Sea Shark Parkour server: http://localhost:${port}`);
});
