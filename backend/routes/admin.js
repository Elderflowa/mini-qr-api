const router = require('express').Router();
const db     = require('../db');
const { requireAdmin } = require('../middleware/auth');

// Get all settings
router.get('/settings', requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT * FROM settings').all();
  res.json(Object.fromEntries(rows.map(r => [r.key, r.value])));
});

// Update a setting
router.put('/settings/:key', requireAdmin, (req, res) => {
  const { value } = req.body;
  if (value === undefined) return res.status(400).json({ error: 'value required' });
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(req.params.key, String(value));
  res.json({ ok: true });
});

// List all users
router.get('/users', requireAdmin, (req, res) => {
  const users = db.prepare('SELECT id, username, role, created_at FROM users ORDER BY created_at ASC').all();
  res.json(users);
});

// Delete a user (cannot delete self or other admins)
router.delete('/users/:id', requireAdmin, (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!target) return res.status(404).json({ error: 'User not found' });
  if (target.role === 'admin') return res.status(400).json({ error: 'Cannot delete admin users' });
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Public: get global default template config (used by /?data= page)
router.get('/public-default', (req, res) => {
  const { value: templateId } = db.prepare("SELECT value FROM settings WHERE key = 'global_default_template'").get() || {};

  if (!templateId || templateId === 'classic') {
    return res.json({ type: 'classic' });
  }

  const tpl = db.prepare('SELECT * FROM templates WHERE id = ?').get(templateId);
  if (!tpl) return res.json({ type: 'classic' });

  const config = JSON.parse(tpl.config);

  // If the stored template itself is a classic-type template, honour that
  if (config.type === 'classic') {
    return res.json({ type: 'classic' });
  }

  res.json({
    type: 'custom',
    template: {
      ...tpl,
      config,
    }
  });
});

// Get all templates across all users (for admin to pick global default)
router.get('/all-templates', requireAdmin, (req, res) => {
  const rows = db.prepare(`
    SELECT t.*, u.username FROM templates t
    JOIN users u ON t.user_id = u.id
    ORDER BY u.username, t.name
  `).all();
  res.json(rows.map(r => ({ ...r, config: JSON.parse(r.config) })));
});

// Public: get all templates (no auth) — used by dashboard default picker for own user
// Returns only the requesting user's templates via auth, or all for admin
router.get('/templates-public', (req, res) => {
  const rows = db.prepare(`
    SELECT t.id, t.name, t.config, t.logo_path, t.user_id, u.username
    FROM templates t JOIN users u ON t.user_id = u.id
    ORDER BY u.username, t.name
  `).all();
  res.json(rows.map(r => ({ ...r, config: JSON.parse(r.config) })));
});

module.exports = router;
