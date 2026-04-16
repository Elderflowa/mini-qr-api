const express = require('express');
const cors    = require('cors');
const path    = require('path');

require('./db'); // init DB on startup

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded logos
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, 'uploads');
app.use('/uploads', express.static(UPLOADS_DIR));

// API routes
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/admin',     require('./routes/admin'));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`[server] listening on :${PORT}`));
