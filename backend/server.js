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
        likes_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS comment_likes (
        user_id TEXT NOT NULL,
        comment_id TEXT NOT NULL,
        PRIMARY KEY (user_id, comment_id)
      );
    `);

    // Migrace: přidání chybějících sloupců do comments (safe - nefailuje pokud už existuje)
    try { await db.query('ALTER TABLE comments ADD COLUMN likes_count INTEGER DEFAULT 0'); } catch {}
    try { await db.query('ALTER TABLE comments ADD COLUMN parent_id TEXT REFERENCES comments(id)'); } catch {}
    // Migrace: přidání data narození do users
    try { await db.query('ALTER TABLE users ADD COLUMN date_of_birth TEXT'); } catch {}

    // Tabulka ryb pro encyklopedii
    await db.query(`
      CREATE TABLE IF NOT EXISTS fish (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        latin TEXT,
        mir TEXT,
        maxSize TEXT,
        maxLength TEXT,
        depth TEXT,
        habitat TEXT,
        difficulty INTEGER DEFAULT 3,
        season TEXT,
        bait TEXT,
        description TEXT,
        tips TEXT,
        record TEXT,
        image TEXT
      );
    `);

    // Seed ryb
    const existingCount = await db.get('SELECT COUNT(*) AS cnt FROM fish');
    if (parseInt(existingCount.cnt) === 0) {
      const seedFish = require('./seed-fish.js');
      for (const f of seedFish) {
        await db.query(`INSERT INTO fish (id,name,latin,mir,maxSize,maxLength,depth,habitat,difficulty,season,bait,description,tips,record,image)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
          [f.id, f.name, f.latin||'', f.mir||'', f.maxSize||'', f.maxLength||'', f.depth||'', f.habitat||'', f.difficulty||3, JSON.stringify(f.season||[]), JSON.stringify(f.bait||[]), f.description||'', f.tips||'', f.record||'', f.image||'']);
      }
      console.log('✓ Ryby seedovány');
    }

    // Seed data - admin účet
    const admin = await db.get('SELECT * FROM users WHERE email = $1', ['admin@rybarapp.cz']);
    if (!admin) {
      const hash = await bcrypt.hash('Admin123', 12);
      await db.query('INSERT INTO users (id, name, email, password_hash, role, date_of_birth) VALUES ($1, $2, $3, $4, $5, $6)',
        ['admin1', 'Admin RybářApp', 'admin@rybarapp.cz', hash, 'admin', '1990-01-01']);
      console.log('✓ Admin účet vytvořen (admin@rybarapp.cz / Admin123)');
    }
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
  const { name, email, password, password_confirmation, date_of_birth } = req.body;
  if (!name || !email || !password || !password_confirmation || !date_of_birth) {
    return res.status(400).json({ error: 'Vyplňte všechna povinná pole' });
  }
  if (password !== password_confirmation) {
    return res.status(400).json({ error: 'Hesla se neshodují' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Heslo musí mít alespoň 8 znaků' });
  }
  if (!/[A-Z]/.test(password)) {
    return res.status(400).json({ error: 'Heslo musí obsahovat alespoň jedno velké písmeno' });
  }
  if (!/[0-9]/.test(password)) {
    return res.status(400).json({ error: 'Heslo musí obsahovat alespoň jedno číslo' });
  }
  try {
    const hash = await bcrypt.hash(password, 12);
    const id = uuidv4();
    await db.query('INSERT INTO users (id, name, email, password_hash, role, date_of_birth) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, name.trim(), email.toLowerCase().trim(), hash, 'rybar', date_of_birth]);
    const token = jwt.sign({ id, name, email, role: 'rybar' }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id, name, email, role: 'rybar', date_of_birth } });
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
      res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, date_of_birth: user.date_of_birth } });
  } catch (err) {
    res.status(500).json({ error: 'Chyba serveru' });
  }
});

app.get('/api/users/me/stats', authMiddleware, async (req, res) => {
  try {
    const catches = await db.get('SELECT COUNT(*) AS cnt FROM catches WHERE user_id = $1', [req.user.id]);
    const posts = await db.get('SELECT COUNT(*) AS cnt FROM forum_posts WHERE user_id = $1', [req.user.id]);
    const comments = await db.get('SELECT COUNT(*) AS cnt FROM comments WHERE user_id = $1', [req.user.id]);
    res.json({
      catches: parseInt(catches.cnt) || 0,
      posts: parseInt(posts.cnt) || 0,
      comments: parseInt(comments.cnt) || 0,
    });
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

// Smazání úlovku
app.delete('/api/catches/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'DELETE FROM catches WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Úlovek nenalezen nebo nemáte oprávnění.' });
    }

    res.json({ message: 'Úlovek byl úspěšně smazán.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Chyba serveru při mazání.' });
  }
});

