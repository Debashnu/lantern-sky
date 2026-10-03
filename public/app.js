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

// ---------- The scene: sky, stars, moon, hills ----------
const stars = Array.from({ length: 220 }, () => ({
  x: Math.random(), y: Math.random() * 0.8,
  r: rand(0.3, 1.4), phase: rand(0, 6), speed: rand(0.5, 2),
}));

function drawScene(t) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#050816");
  sky.addColorStop(0.55, "#141a42");
  sky.addColorStop(1, "#3b2a58");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  for (const s of stars) {
    const twinkle = 0.5 + 0.5 * Math.sin((t / 1000) * s.speed + s.phase);
    ctx.fillStyle = `rgba(255,255,255,${0.2 + 0.7 * twinkle})`;
    ctx.beginPath();
    ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // moon with a soft halo
  const mx = w * 0.8, my = h * 0.18, mr = Math.min(w, h) * 0.05;
  const halo = ctx.createRadialGradient(mx, my, mr, mx, my, mr * 5);
  halo.addColorStop(0, "rgba(255,244,214,0.28)");
  halo.addColorStop(1, "rgba(255,244,214,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(mx - mr * 5, my - mr * 5, mr * 10, mr * 10);
  ctx.fillStyle = "#fff6df";
  ctx.beginPath();
  ctx.arc(mx, my, mr, 0, Math.PI * 2);
  ctx.fill();

  // two layers of hills: the far one is lighter, the near one darker
  for (const L of [
    { base: 0.82, amp: 0.05, color: "#0e1230", f: 0.004, off: 1 },
    { base: 0.9, amp: 0.06, color: "#060818", f: 0.0025, off: 5 },
  ]) {
    ctx.fillStyle = L.color;
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w + 8; x += 8) {
      const y = h * L.base - Math.sin(x * L.f + L.off) * h * L.amp
                           - Math.sin(x * L.f * 2.3 + L.off * 2) * h * L.amp * 0.4;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.fill();
  }
}

// ---------- Lanterns ----------
const lanterns = [];
const embers = [];
const seen = new Set();
let hovered = null;

function makeLantern(text, x, y) {
  const z = x === undefined ? rand(0.55, 1) : 1;   // z = depth: small and dim is far, 1 is close
  return {
    text, z,
    x: x ?? rand(60, w - 60),
    y: y ?? rand(h * 0.1, h * 0.7),
    speed: rand(0.15, 0.4) * z * (calm ? 0.2 : 1),
    sway: rand(0, Math.PI * 2),
    swaySpeed: rand(0.008, 0.016) * (calm ? 0.2 : 1),
    size: rand(26, 38) * z,
    flicker: rand(0, 6),
  };
}

function addLantern(text, x, y) {
  lanterns.push(makeLantern(text, x, y));
  lanterns.sort((a, b) => a.z - b.z);   // far ones are drawn first
}

const posX = (l) => l.x + Math.sin(l.sway) * 18 * l.z;

function drawLantern(l, t) {
  const x = posX(l), y = l.y, s = l.size;
  const flick = 0.85 + 0.15 * Math.sin(t / 170 + l.flicker) + 0.05 * Math.sin(t / 53 + l.flicker);
  ctx.globalAlpha = 0.45 + 0.55 * l.z;

  // glow: "lighter" adds light instead of covering what's behind
  ctx.globalCompositeOperation = "lighter";
  const glow = ctx.createRadialGradient(x, y, 2, x, y, s * 3);
  glow.addColorStop(0, `rgba(255,170,70,${0.5 * flick})`);
  glow.addColorStop(1, "rgba(255,170,70,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(x - s * 3, y - s * 3, s * 6, s * 6);
  ctx.globalCompositeOperation = "source-over";

  // paper body, brighter near the flame at the bottom
  const body = ctx.createLinearGradient(0, y - s * 0.7, 0, y + s * 0.7);
  body.addColorStop(0, "#e8a24c");
  body.addColorStop(0.6, "#ffc46b");
  body.addColorStop(1, "#fff0b8");
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.roundRect(x - s / 2, y - s * 0.7, s, s * 1.4, s * 0.22);
  ctx.fill();

  // paper ribs
  ctx.strokeStyle = "rgba(120,50,0,0.28)";
  ctx.lineWidth = Math.max(1, s * 0.03);
  for (const k of [-0.17, 0.17]) {
    ctx.beginPath();
    ctx.moveTo(x + s * k, y - s * 0.68);
    ctx.lineTo(x + s * k, y + s * 0.68);
    ctx.stroke();
  }

  // flame
  const flame = ctx.createRadialGradient(x, y + s * 0.35, 0, x, y + s * 0.35, s * 0.4);
  flame.addColorStop(0, `rgba(255,255,235,${flick})`);
  flame.addColorStop(1, "rgba(255,200,100,0)");
  ctx.fillStyle = flame;
  ctx.fillRect(x - s * 0.4, y - s * 0.1, s * 0.8, s * 0.9);

  // dark caps
  ctx.fillStyle = "#3a2410";
  ctx.fillRect(x - s * 0.36, y - s * 0.78, s * 0.72, s * 0.1);
  ctx.fillRect(x - s * 0.3, y + s * 0.68, s * 0.6, s * 0.1);
  ctx.globalAlpha = 1;

  // now and then, a little ember drops from the flame
  if (!calm && Math.random() < 0.03 && embers.length < 150) {
    embers.push({ x: x + rand(-s * 0.2, s * 0.2), y: y + s * 0.8,
                  vx: rand(-0.15, 0.15), vy: rand(0.2, 0.6), life: 1 });
  }
}

function drawEmbers() {
  ctx.globalCompositeOperation = "lighter";
  for (let i = embers.length - 1; i >= 0; i--) {
    const e = embers[i];
    e.x += e.vx; e.y += e.vy; e.life -= 0.012;
    if (e.life <= 0) { embers.splice(i, 1); continue; }
    ctx.fillStyle = `rgba(255,150,60,${e.life * 0.8})`;
    ctx.beginPath();
    ctx.arc(e.x, e.y, 1.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = "source-over";
}

function wrap(text, max = 22) {
  const lines = [];
  let line = "";
  for (const word of text.split(" ")) {
    if ((line + " " + word).trim().length > max) { lines.push(line); line = word; }
    else line = (line + " " + word).trim();
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
  ctx.fillStyle = "rgba(10,14,36,0.88)";
  ctx.beginPath();
  ctx.roundRect(x - boxW / 2, y, boxW, boxH, 10);
  ctx.fill();
  ctx.fillStyle = "#f4ecdc";
  lines.forEach((line, i) => ctx.fillText(line, x, y + 22 + i * 18));
}

function animate(t) {
  drawScene(t);
  for (const l of lanterns) {
    l.y -= l.speed;
    l.sway += l.swaySpeed;
    if (l.y < -80) { l.y = h + 80; l.x = rand(60, w - 60); }
    drawLantern(l, t);
  }
  drawEmbers();
  if (hovered) drawWish(hovered);
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

// ---------- Point at a lantern to read its wish ----------
function pick(e) {
  hovered = [...lanterns].reverse()
    .find((l) => Math.hypot(e.clientX - posX(l), e.clientY - l.y) < l.size * 1.2) || null;
  canvas.style.cursor = hovered ? "pointer" : "default";
}
canvas.addEventListener("pointermove", pick);
canvas.addEventListener("pointerdown", pick);
canvas.addEventListener("pointerleave", () => (hovered = null));

// ---------- Talking to the server ----------
let firstLoad = true;

async function loadWishes() {
  try {
    const res = await fetch("/api/wishes");
    const list = await res.json();
    for (const item of list) {
      if (seen.has(item.id)) continue;      // already floating
      seen.add(item.id);
      addLantern(item.text);
    }
    if (firstLoad && list.length === 0) {   // empty sky: add a few starters
      ["I wish for a quiet morning", "May everyone get home safe tonight"]
        .forEach((text) => addLantern(text));
    }
  } catch {
    console.log("Server not reachable. Start it with: node server.js");
  }
  firstLoad = false;
}
loadWishes();
setInterval(loadWishes, 8000);   // pick up other visitors' wishes (phase 4 makes this instant)

wish.addEventListener("input", () => { count.textContent = wish.value.length; });

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = wish.value.trim();
  if (!text) return;
  wish.value = "";
  count.textContent = 0;
  try {
    const res = await fetch("/api/wishes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error("Save failed");
    const saved = await res.json();
    seen.add(saved.id);
  } catch (err) {
    console.error(err);                     // still show the lantern for this visitor
  }
  addLantern(text, w / 2 + rand(-40, 40), h - 150);
});