const router = require('express').Router();
const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
const { v4: uuidv4 } = require('uuid');
const db     = require('../db');
const { requireAuth } = require('../middleware/auth');

const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename:    (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname).toLowerCase()}`)
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.png', '.jpg', '.jpeg', '.svg', '.webp'];
    allowed.includes(path.extname(file.originalname).toLowerCase())
      ? cb(null, true)
      : cb(new Error('Only image files allowed'));
  }
});

const parse = t => ({ ...t, config: JSON.parse(t.config), is_default: !!t.is_default });

// List user templates
router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM templates WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json(rows.map(parse));
});

// Create template
router.post('/', requireAuth, upload.single('logo'), (req, res) => {
  const { name, config } = req.body;
  if (!name || !config) return res.status(400).json({ error: 'name and config required' });

  let parsed;
  try { parsed = JSON.parse(config); } catch { return res.status(400).json({ error: 'config must be valid JSON' }); }

  const id        = uuidv4();
  const logo_path = req.file ? `/uploads/${req.file.filename}` : null;
  db.prepare('INSERT INTO templates (id, user_id, name, config, logo_path) VALUES (?, ?, ?, ?, ?)')
    .run(id, req.user.id, name, JSON.stringify(parsed), logo_path);

  const row = db.prepare('SELECT * FROM templates WHERE id = ?').get(id);
  res.status(201).json(parse(row));
});

// Update template
router.put('/:id', requireAuth, upload.single('logo'), (req, res) => {
  const tpl = db.prepare('SELECT * FROM templates WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!tpl) return res.status(404).json({ error: 'Template not found' });

  const name   = req.body.name   ?? tpl.name;
  const config = req.body.config ? JSON.parse(req.body.config) : JSON.parse(tpl.config);

  let logo_path = tpl.logo_path;
  if (req.file) {
    // remove old file if it was uploaded (not a URL)
    if (logo_path && logo_path.startsWith('/uploads/')) {
      const old = path.join(UPLOADS_DIR, path.basename(logo_path));
      if (fs.existsSync(old)) fs.unlinkSync(old);
    }
    logo_path = `/uploads/${req.file.filename}`;
  }

  db.prepare('UPDATE templates SET name = ?, config = ?, logo_path = ? WHERE id = ?')
    .run(name, JSON.stringify(config), logo_path, tpl.id);

  res.json(parse(db.prepare('SELECT * FROM templates WHERE id = ?').get(tpl.id)));
});

// Delete template
router.delete('/:id', requireAuth, (req, res) => {
  const tpl = db.prepare('SELECT * FROM templates WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!tpl) return res.status(404).json({ error: 'Template not found' });

  if (tpl.logo_path?.startsWith('/uploads/')) {
    const file = path.join(UPLOADS_DIR, path.basename(tpl.logo_path));
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }
  db.prepare('DELETE FROM templates WHERE id = ?').run(tpl.id);
  res.json({ ok: true });
});

// Set default template for this user
router.post('/:id/set-default', requireAuth, (req, res) => {
  const tpl = db.prepare('SELECT * FROM templates WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!tpl) return res.status(404).json({ error: 'Template not found' });

  db.prepare('UPDATE templates SET is_default = 0 WHERE user_id = ?').run(req.user.id);
  db.prepare('UPDATE templates SET is_default = 1 WHERE id = ?').run(tpl.id);
  res.json({ ok: true });
});

module.exports = router;
