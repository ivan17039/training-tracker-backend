require("dotenv").config();
const express = require("express");
const app = express();

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const users = [];
let nextUserId = 1;

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

  const existing = users.find((u) => u.email === email);
  if (existing) {
    return res.status(400).json({ error: "Email je već registriran" });
  }

  if (!email.includes("@")) {
    return res.status(400).json({ error: "Email nije u ispravnom obliku" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = { id: nextUserId++, email, passwordHash };
  users.push(user);

  res.json({ userId: user.id });
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  const user = users.find((u) => u.email === email);
  if (!user) {
    return res.status(401).json({ error: "Pogrešan email ili lozinka" });
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ error: "Pogrešan email ili lozinka" });
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log("Token payload:", decoded);
  console.log("Očekivani userId:", user.id);
  console.log("Poklapa se:", decoded.userId === user.id);

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
