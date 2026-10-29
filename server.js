const express = require('express');
const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'surveybet-secret-key-2026';
const ADMIN_EMAIL = 'admin@surveybet.com';
const ADMIN_PASS = 'Admin123!';
const DB_PATH = path.join(__dirname, 'surveybet.db');

let db;

// ─── Database Setup ──────────────────────────────────────────────────────────

async function initDB() {
  const SQL = await initSqlJs();

  // Load existing DB or create new
  let fileBuffer = null;
  try {
    if (fs.existsSync(DB_PATH)) {
      fileBuffer = fs.readFileSync(DB_PATH);
    }
  } catch (e) {}

  db = fileBuffer ? new SQL.Database(fileBuffer) : new SQL.Database();

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    balance REAL DEFAULT 1000,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS surveys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT DEFAULT '',
    threshold REAL NOT NULL,
    pool_size REAL DEFAULT 0,
    yes_odds REAL DEFAULT 0.5,
    total_bets INTEGER DEFAULT 0,
    deadline TEXT NOT NULL,
    survey_firm TEXT DEFAULT '',
    status TEXT DEFAULT 'pending',
    result TEXT DEFAULT '',
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS bets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    survey_id INTEGER NOT NULL,
    side TEXT NOT NULL,
    amount REAL NOT NULL,
    odds_at_bet REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (survey_id) REFERENCES surveys(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS odds_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    survey_id INTEGER NOT NULL,
    yes_odds REAL NOT NULL,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (survey_id) REFERENCES surveys(id)
  )`);

  // Note: first user to register becomes admin automatically

  saveDB();
  console.log('Database initialized');
}

function saveDB() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

// ─── Auth Middleware ──────────────────────────────────────────────────────────

function auth(req, res, next) {
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function queryAll(sql, params) {
  const stmt = db.prepare(sql);
  if (params) stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function queryOne(sql, params) {
  const rows = queryAll(sql, params);
  return rows.length ? rows[0] : null;
}

function recalcOdds(surveyId) {
  const bets = queryAll("SELECT side, SUM(amount) as total FROM bets WHERE survey_id = ? GROUP BY side", [surveyId]);
  let yesTotal = 0, noTotal = 0;
  bets.forEach(b => {
    if (b.side === 'yes') yesTotal = b.total;
    if (b.side === 'no') noTotal = b.total;
  });
  const total = yesTotal + noTotal;
  if (total === 0) return 0.5;
  const yesOdds = Math.max(0.01, Math.min(0.99, yesTotal / total));
  db.run("UPDATE surveys SET yes_odds = ?, pool_size = ?, total_bets = (SELECT COUNT(*) FROM bets WHERE survey_id = ?) WHERE id = ?",
    [yesOdds, total, surveyId, surveyId]);
  db.run("INSERT INTO odds_history (survey_id, yes_odds) VALUES (?, ?)", [surveyId, yesOdds]);

  // Check if threshold reached
  const survey = queryOne("SELECT * FROM surveys WHERE id = ?", [surveyId]);
  if (survey && total >= survey.threshold && survey.status === 'active') {
    db.run("UPDATE surveys SET status = 'funded' WHERE id = ?", [surveyId]);
  }

  saveDB();
  return yesOdds;
}

// ─── Auth Routes ─────────────────────────────────────────────────────────────

app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: 'All fields required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be 6+ chars' });
  const exists = queryOne("SELECT id FROM users WHERE email = ?", [email]);
  if (exists) return res.status(400).json({ error: 'Email already registered' });
  const hash = bcrypt.hashSync(password, 10);
  // First user to register becomes admin
  const userCount = queryOne("SELECT COUNT(*) as c FROM users");
  const role = (userCount && userCount.c === 0) ? 'admin' : 'user';
  const balance = role === 'admin' ? 999999 : 1000;
  db.run("INSERT INTO users (email, password, name, role, balance) VALUES (?, ?, ?, ?, ?)", [email, hash, name, role, balance]);
  saveDB();
  const user = queryOne("SELECT * FROM users WHERE email = ?", [email]);
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, balance: user.balance } });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = queryOne("SELECT * FROM users WHERE email = ?", [email]);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, balance: user.balance } });
});

app.get('/api/auth/me', auth, (req, res) => {
  const user = queryOne("SELECT id, email, name, role, balance, created_at FROM users WHERE id = ?", [req.user.id]);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// ─── Survey Routes ───────────────────────────────────────────────────────────

app.get('/api/surveys', (req, res) => {
  const { status, category, search, sort } = req.query;
  let sql = "SELECT s.*, u.name as creator_name FROM surveys s LEFT JOIN users u ON s.created_by = u.id WHERE 1=1";
  const params = [];

  if (status) { sql += " AND s.status = ?"; params.push(status); }
  if (category && category !== 'All') { sql += " AND s.category = ?"; params.push(category); }
  if (search) { sql += " AND s.question LIKE ?"; params.push('%' + search + '%'); }

  if (sort === 'bets') sql += " ORDER BY s.total_bets DESC";
  else if (sort === 'deadline') sql += " ORDER BY s.deadline ASC";
  else if (sort === 'new') sql += " ORDER BY s.created_at DESC";
  else sql += " ORDER BY s.pool_size DESC";

  res.json(queryAll(sql, params));
});

app.get('/api/surveys/:id', (req, res) => {
  const survey = queryOne("SELECT s.*, u.name as creator_name FROM surveys s LEFT JOIN users u ON s.created_by = u.id WHERE s.id = ?", [req.params.id]);
  if (!survey) return res.status(404).json({ error: 'Not found' });
  const history = queryAll("SELECT yes_odds, recorded_at FROM odds_history WHERE survey_id = ? ORDER BY recorded_at ASC", [req.params.id]);
  res.json({ ...survey, history });
});

app.post('/api/surveys', auth, (req, res) => {
  const { question, category, description, threshold, deadline } = req.body;
  if (!question || !category || !threshold || !deadline) return res.status(400).json({ error: 'Missing fields' });
  db.run("INSERT INTO surveys (question, category, description, threshold, deadline, status, created_by) VALUES (?, ?, ?, ?, ?, 'pending', ?)",
    [question, category, description || '', threshold, deadline, req.user.id]);
  saveDB();
  const survey = queryOne("SELECT * FROM surveys ORDER BY id DESC LIMIT 1");
  // Record initial odds
  db.run("INSERT INTO odds_history (survey_id, yes_odds) VALUES (?, 0.5)", [survey.id]);
  saveDB();
  res.json(survey);
});

// ─── Betting Routes ──────────────────────────────────────────────────────────

app.post('/api/bets', auth, (req, res) => {
  const { survey_id, side, amount } = req.body;
  if (!survey_id || !side || !amount) return res.status(400).json({ error: 'Missing fields' });
  if (side !== 'yes' && side !== 'no') return res.status(400).json({ error: 'Side must be yes or no' });
  if (amount <= 0) return res.status(400).json({ error: 'Amount must be positive' });

  const survey = queryOne("SELECT * FROM surveys WHERE id = ?", [survey_id]);
  if (!survey) return res.status(404).json({ error: 'Survey not found' });
  if (survey.status !== 'active' && survey.status !== 'funded') return res.status(400).json({ error: 'Survey is not active' });

  const user = queryOne("SELECT * FROM users WHERE id = ?", [req.user.id]);
  if (user.balance < amount) return res.status(400).json({ error: 'Insufficient balance' });

  db.run("UPDATE users SET balance = balance - ? WHERE id = ?", [amount, req.user.id]);
  db.run("INSERT INTO bets (user_id, survey_id, side, amount, odds_at_bet) VALUES (?, ?, ?, ?, ?)",
    [req.user.id, survey_id, side, amount, survey.yes_odds]);

  const newOdds = recalcOdds(survey_id);
  const updatedUser = queryOne("SELECT balance FROM users WHERE id = ?", [req.user.id]);

  res.json({ success: true, new_odds: newOdds, balance: updatedUser.balance });
});

app.get('/api/bets/my', auth, (req, res) => {
  const bets = queryAll(
    "SELECT b.*, s.question, s.category, s.yes_odds as current_odds, s.status as survey_status, s.result " +
    "FROM bets b JOIN surveys s ON b.survey_id = s.id WHERE b.user_id = ? ORDER BY b.created_at DESC", [req.user.id]);
  res.json(bets);
});

// ─── Admin Routes ────────────────────────────────────────────────────────────

app.get('/api/admin/surveys', auth, adminOnly, (req, res) => {
  const surveys = queryAll("SELECT s.*, u.name as creator_name FROM surveys s LEFT JOIN users u ON s.created_by = u.id ORDER BY s.created_at DESC");
  res.json(surveys);
});

app.put('/api/admin/surveys/:id', auth, adminOnly, (req, res) => {
  const { status, survey_firm, result } = req.body;
  const survey = queryOne("SELECT * FROM surveys WHERE id = ?", [req.params.id]);
  if (!survey) return res.status(404).json({ error: 'Not found' });

  if (status) db.run("UPDATE surveys SET status = ? WHERE id = ?", [status, req.params.id]);
  if (survey_firm) db.run("UPDATE surveys SET survey_firm = ? WHERE id = ?", [survey_firm, req.params.id]);
  if (result) {
    db.run("UPDATE surveys SET result = ?, status = 'resolved' WHERE id = ?", [result, req.params.id]);

    // Pay out winners
    const won = result.toLowerCase().startsWith('yes') ? 'yes' : 'no';
    const totalPool = survey.pool_size;
    const winnerBets = queryAll("SELECT * FROM bets WHERE survey_id = ? AND side = ?", [req.params.id, won]);
    const winnerTotal = winnerBets.reduce((s, b) => s + b.amount, 0);

    if (winnerTotal > 0) {
      winnerBets.forEach(b => {
        const payout = (b.amount / winnerTotal) * totalPool * 0.97; // 3% platform fee
        db.run("UPDATE users SET balance = balance + ? WHERE id = ?", [payout, b.user_id]);
      });
    }
  }

  saveDB();
  res.json(queryOne("SELECT * FROM surveys WHERE id = ?", [req.params.id]));
});

app.get('/api/admin/users', auth, adminOnly, (req, res) => {
  const users = queryAll("SELECT id, email, name, role, balance, created_at FROM users ORDER BY created_at DESC");
  res.json(users);
});

app.get('/api/admin/stats', auth, adminOnly, (req, res) => {
  const totalUsers = queryOne("SELECT COUNT(*) as c FROM users");
  const totalSurveys = queryOne("SELECT COUNT(*) as c FROM surveys");
  const totalBets = queryOne("SELECT COUNT(*) as c FROM bets");
  const totalPool = queryOne("SELECT COALESCE(SUM(pool_size),0) as c FROM surveys");
  const pendingSurveys = queryOne("SELECT COUNT(*) as c FROM surveys WHERE status = 'pending'");
  res.json({
    users: totalUsers.c,
    surveys: totalSurveys.c,
    bets: totalBets.c,
    totalPool: totalPool.c,
    pendingSurveys: pendingSurveys.c
  });
});

// ─── Stats (public) ──────────────────────────────────────────────────────────

app.get('/api/stats', (req, res) => {
  const totalPool = queryOne("SELECT COALESCE(SUM(pool_size),0) as c FROM surveys WHERE status IN ('active','funded')");
  const activeSurveys = queryOne("SELECT COUNT(*) as c FROM surveys WHERE status IN ('active','funded')");
  const totalBettors = queryOne("SELECT COUNT(DISTINCT user_id) as c FROM bets");
  const resolved = queryOne("SELECT COUNT(*) as c FROM surveys WHERE status = 'resolved'");
  res.json({
    totalPool: totalPool.c,
    activeSurveys: activeSurveys.c,
    totalBettors: totalBettors.c,
    resolved: resolved.c
  });
});

// ─── Serve Frontend ──────────────────────────────────────────────────────────

app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    next();
  }
});

// ─── Start ───────────────────────────────────────────────────────────────────

const PORT = 3000;
initDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('  ✓ SurveyBet running at http://localhost:' + PORT);
    console.log('  ✓ Open that URL in your browser');
    console.log('  ✓ The FIRST user to sign up becomes Admin');
    console.log('');
  });
});
