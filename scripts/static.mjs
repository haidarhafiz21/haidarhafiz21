// Membuat banner & kartu keahlian (tidak butuh data GitHub). Pakai: node scripts/static.mjs
import fs from "node:fs";
import { THEMES, SANS, SERIF, MONO, esc, textW, frame } from "./theme.mjs";

fs.mkdirSync("assets", { recursive: true });

/* ---------------- Banner ---------------- */
function banner() {
  const W = 1200, H = 340, P = 1200;
  // Gelombang periodik (periode = lebar banner) supaya bisa digeser terus tanpa sambungan terlihat
  const waves = [];
  const N = 16;
  for (let j = 0; j < N; j++) {
    const base = 120 + j * 13.5;
    const a1 = 10 + j * 1.8, a2 = 5 + (j % 5) * 1.6;
    const k1 = 1 + (j % 3), k2 = 2 + (j % 4), ph = j * 0.42;
    let d = "";
    for (let x = 0; x <= 2 * P; x += 10) {
      const y = base + a1 * Math.sin((2 * Math.PI * k1 * x) / P + ph) + a2 * Math.sin((2 * Math.PI * k2 * x) / P + ph * 1.7);
      d += (x ? " L" : "M") + x + "," + y.toFixed(1);
    }
    const dur = 26 + (j % 6) * 7;
    const op = (0.16 + (j / N) * 0.5).toFixed(2);
    const dir = j % 2 ? "flowB" : "flowA";
    waves.push(`<path d="${d}" fill="none" stroke="url(#wv)" stroke-width="${j % 4 === 0 ? 1.6 : 1}" stroke-opacity="${op}" style="animation: ${dir} ${dur}s linear infinite"/>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="A. Haidar Hafiz — merancang &amp; membangun aplikasi web dan mobile">
<title>A. Haidar Hafiz — merancang &amp; membangun aplikasi web dan mobile</title>
<defs>
  <linearGradient id="wv" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#f2a03d"/><stop offset=".5" stop-color="#ff6b5a"/><stop offset="1" stop-color="#f2a03d"/>
  </linearGradient>
  <linearGradient id="fadeL" x1="0" y1="0" x2="1" y2="0">
    <stop offset=".2" stop-color="#fff" stop-opacity="0"/><stop offset=".62" stop-color="#fff" stop-opacity="1"/>
  </linearGradient>
  <mask id="m"><rect width="${W}" height="${H}" fill="url(#fadeL)"/></mask>
  <radialGradient id="sun" cx=".84" cy=".3" r=".5">
    <stop offset="0" stop-color="#ff6b5a" stop-opacity=".22"/><stop offset="1" stop-color="#ff6b5a" stop-opacity="0"/>
  </radialGradient>
  <filter id="grain" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" stitchTiles="stitch"/>
    <feColorMatrix values="0 0 0 0 1  0 0 0 0 .95  0 0 0 0 .88  0 0 0 .05 0"/>
  </filter>
  <clipPath id="card"><rect width="${W}" height="${H}" rx="20"/></clipPath>
  <clipPath id="reveal"><rect x="0" y="100" width="${W}" height="90"><animate attributeName="width" from="0" to="${W}" dur="1.6s" calcMode="spline" keyTimes="0;1" keySplines=".16 1 .3 1" fill="freeze"/></rect></clipPath>
</defs>
<style>
  text { font-family: ${SANS}; }
  .mono { font-family: ${MONO}; }
  .serif { font-family: ${SERIF}; font-style: italic; }
  .in { animation: rise 1.1s cubic-bezier(.16,1,.3,1) backwards; }
  .pulse { transform-box: fill-box; transform-origin: center; animation: pulse 2.6s cubic-bezier(.16,1,.3,1) infinite; }
  .breathe { animation: breathe 9s ease-in-out infinite alternate; }
  @keyframes rise { from { opacity: 0; transform: translateY(16px); } }
  @keyframes flowA { to { transform: translateX(-${P}px); } }
  @keyframes flowB { from { transform: translateX(-${P}px); } to { transform: translateX(0); } }
  @keyframes pulse { 0% { transform: scale(1); opacity: .7; } 100% { transform: scale(3.2); opacity: 0; } }
  @keyframes breathe { to { opacity: .55; transform: translate(-30px, 14px); } }
  @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
</style>
<g clip-path="url(#card)">
  <rect width="${W}" height="${H}" fill="#0f1115"/>
  <rect width="${W}" height="${H}" fill="url(#sun)" class="breathe"/>
  <g mask="url(#m)">${waves.join("\n  ")}</g>
  <rect width="${W}" height="${H}" filter="url(#grain)"/>

  <g class="in" style="animation-delay:.05s">
    <line x1="72" y1="91" x2="104" y2="91" stroke="#f2a03d" stroke-width="2"/>
    <text x="116" y="96" font-size="13" fill="#d8b98a" class="mono" letter-spacing="4">PAMEKASAN, MADURA</text>
  </g>
  <g clip-path="url(#reveal)">
    <text x="68" y="168" font-size="68" font-weight="800" fill="#f4efe6" letter-spacing="-2">A. Haidar Hafiz</text>
  </g>
  <g class="in" style="animation-delay:.55s">
    <text x="72" y="216" font-size="24" fill="#cfc7b8">Merancang &amp; membangun aplikasi <tspan class="serif" fill="#f2a03d">web</tspan> dan <tspan class="serif" fill="#ff8a6b">mobile</tspan></text>
    <text x="72" y="248" font-size="24" fill="#cfc7b8">— dari tampilan sampai server.</text>
  </g>
  <g class="in" style="animation-delay:.8s">
    <circle cx="80" cy="292" r="5" fill="#7ee0a1" class="pulse"/>
    <circle cx="80" cy="292" r="5" fill="#7ee0a1"/>
    <text x="96" y="297" font-size="15" fill="#e9e2d5">Tersedia untuk kerja &amp; proyek freelance</text>
  </g>
</g>
</svg>`;
}

/* ---------------- Kartu keahlian ---------------- */
const STACK = [
  ["WEB", ["HTML", "CSS", "JavaScript"], ["React", "Bootstrap", "Tailwind CSS", "EJS", "Pug", "SCSS"]],
  ["MOBILE", ["Flutter", "Dart"], ["Firebase Cloud Messaging"]],
  ["BACKEND", ["Node.js", "Express.js"], ["REST API", "JWT", "Multer"]],
  ["DATABASE", ["PostgreSQL", "MySQL"], ["SQLite", "Firebase"]],
  ["INTEGRASI & TOOLS", ["Midtrans", "Google ML Kit"], ["Git & GitHub", "XAMPP", "Vercel", "Netlify"]],
];
function stackCard(t) {
  const W = 990, rowH = 48, top = 80, H = top + (STACK.length - 1) * rowH + 44;
  let k = 0;
  const rows = STACK.map(([label, main, used], r) => {
    const y = top + r * rowH;
    let x = 210;
    const chip = (name, primary) => {
      const w = textW(name, 13, primary) + 30;
      const s = `<g class="rise" style="animation-delay:${180 + k++ * 45}ms">
      <rect x="${x}" y="${y - 22}" width="${w.toFixed(1)}" height="32" rx="16" fill="${primary ? t.accent : t.chip}" fill-opacity="${primary ? 0.14 : 1}" stroke="${primary ? t.accent : t.border}" stroke-opacity="${primary ? 0.55 : 1}"/>
      ${primary ? `<circle cx="${x + 14}" cy="${y - 6}" r="3" fill="${t.accent}"/>` : ""}
      <text x="${(x + (primary ? 23 : 15)).toFixed(1)}" y="${y - 1.5}" font-size="13" font-weight="${primary ? 700 : 400}" fill="${primary ? t.text : t.muted}">${esc(name)}</text></g>`;
      x += w + 10;
      return s;
    };
    return `<text x="28" y="${y - 1}" font-size="11" fill="${t.faint}" class="mono fade">${esc(label)}</text>
    ${main.map((n) => chip(n, true)).join("")}
    <line x1="${x + 2}" y1="${y - 16}" x2="${x + 2}" y2="${y + 4}" stroke="${t.border}"/>${(x += 16, "")}
    ${used.map((n) => chip(n, false)).join("")}
    ${r < STACK.length - 1 ? `<line x1="28" y1="${y + 20}" x2="${W - 28}" y2="${y + 20}" stroke="${t.grid}"/>` : ""}`;
  }).join("");
  const body = `
<text x="28" y="38" font-size="11" fill="${t.muted}" class="mono fade">KEAHLIAN</text>
<g class="fade" font-size="12" fill="${t.muted}">
  <circle cx="${W - 228}" cy="34" r="4" fill="${t.accent}"/><text x="${W - 218}" y="38">utama</text>
  <rect x="${W - 160}" y="28" width="14" height="12" rx="6" fill="${t.chip}" stroke="${t.border}"/><text x="${W - 140}" y="38">pernah dipakai</text>
</g>
${rows}`;
  return frame(W, H, t, "Keahlian: Web, Mobile, Backend, Database, Integrasi & Tools", body, `
  .rise { animation-duration: .8s; }`);
}

fs.writeFileSync("assets/banner.svg", banner());
for (const [mode, t] of Object.entries(THEMES)) fs.writeFileSync(`assets/stack-${mode}.svg`, stackCard(t));
console.log("ok");
