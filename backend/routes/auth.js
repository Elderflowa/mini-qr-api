const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db      = require('../db');
const { requireAuth, JWT_SECRET } = require('../middleware/auth');

router.post('/register', (req, res) => {
  const { value: signupsEnabled } = db.prepare("SELECT value FROM settings WHERE key = 'signups_enabled'").get() || {};
  if (signupsEnabled !== 'true') return res.status(403).json({ error: 'Signups are currently disabled' });

  const { username, password } = req.body || {};
  if (!username || !password)    return res.status(400).json({ error: 'Username and password required' });
  if (username.length < 3)       return res.status(400).json({ error: 'Username must be at least 3 characters' });
  if (password.length < 6)       return res.status(400).json({ error: 'Password must be at least 6 characters' });
  if (db.prepare('SELECT id FROM users WHERE username = ?').get(username))
                                 return res.status(409).json({ error: 'Username already taken' });

  const id   = uuidv4();
  const hash = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO users (id, username, password_hash, role) VALUES (?, ?, ?, ?)').run(id, username, hash, 'user');

  const token = jwt.sign({ id, username, role: 'user' }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: { id, username, role: 'user' } });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash))
    return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, username, role, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

module.exports = router;
