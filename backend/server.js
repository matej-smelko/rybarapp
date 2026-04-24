// server.js – RybářApp Backend (PostgreSQL verze pro Railway)
const express = require('express');
const { Pool } = require('pg'); // Změna na PostgreSQL
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
// Railway si port dosazuje sám přes process.env.PORT
const PORT = process.env.PORT || 3001; 
const JWT_SECRET = process.env.JWT_SECRET || 'rybarapp-secret-default';

// Middleware
app.use(cors());
app.use(express.json());

// Database - PostgreSQL Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Nutné pro Railway/Render konektivitu
  }
});

// Pomocná funkce pro dotazy (napodobuje promisify z sqlite)
const db = {
  query: (text, params) => pool.query(text, params),
  get: async (text, params) => {
    const res = await pool.query(text, params);
    return res.rows[0];
  },
  all: async (text, params) => {
    const res = await pool.query(text, params);
    return res.rows;
  }
};

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

// Inicializace DB tabulek
async function initDB() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'rybar',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS catches (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        species TEXT NOT NULL,
        weight_g INTEGER NOT NULL,
        length_cm INTEGER DEFAULT 0,
        revir TEXT NOT NULL,
        bait TEXT,
        note TEXT,
        caught_date TEXT NOT NULL,
        caught_time TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        image_url TEXT
      );
      CREATE TABLE IF NOT EXISTS fisheries (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        location TEXT,
        river_basin TEXT,
        description TEXT,
        lat REAL,
        lng REAL
      );
      CREATE TABLE IF NOT EXISTS forum_posts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        likes_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS forum_likes (
        user_id TEXT NOT NULL,
        post_id TEXT NOT NULL,
        PRIMARY KEY (user_id, post_id)
      );
      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL REFERENCES forum_posts(id),
        user_id TEXT NOT NULL REFERENCES users(id),
        body TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed data
    const defaultEmail = 'matej@example.com';
    const user = await db.get('SELECT * FROM users WHERE email = $1', [defaultEmail]);
    if (!user) {
      const hash = await bcrypt.hash('rybar123', 12);
      await db.query('INSERT INTO users (id, name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)',
        ['u1', 'Matěj Šmelko', defaultEmail, hash, 'rybar']);
      console.log('✓ Výchozí uživatel vytvořen');
    }
  } catch (err) {
    console.error('Chyba inicializace DB:', err);
  }
}

initDB();

// ==================== API ROUTES (Upraveno pro PostgreSQL $1, $2...) ====================

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hash = await bcrypt.hash(password, 12);
    const id = uuidv4();
    await db.query('INSERT INTO users (id, name, email, password_hash) VALUES ($1, $2, $3, $4)',
      [id, name.trim(), email.toLowerCase().trim(), hash]);
    const token = jwt.sign({ id, name, email, role: 'rybar' }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id, name, email, role: 'rybar' } });
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'E-mail je již registrován' });
    res.status(500).json({ error: 'Chyba serveru' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await db.get('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Nesprávné údaje' });
    }
    const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: 'Chyba serveru' });
  }
});

app.get('/api/catches', authMiddleware, async (req, res) => {
  try {
    const catches = await db.all('SELECT * FROM catches WHERE user_id = $1 ORDER BY caught_date DESC', [req.user.id]);
    res.json({ catches, total: catches.length });
  } catch (err) {
    res.status(500).json({ error: 'Chyba serveru' });
  }
});

app.post('/api/catches', authMiddleware, async (req, res) => {
  const { species, weight_g, length_cm, revir, bait, note, caught_date, caught_time, image_url } = req.body;
  try {
    const id = uuidv4();
    await db.query(`INSERT INTO catches (id, user_id, species, weight_g, length_cm, revir, bait, note, caught_date, caught_time, image_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [id, req.user.id, species, weight_g, length_cm || 0, revir, bait || '', note || '', caught_date, caught_time || '', image_url || '']);
    res.status(201).json({ id, species });
  } catch (err) {
    res.status(500).json({ error: 'Chyba serveru' });
  }
});

app.listen(PORT, () => {
  console.log(`Server běží na portu ${PORT}`);
});