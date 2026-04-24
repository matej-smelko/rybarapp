// server.js – RybářApp Backend
// Spuštění: npm install && node server.js

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

const app = express();
const PORT = 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'rybarapp-secret-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// Database
const db = new sqlite3.Database('./rybarapp.db');
const dbGet = promisify(db.get.bind(db));
const dbAll = promisify(db.all.bind(db));
const dbRun = promisify(db.run.bind(db));

// JWT middleware
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Chybí autorizační token' });
  }
  try {
    req.user = jwt.verify(auth.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Neplatný nebo expirovaný token' });
  }
}

// Rate limiter (jednoduchý in-memory)
const loginAttempts = new Map();
function rateLimiter(req, res, next) {
  const ip = req.ip;
  const now = Date.now();
  const attempts = (loginAttempts.get(ip) || []).filter(t => now - t < 60000);
  if (attempts.length >= 10) {
    return res.status(429).json({ error: 'Příliš mnoho pokusů. Zkuste to za minutu.' });
  }
  attempts.push(now);
  loginAttempts.set(ip, attempts);
  next();
}

// ==================== DATABÁZE – INICIALIZACE ====================
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'rybar',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS catches (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      species TEXT NOT NULL,
      weight_g INTEGER NOT NULL,
      length_cm INTEGER DEFAULT 0,
      revir TEXT NOT NULL,
      bait TEXT,
      note TEXT,
      caught_date TEXT NOT NULL,
      caught_time TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS fisheries (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT,
      river_basin TEXT,
      description TEXT,
      lat REAL,
      lng REAL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS forum_posts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      likes_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS forum_likes (
      user_id TEXT NOT NULL,
      post_id TEXT NOT NULL,
      PRIMARY KEY (user_id, post_id)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES forum_posts(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `, async () => {
    // Seed data pokud je tabulka prázdná nebo pokud chci zajistit výchozí účet
    try {
      const defaultEmail = 'matej@example.com';
      const defaultPassword = 'rybar123';
      const defaultName = 'Matěj Šmelko';
      const defaultRole = 'rybar';
      const defaultId = 'u1';
      const defaultHash = await bcrypt.hash(defaultPassword, 12);
      const existingUser = await dbGet('SELECT * FROM users WHERE email = ?', [defaultEmail]);

      if (!existingUser) {
        await dbRun('INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
          [defaultId, defaultName, defaultEmail, defaultHash, defaultRole]);
      } else {
        await dbRun('UPDATE users SET name = ?, password_hash = ?, role = ? WHERE email = ?',
          [defaultName, defaultHash, defaultRole, defaultEmail]);
      }

      const fisheriesCount = await dbGet('SELECT COUNT(*) as cnt FROM fisheries');
      if (fisheriesCount.cnt === 0) {
        await dbRun('INSERT INTO fisheries (id, name, location, river_basin, lat, lng) VALUES (?, ?, ?, ?, ?, ?)',
          ['f1', 'Revír Ostravice č. 1', 'Ostrava-Muglinov', 'Ostravice', 49.8343, 18.2940]);
        await dbRun('INSERT INTO fisheries (id, name, location, river_basin, lat, lng) VALUES (?, ?, ?, ?, ?, ?)',
          ['f2', 'Revír Odra – Svinov', 'Ostrava-Svinov', 'Odra', 49.8205, 18.2261]);
        await dbRun('INSERT INTO fisheries (id, name, location, river_basin) VALUES (?, ?, ?, ?)',
          ['f3', 'Revír Bečva – Přerov', 'Přerov', 'Bečva']);
      }

      const postsCount = await dbGet('SELECT COUNT(*) as cnt FROM forum_posts');
      if (postsCount.cnt === 0) {
        await dbRun('INSERT INTO forum_posts (id, user_id, category, title, body) VALUES (?, ?, ?, ?, ?)',
          ['p1', 'u1', 'Tipy', 'Jak chytat v dešti', 'Nejlepší nástrahy pro deštivé dny jsou živé červy a menší gumové rybky.']);
        await dbRun('INSERT INTO forum_posts (id, user_id, category, title, body) VALUES (?, ?, ?, ?, ?)',
          ['p2', 'u1', 'Úlovky', 'Dnešní úlovek štiky', 'Dnes ráno jsem ulovil 78 cm štiku na prut 3,5 lb.']);
      }

      console.log('✓ Výchozí uživatel a data jsou připravená');
    } catch (err) {
      console.error('Chyba při inicializaci databáze:', err);
    }
  });
});

// ==================== AUTH ROUTES ====================

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  console.log('Register request:', req.body);
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 8) {
    return res.status(400).json({ error: 'Neplatná vstupní data' });
  }
  try {
    console.log('Hashing password...');
    const hash = await bcrypt.hash(password, 12);
    const id = uuidv4();
    console.log('Inserting user...');
    await dbRun('INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)',
      [id, name.trim(), email.toLowerCase().trim(), hash]);
    console.log('Creating token...');
    const token = jwt.sign({ id, name, email, role: 'rybar' }, JWT_SECRET, { expiresIn: '7d' });
    console.log('Sending response...');
    res.status(201).json({ token, user: { id, name, email, role: 'rybar' } });
  } catch (e) {
    console.error('Register error:', e);
    if (e.code === 'SQLITE_CONSTRAINT') {
      return res.status(409).json({ error: 'E-mail je již registrován' });
    }
    res.status(500).json({ error: 'Chyba serveru' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', rateLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Vyplňte e-mail a heslo' });

  try {
    const user = await dbGet('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (!user) return res.status(401).json({ error: 'Nesprávné přihlašovací údaje' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Nesprávné přihlašovací údaje' });

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: 'Chyba serveru' });
  }
});

// ==================== CATCHES ROUTES ====================

// GET /api/catches – vlastní úlovky
app.get('/api/catches', authMiddleware, async (req, res) => {
  const { species, from, to, limit = 50, offset = 0 } = req.query;
  try {
    let sql = 'SELECT * FROM catches WHERE user_id = ?';
    const params = [req.user.id];
    if (species) { sql += ' AND species = ?'; params.push(species); }
    if (from) { sql += ' AND caught_date >= ?'; params.push(from); }
    if (to) { sql += ' AND caught_date <= ?'; params.push(to); }
    sql += ' ORDER BY caught_date DESC, caught_time DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));
    const catches = await dbAll(sql, params);
    res.json({ catches, total: catches.length });
  } catch (err) {
    res.status(500).json({ error: 'Chyba serveru' });
  }
});

// POST /api/catches
app.post('/api/catches', authMiddleware, async (req, res) => {
  const { species, weight_g, length_cm, revir, bait, note, caught_date, caught_time } = req.body;
  if (!species || !weight_g || !revir || !caught_date) {
    return res.status(400).json({ error: 'Chybí povinná pole' });
  }
  if (weight_g < 1 || weight_g > 100000) return res.status(400).json({ error: 'Neplatná váha' });

  try {
    const id = uuidv4();
    await dbRun(`INSERT INTO catches (id, user_id, species, weight_g, length_cm, revir, bait, note, caught_date, caught_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, req.user.id, species, weight_g, length_cm || 0, revir, bait || '', note || '', caught_date, caught_time || '']);
    const c = await dbGet('SELECT * FROM catches WHERE id = ?', [id]);
    res.status(201).json(c);
  } catch (err) {
    res.status(500).json({ error: 'Chyba serveru' });
  }
});

