import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApiRouter } from './routes/api.js';
import { requireAdmin } from './middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json({ limit: '64kb' }));
app.use(express.urlencoded({ extended: false }));

app.use((req, _res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.use('/api', createApiRouter());
app.use('/admin', requireAdmin, express.static(path.join(__dirname, '../public')));
app.get('/', (_req, res) => res.redirect('/admin/'));

export default app;
