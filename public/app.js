const canvas = document.querySelector("#canvas");
const ctx = canvas.getContext("2d");
const form = document.querySelector("#wishForm");
const wish = document.querySelector("#wish");
const count = document.querySelector("#count");

const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
const rand = (min, max) => min + Math.random() * (max - min);

let w, h;
function resize() {
  const dpr = window.devicePixelRatio || 1;
  w = innerWidth;
  h = innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener("resize", resize);
resize();

// ---- Lanterns ----
const lanterns = [];
let hovered = null;

function makeLantern(text, x, y) {
  return {
    text,
    x: x ?? rand(60, w - 60),
    y: y ?? rand(h * 0.15, h * 0.75),
    speed: rand(0.15, 0.4) * (calm ? 0.2 : 1),
    sway: rand(0, Math.PI * 2),
    swaySpeed: rand(0.008, 0.016) * (calm ? 0.2 : 1),
    size: rand(26, 38),
    flicker: rand(0, 6),
  };
}

["I wish for a quiet morning", "May everyone get home safe tonight", "I hope my plant survives this week"]
  .forEach((text) => lanterns.push(makeLantern(text)));

const posX = (l) => l.x + Math.sin(l.sway) * 18;

function drawLantern(l, t) {
  const x = posX(l), y = l.y, s = l.size;
  const flick = 0.85 + 0.15 * Math.sin(t / 200 + l.flicker);

  // soft glow around the lantern
  const glow = ctx.createRadialGradient(x, y, 2, x, y, s * 2.6);
  glow.addColorStop(0, `rgba(255, 190, 90, ${0.55 * flick})`);
  glow.addColorStop(1, "rgba(255, 190, 90, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(x - s * 3, y - s * 3, s * 6, s * 6);

  // lantern body
  const body = ctx.createLinearGradient(0, y - s * 0.7, 0, y + s * 0.7);
  body.addColorStop(0, "#ffe7a8");
  body.addColorStop(1, "#ff9d3d");
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.roundRect(x - s / 2, y - s * 0.7, s, s * 1.4, s * 0.25);
  ctx.fill();

  // dark top and bottom caps
  ctx.fillStyle = "#3a2410";
  ctx.fillRect(x - s * 0.35, y - s * 0.78, s * 0.7, s * 0.1);
  ctx.fillRect(x - s * 0.3, y + s * 0.68, s * 0.6, s * 0.1);
}

function wrap(text, max = 22) {
  const lines = [];
  let line = "";
  for (const word of text.split(" ")) {
    if ((line + " " + word).trim().length > max) {
      lines.push(line);
      line = word;
    } else {
      line = (line + " " + word).trim();
    }
  }
  lines.push(line);
  return lines;
}

function drawWish(l) {
  const lines = wrap(l.text);
  const x = posX(l), y = l.y + l.size * 1.4;
  ctx.font = "14px system-ui, sans-serif";
  ctx.textAlign = "center";
  const boxW = Math.max(...lines.map((line) => ctx.measureText(line).width)) + 20;
  const boxH = lines.length * 18 + 14;
  ctx.fillStyle = "rgba(10, 14, 36, 0.85)";
  ctx.beginPath();
  ctx.roundRect(x - boxW / 2, y, boxW, boxH, 10);
  ctx.fill();
  ctx.fillStyle = "#f4ecdc";
  lines.forEach((line, i) => ctx.fillText(line, x, y + 22 + i * 18));
}

function animate(t) {
  ctx.clearRect(0, 0, w, h);
  for (const l of lanterns) {
    l.y -= l.speed;
    l.sway += l.swaySpeed;
    if (l.y < -80) {          // floated off the top: come back from below
      l.y = h + 80;
      l.x = rand(60, w - 60);
    }
    drawLantern(l, t);
  }
  if (hovered) drawWish(hovered);
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

// ---- Mouse and touch: point at a lantern to read its wish ----
function pick(e) {
  hovered = lanterns.find((l) => Math.hypot(e.clientX - posX(l), e.clientY - l.y) < l.size * 1.2) || null;
  canvas.style.cursor = hovered ? "pointer" : "default";
}
canvas.addEventListener("pointermove", pick);
canvas.addEventListener("pointerdown", pick);
canvas.addEventListener("pointerleave", () => (hovered = null));

// ---- The wish form ----
wish.addEventListener("input", () => {
  count.textContent = wish.value.length;
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = wish.value.trim();
  if (!text) return;
  lanterns.push(makeLantern(text, w / 2 + rand(-40, 40), h - 150));
  wish.value = "";
  count.textContent = 0;
});