// GET /api/catches/:id
app.get('/api/catches/:id', authMiddleware, async (req, res) => {
  try {
    const c = await dbGet('SELECT * FROM catches WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!c) return res.status(404).json({ error: 'Úlovek nenalezen' });
    res.json(c);
  } catch (err) {
    res.status(500).json({ error: 'Chyba serveru' });
  }
});

// DELETE /api/catches/:id
app.delete('/api/catches/:id', authMiddleware, async (req, res) => {
  try {
    const result = await dbRun('DELETE FROM catches WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (result.changes === 0) return res.status(404).json({ error: 'Úlovek nenalezen' });
    res.json({ message: 'Úlovek smazán' });
  } catch (err) {
    res.status(500).json({ error: 'Chyba serveru' });
  }
});

// GET /api/catches/stats – statistiky pro přihlášeného uživatele
app.get('/api/stats', authMiddleware, async (req, res) => {
  try {
    const total = await dbGet('SELECT COUNT(*) as cnt FROM catches WHERE user_id = ?', [req.user.id]);
    const heaviest = await dbGet('SELECT MAX(weight_g) as max FROM catches WHERE user_id = ?', [req.user.id]);
    const speciesCount = await dbGet('SELECT COUNT(DISTINCT species) as cnt FROM catches WHERE user_id = ?', [req.user.id]);
    const bySpecies = await dbAll('SELECT species, COUNT(*) as cnt FROM catches WHERE user_id = ? GROUP BY species ORDER BY cnt DESC', [req.user.id]);
    res.json({ total: total.cnt, heaviest: heaviest.max || 0, speciesCount: speciesCount.cnt, bySpecies });
  } catch (err) {
    res.status(500).json({ error: 'Chyba serveru' });
  }
});

// ==================== FISHERIES ROUTES ====================

// GET /api/fisheries
app.get('/api/fisheries', authMiddleware, async (req, res) => {
  try {
    const fisheries = await dbAll('SELECT * FROM fisheries ORDER BY name');
    res.json(fisheries);
  } catch (err) {
    res.status(500).json({ error: 'Chyba serveru' });
  }
});

// ==================== FORUM ROUTES ====================

// GET /api/posts
app.get('/api/posts', authMiddleware, async (req, res) => {
  const { category, limit = 20, offset = 0 } = req.query;
  try {
    let sql = `SELECT p.*, u.name as author_name
      FROM forum_posts p JOIN users u ON p.user_id = u.id`;
    const params = [];
    if (category) { sql += ' WHERE p.category = ?'; params.push(category); }
    sql += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));
    const posts = await dbAll(sql, params);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: 'Chyba serveru' });
  }
});