app.post('/api/catches', authMiddleware, async (req, res) => {
  const { species, weight_g, length_cm, revir, bait, note, caught_date, caught_time, image_url } = req.body;
  try {
    const id = uuidv4();
    await db.query(`INSERT INTO catches (id, user_id, species, weight_g, length_cm, revir, bait, note, caught_date, caught_time, image_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [id, req.user.id, species, weight_g || 0, length_cm || 0, revir, bait || '', note || '', caught_date, caught_time || '', image_url || '']);
    res.status(201).json({ id, species });
  } catch (err) {
    res.status(500).json({ error: 'Chyba serveru' });
  }
});

app.put('/api/catches/:id', authMiddleware, async (req, res) => {
  const { species, weight_g, length_cm, revir, bait, note, caught_date, caught_time, image_url } = req.body;
  try {
    const existing = await db.get('SELECT * FROM catches WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (!existing) return res.status(404).json({ error: 'Úlovek nenalezen' });

    await db.query(`UPDATE catches SET species=$1, weight_g=$2, length_cm=$3, revir=$4, bait=$5, note=$6, caught_date=$7, caught_time=$8, image_url=$9 WHERE id=$10`,
      [species, weight_g || 0, length_cm || 0, revir, bait || '', note || '', caught_date, caught_time || '', image_url || '', req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Chyba serveru' });
  }
});

// ==================== FÓRUM ====================

app.get('/api/posts', async (req, res) => {
  try {
    let userId = null;
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ')) {
      try { userId = jwt.verify(auth.slice(7), JWT_SECRET).id; } catch {}
    }
    const posts = await db.all(`
      SELECT p.*, u.name AS author_name,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comments_count
      FROM forum_posts p
      JOIN users u ON u.id = p.user_id
      ORDER BY p.created_at DESC
    `);
    if (userId) {
      const likedPostIds = new Set(
        (await db.all('SELECT post_id FROM forum_likes WHERE user_id = $1', [userId]))
          .map(r => r.post_id)
      );
      for (const post of posts) {
        post.liked = likedPostIds.has(post.id);
      }
    }
    res.json({ posts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Chyba serveru' });
  }
});

app.post('/api/posts', authMiddleware, async (req, res) => {
  const { category, title, body } = req.body;
  if (!title || !body) {
    return res.status(400).json({ error: 'Nadpis a text jsou povinné' });
  }
  try {
    const id = uuidv4();
    await db.query(
      'INSERT INTO forum_posts (id, user_id, category, title, body) VALUES ($1, $2, $3, $4, $5)',
      [id, req.user.id, category || 'Diskuse', title, body]
    );
    const post = await db.get(
      'SELECT p.*, u.name AS author_name FROM forum_posts p JOIN users u ON u.id = p.user_id WHERE p.id = $1',
      [id]
    );
    res.status(201).json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Chyba serveru' });
  }
});

app.put('/api/posts/:id', authMiddleware, async (req, res) => {
  const { category, title, body } = req.body;
  try {
    const post = await db.get('SELECT * FROM forum_posts WHERE id = $1', [req.params.id]);
    if (!post) return res.status(404).json({ error: 'Příspěvek nenalezen' });
    if (post.user_id !== req.user.id) return res.status(403).json({ error: 'Nemáte oprávnění' });
    await db.query(
      'UPDATE forum_posts SET category = $1, title = $2, body = $3 WHERE id = $4',
      [category || post.category, title || post.title, body || post.body, req.params.id]
    );
    const updated = await db.get(
      'SELECT p.*, u.name AS author_name FROM forum_posts p JOIN users u ON u.id = p.user_id WHERE p.id = $1',
      [req.params.id]
    );
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Chyba serveru' });
  }
});

app.delete('/api/posts/:id', authMiddleware, async (req, res) => {
  try {
    const post = await db.get('SELECT * FROM forum_posts WHERE id = $1', [req.params.id]);
    if (!post) return res.status(404).json({ error: 'Příspěvek nenalezen' });
    if (post.user_id !== req.user.id) return res.status(403).json({ error: 'Nemáte oprávnění' });
    // Smažeme komentáře, lajky komentářů, lajky příspěvku a nakonec příspěvek
    const commentIds = await db.all('SELECT id FROM comments WHERE post_id = $1', [req.params.id]);
    const ids = commentIds.map(r => r.id);
    if (ids.length > 0) {
      await db.query('DELETE FROM comment_likes WHERE comment_id = ANY($1)', [ids]);
      await db.query('DELETE FROM comments WHERE post_id = $1', [req.params.id]);
    }
    await db.query('DELETE FROM forum_likes WHERE post_id = $1', [req.params.id]);
    await db.query('DELETE FROM forum_posts WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Chyba serveru' });
  }
});

app.post('/api/posts/:id/like', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.get(
      'SELECT * FROM forum_likes WHERE user_id = $1 AND post_id = $2',
      [req.user.id, id]
    );
    if (existing) {
      await db.query('DELETE FROM forum_likes WHERE user_id = $1 AND post_id = $2', [req.user.id, id]);
      await db.query('UPDATE forum_posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = $1', [id]);
      res.json({ liked: false });
    } else {
      await db.query('INSERT INTO forum_likes (user_id, post_id) VALUES ($1, $2)', [req.user.id, id]);
      await db.query('UPDATE forum_posts SET likes_count = likes_count + 1 WHERE id = $1', [id]);
      res.json({ liked: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Chyba serveru' });
  }
});

app.get('/api/posts/:id/comments', async (req, res) => {
  try {
    let userId = null;
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ')) {
      try { userId = jwt.verify(auth.slice(7), JWT_SECRET).id; } catch {}
    }
    const comments = await db.all(
      'SELECT c.*, u.name AS author_name FROM comments c JOIN users u ON u.id = c.user_id WHERE c.post_id = $1 ORDER BY c.created_at ASC',
      [req.params.id]
    );
    if (userId) {
      const likedCommentIds = new Set(
        (await db.all('SELECT comment_id FROM comment_likes WHERE user_id = $1', [userId]))
          .map(r => r.comment_id)
      );
      for (const c of comments) {
        c.liked = likedCommentIds.has(c.id);
      }
    }
    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Chyba serveru' });
  }
});

app.post('/api/posts/:id/comments', authMiddleware, async (req, res) => {
  const { body, parent_id } = req.body;
  if (!body || !body.trim()) {
    return res.status(400).json({ error: 'Text komentáře je povinný' });
  }
  try {
    const id = uuidv4();
    await db.query(
      'INSERT INTO comments (id, post_id, user_id, body, parent_id) VALUES ($1, $2, $3, $4, $5)',
      [id, req.params.id, req.user.id, body.trim(), parent_id || null]
    );
    const comment = await db.get(
      'SELECT c.*, u.name AS author_name FROM comments c JOIN users u ON u.id = c.user_id WHERE c.id = $1',
      [id]
    );
    comment.liked = false;
    res.status(201).json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Chyba serveru' });
  }
});

app.post('/api/comments/:id/like', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.get(
      'SELECT * FROM comment_likes WHERE user_id = $1 AND comment_id = $2',
      [req.user.id, id]
    );
    if (existing) {
      await db.query('DELETE FROM comment_likes WHERE user_id = $1 AND comment_id = $2', [req.user.id, id]);
      await db.query('UPDATE comments SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = $1', [id]);
      res.json({ liked: false });
    } else {
      await db.query('INSERT INTO comment_likes (user_id, comment_id) VALUES ($1, $2)', [req.user.id, id]);
      await db.query('UPDATE comments SET likes_count = likes_count + 1 WHERE id = $1', [id]);
      res.json({ liked: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Chyba serveru' });
  }
});

app.delete('/api/comments/:id', authMiddleware, async (req, res) => {
  try {
    const comment = await db.get('SELECT * FROM comments WHERE id = $1', [req.params.id]);
    if (!comment) return res.status(404).json({ error: 'Komentář nenalezen' });
    if (comment.user_id !== req.user.id) return res.status(403).json({ error: 'Nemáte oprávnění' });

    // Sběr všech potomků (libovolná hloubka)
    const toDelete = [comment.id];
    const queue = [comment.id];
    while (queue.length > 0) {
      const children = await db.all('SELECT id FROM comments WHERE parent_id = $1', [queue.shift()]);
      for (const c of children) {
        toDelete.push(c.id);
        queue.push(c.id);
      }
    }

    await db.query('DELETE FROM comment_likes WHERE comment_id = ANY($1)', [toDelete]);
    await db.query('DELETE FROM comments WHERE id = ANY($1)', [toDelete]);
    res.json({ success: true, deleted: toDelete });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Chyba serveru' });
  }
});

app.put('/api/comments/:id', authMiddleware, async (req, res) => {
  try {
    const { body } = req.body;
    if (!body || !body.trim()) {
      return res.status(400).json({ error: 'Text komentáře je povinný' });
    }
    const comment = await db.get('SELECT * FROM comments WHERE id = $1', [req.params.id]);
    if (!comment) return res.status(404).json({ error: 'Komentář nenalezen' });
    if (comment.user_id !== req.user.id) return res.status(403).json({ error: 'Nemáte oprávnění' });

    await db.query('UPDATE comments SET body = $1 WHERE id = $2', [body.trim(), req.params.id]);
    const updated = await db.get(
      'SELECT c.*, u.name AS author_name FROM comments c JOIN users u ON u.id = c.user_id WHERE c.id = $1',
      [req.params.id]
    );
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Chyba serveru' });
  }
});

// ==================== RYBY (Encyklopedie) ====================

const seedFish = require('./seed-fish.js');

app.get('/api/fish', async (req, res) => {
  try {
    const rows = await db.all('SELECT * FROM fish ORDER BY name ASC');
    for (const r of rows) {
      if (typeof r.season === 'string') r.season = JSON.parse(r.season);
      if (typeof r.bait === 'string') r.bait = JSON.parse(r.bait);
    }
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Chyba serveru' });
  }
});

app.get('/api/fish/:id', async (req, res) => {
  try {
    const fish = await db.get('SELECT * FROM fish WHERE id = $1', [req.params.id]);
    if (!fish) return res.status(404).json({ error: 'Ryba nenalezena' });
    if (typeof fish.season === 'string') fish.season = JSON.parse(fish.season);
    if (typeof fish.bait === 'string') fish.bait = JSON.parse(fish.bait);
    res.json(fish);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Chyba serveru' });
  }
});

function adminMiddleware(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Přístup pouze pro administrátora' });
  }
  next();
}

app.post('/api/fish', authMiddleware, adminMiddleware, async (req, res) => {
  const { name, latin, mir, maxSize, maxLength, depth, habitat, difficulty, season, bait, description, tips, record, image } = req.body;
  try {
    const id = uuidv4();
    await db.query(`INSERT INTO fish (id,name,latin,mir,maxSize,maxLength,depth,habitat,difficulty,season,bait,description,tips,record,image)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [id, name, latin, mir||'', maxSize||'', maxLength||'', depth||'', habitat||'', difficulty||3, JSON.stringify(season||[]), JSON.stringify(bait||[]), description||'', tips||'', record||'', image||'']);
    const fish = await db.get('SELECT * FROM fish WHERE id = $1', [id]);
    if (typeof fish.season === 'string') fish.season = JSON.parse(fish.season);
    if (typeof fish.bait === 'string') fish.bait = JSON.parse(fish.bait);
    res.status(201).json(fish);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Chyba serveru' });
  }
});

