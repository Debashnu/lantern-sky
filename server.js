const express = require("express");
const fs = require("fs/promises");
const path = require("path");

const app = express();
const FILE = path.join(__dirname, "wishes.json");

app.use(express.json({ limit: "2kb" }));
app.use(express.static(path.join(__dirname, "public")));

async function readWishes() {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8"));
  } catch {
    return []; // file doesn't exist yet
  }
}

// Send every saved wish to the browser
app.get("/api/wishes", async (req, res) => {
  res.json(await readWishes());
});

// Save a new wish
app.post("/api/wishes", async (req, res) => {
  const text = typeof req.body.text === "string" ? req.body.text.trim() : "";
  if (!text || text.length > 120) {
    return res.status(400).json({ error: "A wish must be 1 to 120 characters." });
  }
  const wishes = await readWishes();
  const wish = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    text,
    createdAt: new Date().toISOString(),
  };
  wishes.push(wish);
  await fs.writeFile(FILE, JSON.stringify(wishes.slice(-200), null, 2)); // keep the latest 200
  res.status(201).json(wish);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Lantern Sky running at http://localhost:${PORT}`));