// POST /api/posts
app.post('/api/posts', authMiddleware, async (req, res) => {
  const { category, title, body } = req.body;
  if (!category || !title || !body) return res.status(400).json({ error: 'Chybí povinná pole' });
  if (title.length > 200) return res.status(400).json({ error: 'Nadpis je příliš dlouhý' });

  try {
    const id = uuidv4();
    await dbRun('INSERT INTO forum_posts (id, user_id, category, title, body) VALUES (?, ?, ?, ?, ?)',
      [id, req.user.id, category, title.trim(), body.trim()]);
    const post = await dbGet('SELECT p.*, u.name as author_name FROM forum_posts p JOIN users u ON p.user_id = u.id WHERE p.id = ?', [id]);
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ error: 'Chyba serveru' });
  }
});

// POST /api/posts/:id/like
app.post('/api/posts/:id/like', authMiddleware, async (req, res) => {
  try {
    const post = await dbGet('SELECT * FROM forum_posts WHERE id = ?', [req.params.id]);
    if (!post) return res.status(404).json({ error: 'Příspěvek nenalezen' });

    const existing = await dbGet('SELECT * FROM forum_likes WHERE user_id = ? AND post_id = ?', [req.user.id, post.id]);
    if (existing) {
      await dbRun('DELETE FROM forum_likes WHERE user_id = ? AND post_id = ?', [req.user.id, post.id]);
      await dbRun('UPDATE forum_posts SET likes_count = likes_count - 1 WHERE id = ?', [post.id]);
      res.json({ liked: false });
    } else {
      await dbRun('INSERT INTO forum_likes (user_id, post_id) VALUES (?, ?)', [req.user.id, post.id]);
      await dbRun('UPDATE forum_posts SET likes_count = likes_count + 1 WHERE id = ?', [post.id]);
      res.json({ liked: true });
    }
  } catch (err) {
    res.status(500).json({ error: 'Chyba serveru' });
  }
});

// GET /api/posts/:id/comments
app.get('/api/posts/:id/comments', authMiddleware, async (req, res) => {
  try {
    const comments = await dbAll(`SELECT c.*, u.name as author_name
      FROM comments c JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ? ORDER BY c.created_at ASC`, [req.params.id]);
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: 'Chyba serveru' });
  }
});

// POST /api/posts/:id/comments
app.post('/api/posts/:id/comments', authMiddleware, async (req, res) => {
  const { body } = req.body;
  if (!body || !body.trim()) return res.status(400).json({ error: 'Komentář nesmí být prázdný' });
  try {
    const post = await dbGet('SELECT id FROM forum_posts WHERE id = ?', [req.params.id]);
    if (!post) return res.status(404).json({ error: 'Příspěvek nenalezen' });

    const id = uuidv4();
    await dbRun('INSERT INTO comments (id, post_id, user_id, body) VALUES (?, ?, ?, ?)', [id, req.params.id, req.user.id, body.trim()]);
    const comment = await dbGet('SELECT c.*, u.name as author_name FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?', [id]);
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: 'Chyba serveru' });
  }
});

// ==================== START ====================
app.listen(PORT, () => {
  console.log(`\n🐟 RybářApp API běží na http://localhost:${PORT}`);
  console.log('📋 Dostupné endpointy:');
  console.log('   POST   /api/auth/register');
  console.log('   POST   /api/auth/login');
  console.log('   GET    /api/catches');
  console.log('   POST   /api/catches');
  console.log('   DELETE /api/catches/:id');
  console.log('   GET    /api/stats');
  console.log('   GET    /api/fisheries');
  console.log('   GET    /api/posts');
  console.log('   POST   /api/posts');
  console.log('   POST   /api/posts/:id/like');
  console.log('   GET    /api/posts/:id/comments');
  console.log('   POST   /api/posts/:id/comments\n');
});
