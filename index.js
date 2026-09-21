const express = require("express");
const app = express();

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