app.put('/api/fish/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const { name, latin, mir, maxSize, maxLength, depth, habitat, difficulty, season, bait, description, tips, record, image } = req.body;
  try {
    const existing = await db.get('SELECT * FROM fish WHERE id = $1', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Ryba nenalezena' });
    await db.query(`UPDATE fish SET name=$1,latin=$2,mir=$3,maxSize=$4,maxLength=$5,depth=$6,habitat=$7,difficulty=$8,season=$9,bait=$10,description=$11,tips=$12,record=$13,image=$14 WHERE id=$15`,
      [name, latin, mir||'', maxSize||'', maxLength||'', depth||'', habitat||'', difficulty||3, JSON.stringify(season||[]), JSON.stringify(bait||[]), description||'', tips||'', record||'', image||'', req.params.id]);
    const fish = await db.get('SELECT * FROM fish WHERE id = $1', [req.params.id]);
    if (typeof fish.season === 'string') fish.season = JSON.parse(fish.season);
    if (typeof fish.bait === 'string') fish.bait = JSON.parse(fish.bait);
    res.json(fish);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Chyba serveru' });
  }
});

app.delete('/api/fish/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await db.query('DELETE FROM fish WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Chyba serveru' });
  }
});

app.listen(PORT, () => {
  console.log(`Server běží na portu ${PORT}`);
});