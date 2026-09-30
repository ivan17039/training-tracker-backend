const provjeriObavezno = require("./validacija");

require("dotenv").config();
const express = require("express");
const app = express();

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/test", (req, res) => {
  console.log("✅ Ruta je dosegnuta!");
  res.json({ message: "Uspjeh" });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.get("/", (req, res) => {
  res.json({ message: "Dobrodošli na Training Tracker API" });
});

app.post("/api/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email i lozinka su obavezni" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const result = await pool.query(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id",
      [email, passwordHash],
    );
    res.json({ userId: result.rows[0].id });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ error: "Email je već registriran" });
    }
    console.error(err);
    res.status(500).json({ error: "Nešto je pošlo po zlu" });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);
  const user = result.rows[0];

  if (!user) {
    return res.status(401).json({ error: "Pogrešan email ili lozinka" });
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ error: "Pogrešan email ili lozinka" });
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
  res.json({ token });
});

app.post("/api/verify-token", (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Token je obavezan" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({
      valid: true,
      userId: decoded.userId,
      exp: decoded.exp,
    });
  } catch (err) {
    res.status(401).json({
      valid: false,
      error: err.message,
    });
  }
});

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Token nedostaje",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (e) {
    return res.status(401).json({
      error: "Token nije valjan",
    });
  }
}

app.get("/api/me", requireAuth, (req, res) => {
  res.json({ userId: req.userId });
});

app.get("/api/ping", requireAuth, (req, res) => {
  res.json({ poruka: "pogodio si zaštićenu rutu" });
});

app.get("/api/workouts", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM workouts WHERE user_id = $1 ORDER BY date_millis DESC",
      [req.userId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Nešto je pošlo po zlu" });
  }
});

app.post("/api/workouts", requireAuth, async (req, res) => {
  const { name, dateMillis, exercises } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Ime treninga je obavezno" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO workouts (user_id, name, date_millis, exercises) VALUES ($1, $2, $3, $4) RETURNING *",
      [req.userId, name, dateMillis, JSON.stringify(exercises || [])],
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Nešto je pošlo po zlu" });
  }
});
