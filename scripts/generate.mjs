// Membuat kartu statistik profil GitHub (SVG, versi gelap & terang) tanpa layanan pihak ketiga.
// Pakai:  GH_TOKEN=xxx node scripts/generate.mjs
// Env:    LOGIN (default haidarhafiz21), OUT (folder hasil, default dist),
//         CARDS (default "stats,streak,activity"; tambahkan "langs" bila token bisa membaca repo privat)
import fs from "node:fs";
import path from "node:path";

const LOGIN = process.env.LOGIN || "haidarhafiz21";
const OUT = process.env.OUT || "dist";
const CARDS = (process.env.CARDS || "stats,streak,activity").split(",").map((s) => s.trim());
const TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
if (!TOKEN) { console.error("GH_TOKEN belum diisi"); process.exit(1); }

async function gql(query, variables) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `bearer ${TOKEN}`, "Content-Type": "application/json", "User-Agent": "profile-cards" },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

/* ---------------- Data ---------------- */
const base = (await gql(`query($login:String!){ user(login:$login){ createdAt followers{totalCount}
  repositories(ownerAffiliations:OWNER, privacy:PUBLIC){totalCount} } }`, { login: LOGIN })).user;

const created = new Date(base.createdAt);
const now = new Date();
const dayMap = new Map();
for (let y = created.getUTCFullYear(); y <= now.getUTCFullYear(); y++) {
  const from = new Date(Math.max(Date.UTC(y, 0, 1), created.getTime()));
  const to = new Date(Math.min(Date.UTC(y, 11, 31, 23, 59, 59), now.getTime()));
  const d = await gql(`query($login:String!,$from:DateTime!,$to:DateTime!){ user(login:$login){
    contributionsCollection(from:$from,to:$to){ contributionCalendar{ weeks{ contributionDays{ date contributionCount } } } } } }`,
    { login: LOGIN, from: from.toISOString(), to: to.toISOString() });
  for (const w of d.user.contributionsCollection.contributionCalendar.weeks)
    for (const c of w.contributionDays) dayMap.set(c.date, c.contributionCount);
}
const days = [...dayMap.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([date, n]) => ({ date, n }));

const total = days.reduce((s, d) => s + d.n, 0);
const firstDay = days.find((d) => d.n > 0);
const last365 = days.slice(-365);
const yearTotal = last365.reduce((s, d) => s + d.n, 0);
const activeDays = last365.filter((d) => d.n > 0).length;
const best = last365.reduce((m, d) => (d.n > m.n ? d : m), { n: 0, date: null });
const thisYear = String(now.getUTCFullYear());
const thisYearTotal = days.filter((d) => d.date.startsWith(thisYear)).reduce((s, d) => s + d.n, 0);

// Streak saat ini (hari ini boleh belum ada kontribusi)
let i = days.length - 1;
if (i >= 0 && days[i].n === 0) i--;
let cur = 0, curEnd = i >= 0 ? days[i].date : null, curStart = curEnd;
while (i >= 0 && days[i].n > 0) { cur++; curStart = days[i].date; i--; }
// Streak terpanjang
let longest = 0, lStart = null, lEnd = null, run = 0, runStart = null;
for (const d of days) {
  if (d.n > 0) { if (!run) runStart = d.date; run++; if (run > longest) { longest = run; lStart = runStart; lEnd = d.date; } }
  else run = 0;
}
const lastActive = [...days].reverse().find((d) => d.n > 0);

/* ---------------- Tampilan ---------------- */
const THEMES = {
  dark: { bg: "#0d1117", border: "#30363d", title: "#2dd4bf", text: "#e6edf3", muted: "#8b949e", accent: "#2dd4bf", fire: "#fb923c", track: "#21262d", grid: "#21262d" },
  light: { bg: "#ffffff", border: "#d0d7de", title: "#0f766e", text: "#1f2328", muted: "#59636e", accent: "#0f766e", fire: "#ea580c", track: "#eaeef2", grid: "#eaeef2" },
};
const FONT = "'Segoe UI', Ubuntu, 'Helvetica Neue', Arial, sans-serif";
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const num = (n) => n.toLocaleString("id-ID");
const fmt = (date, withYear = true) => date ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", ...(withYear ? { year: "numeric" } : {}), timeZone: "UTC" }).format(new Date(date + "T00:00:00Z")) : "-";
const range = (a, b) => (a === b ? fmt(a) : `${fmt(a, a.slice(0, 4) !== b.slice(0, 4))} – ${fmt(b)}`);

function frame(w, h, t, label, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">
<title>${esc(label)}</title>
<style>
  text { font-family: ${FONT}; }
  /* Isi selalu tampil walau animasi tidak berjalan; animasi hanya efek masuk */
  .fade { animation: fade .6s ease-out backwards; }
  .rise { animation: rise .7s cubic-bezier(.2,.8,.2,1) backwards; }
  @keyframes fade { from { opacity: 0; } }
  @keyframes rise { from { opacity: 0; transform: translateY(8px); } }
  @keyframes draw { from { stroke-dashoffset: 1; } }
  @keyframes grow { from { transform: scaleX(0); } }
  @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
</style>
<rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="12" fill="${t.bg}" stroke="${t.border}"/>
${body}
</svg>`;
}

function statsCard(t) {
  const rows = [
    ["Total kontribusi", num(total)],
    ["Kontribusi 12 bulan terakhir", num(yearTotal)],
    ["Hari aktif (12 bulan)", num(activeDays)],
    ["Repositori publik", num(base.repositories.totalCount)],
    ["Followers", num(base.followers.totalCount)],
  ];
  const r = 44;
  const body = `
<text x="28" y="40" font-size="18" font-weight="700" fill="${t.title}" class="fade">Statistik GitHub</text>
${rows.map(([k, v], j) => `<g class="rise" style="animation-delay:${150 + j * 120}ms">
  <circle cx="34" cy="${74 + j * 25}" r="4" fill="${t.accent}"/>
  <text x="48" y="${79 + j * 25}" font-size="14" fill="${t.muted}">${esc(k)}</text>
  <text x="290" y="${79 + j * 25}" font-size="14" font-weight="700" fill="${t.text}" text-anchor="end">${esc(v)}</text>
</g>`).join("")}
<g transform="translate(400 112)">
  <circle r="${r}" fill="none" stroke="${t.track}" stroke-width="7"/>
  <circle r="${r}" fill="none" stroke="${t.accent}" stroke-width="7" stroke-linecap="round" transform="rotate(-90)"
    pathLength="1" stroke-dasharray="1" stroke-dashoffset="0" style="animation: draw 1.4s .3s cubic-bezier(.2,.8,.2,1) backwards"/>
  <text y="8" font-size="26" font-weight="800" fill="${t.text}" text-anchor="middle" class="fade" style="animation-delay:.5s">${esc(num(thisYearTotal))}</text>
  <text y="${r + 26}" font-size="12" fill="${t.muted}" text-anchor="middle" class="fade" style="animation-delay:.7s">kontribusi ${thisYear}</text>
</g>`;
  return frame(495, 195, t, `Statistik GitHub ${LOGIN}`, body);
}

function streakCard(t) {
  const cols = [165, 495, 825];
  const curSub = cur > 0 ? range(curStart, curEnd) : `Terakhir aktif ${fmt(lastActive?.date)}`;
  const r = 42;
  const body = `
<line x1="330" y1="38" x2="330" y2="152" stroke="${t.border}"/>
<line x1="660" y1="38" x2="660" y2="152" stroke="${t.border}"/>
<g class="rise" style="animation-delay:.1s">
  <text x="${cols[0]}" y="84" font-size="32" font-weight="800" fill="${t.text}" text-anchor="middle">${esc(num(total))}</text>
  <text x="${cols[0]}" y="116" font-size="15" fill="${t.text}" text-anchor="middle">Total Kontribusi</text>
  <text x="${cols[0]}" y="140" font-size="12" fill="${t.muted}" text-anchor="middle">${esc(fmt(firstDay?.date))} – Sekarang</text>
</g>
<g transform="translate(${cols[1]} 76)">
  <circle r="${r}" fill="none" stroke="${t.track}" stroke-width="6"/>
  <circle r="${r}" fill="none" stroke="${t.fire}" stroke-width="6" stroke-linecap="round" transform="rotate(-90)"
    pathLength="1" stroke-dasharray="1" stroke-dashoffset="0" style="animation: draw 1.4s .2s cubic-bezier(.2,.8,.2,1) backwards"/>
  <rect x="-13" y="${-r - 13}" width="26" height="26" fill="${t.bg}"/>
  <path transform="translate(0 ${-r}) scale(.9)" fill="${t.fire}" d="M0-12c3 4 8 7 8 13a8 8 0 0 1-16 0c0-3 1.5-5 3-6.5 0 2.5 1.2 4 2.8 4.5C-3-5-1.5-8 0-12z"/>
  <text y="11" font-size="30" font-weight="800" fill="${t.text}" text-anchor="middle" class="fade" style="animation-delay:.4s">${esc(num(cur))}</text>
</g>
<g class="rise" style="animation-delay:.3s">
  <text x="${cols[1]}" y="146" font-size="15" font-weight="700" fill="${t.fire}" text-anchor="middle">Streak Saat Ini</text>
  <text x="${cols[1]}" y="166" font-size="12" fill="${t.muted}" text-anchor="middle">${esc(curSub)}</text>
</g>
<g class="rise" style="animation-delay:.5s">
  <text x="${cols[2]}" y="84" font-size="32" font-weight="800" fill="${t.text}" text-anchor="middle">${esc(num(longest))} <tspan font-size="15" font-weight="600" fill="${t.muted}">hari</tspan></text>
  <text x="${cols[2]}" y="116" font-size="15" fill="${t.text}" text-anchor="middle">Streak Terpanjang</text>
  <text x="${cols[2]}" y="140" font-size="12" fill="${t.muted}" text-anchor="middle">${esc(lStart ? range(lStart, lEnd) : "-")}</text>
</g>`;
  return frame(990, 185, t, `Streak kontribusi ${LOGIN}`, body);
}

function activityCard(t) {
  const pts = days.slice(-31);
  const W = 990, H = 300, L = 62, R = W - 34, T = 70, B = H - 52;
  const max = Math.max(4, ...pts.map((p) => p.n));
  const step = Math.ceil(max / 4);
  const top = step * 4;
  const x = (k) => L + (k / (pts.length - 1)) * (R - L);
  const y = (n) => B - (n / top) * (B - T);
  const xy = pts.map((p, k) => [x(k), y(p.n)]);
  // garis halus (Catmull-Rom -> Bezier)
  let d = `M${xy[0][0].toFixed(1)},${xy[0][1].toFixed(1)}`;
  for (let k = 0; k < xy.length - 1; k++) {
    const p0 = xy[k - 1] || xy[k], p1 = xy[k], p2 = xy[k + 1], p3 = xy[k + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, Math.min(B, p1[1] + (p2[1] - p0[1]) / 6)];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, Math.min(B, p2[1] - (p3[1] - p1[1]) / 6)];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  const area = `${d} L${R},${B} L${L},${B} Z`;
  const sum = pts.reduce((s, p) => s + p.n, 0);
  const grid = [0, 1, 2, 3, 4].map((g) => `<line x1="${L}" y1="${y(g * step)}" x2="${R}" y2="${y(g * step)}" stroke="${t.grid}"/>
  <text x="${L - 12}" y="${y(g * step) + 4}" font-size="11" fill="${t.muted}" text-anchor="end">${g * step}</text>`).join("");
  const labels = pts.map((p, k) => (k % 5 === 0 || k === pts.length - 1)
    ? `<text x="${x(k)}" y="${B + 22}" font-size="11" fill="${t.muted}" text-anchor="middle">${esc(fmt(p.date, false))}</text>` : "").join("");
  const dots = xy.map(([px, py], k) => pts[k].n > 0 ? `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="3.5" fill="${t.bg}" stroke="${t.accent}" stroke-width="2" class="fade" style="animation-delay:${(0.4 + k * 0.03).toFixed(2)}s"/>` : "").join("");
  const body = `
<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.accent}" stop-opacity=".35"/><stop offset="1" stop-color="${t.accent}" stop-opacity="0"/></linearGradient></defs>
<text x="28" y="40" font-size="18" font-weight="700" fill="${t.title}" class="fade">Grafik Kontribusi 31 Hari Terakhir</text>
<text x="${W - 28}" y="40" font-size="13" fill="${t.muted}" text-anchor="end" class="fade">${esc(num(sum))} kontribusi</text>
${grid}
<path d="${area}" fill="url(#g)" class="fade" style="animation-delay:.5s"/>
<path d="${d}" fill="none" stroke="${t.accent}" stroke-width="2.5" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="0" style="animation: draw 1.6s .2s ease-out backwards"/>
${dots}
${labels}`;
  return frame(W, H, t, `Grafik kontribusi ${LOGIN}`, body);
}

async function langsCard(t, langs) {
  const W = 495, H = 195, bx = 28, bw = W - 56;
  let acc = 0;
  const bar = langs.map((l) => { const w = (l.pct / 100) * bw; const s = `<rect x="${(bx + acc).toFixed(1)}" y="56" width="${w.toFixed(1)}" height="10" fill="${l.color}"/>`; acc += w; return s; }).join("");
  const legend = langs.map((l, k) => {
    const cx = k < 4 ? 34 : 262, cy = 96 + (k % 4) * 25;
    return `<g class="rise" style="animation-delay:${200 + k * 90}ms"><circle cx="${cx}" cy="${cy - 4}" r="5" fill="${l.color}"/>
    <text x="${cx + 14}" y="${cy}" font-size="13" fill="${t.text}">${esc(l.name)} <tspan fill="${t.muted}">${l.pct.toFixed(1).replace(".", ",")}%</tspan></text></g>`;
  }).join("");
  const body = `
<defs><clipPath id="bar"><rect x="${bx}" y="56" width="${bw}" height="10" rx="5"/></clipPath></defs>
<text x="28" y="40" font-size="18" font-weight="700" fill="${t.title}" class="fade">Bahasa yang Paling Sering Dipakai</text>
<g clip-path="url(#bar)"><g style="transform-origin:${bx}px 61px; animation: grow 1.1s .1s cubic-bezier(.2,.8,.2,1) both">${bar}</g></g>
${legend}`;
  return frame(W, H, t, `Bahasa pemrograman ${LOGIN}`, body);
}

async function getLangs() {
  // Bahasa bawaan kerangka proyek (folder platform Flutter, skrip build) tidak dihitung
  const SKIP = new Set(["C++", "CMake", "C", "Swift", "Objective-C", "Kotlin", "Java", "Ruby", "Batchfile", "Shell", "PowerShell", "Makefile", "Dockerfile", "Procfile"]);
  const d = await gql(`query($login:String!){ user(login:$login){ repositories(ownerAffiliations:OWNER, isFork:false, first:100){
    nodes{ languages(first:20, orderBy:{field:SIZE,direction:DESC}){ edges{ size node{ name color } } } } } } }`, { login: LOGIN });
  const m = new Map();
  for (const r of d.user.repositories.nodes) for (const e of r.languages.edges) {
    if (SKIP.has(e.node.name)) continue;
    const o = m.get(e.node.name) || { name: e.node.name, color: e.node.color || "#8b949e", size: 0 };
    o.size += e.size; m.set(e.node.name, o);
  }
  const all = [...m.values()].sort((a, b) => b.size - a.size);
  const sum = all.reduce((s, l) => s + l.size, 0);
  return all.slice(0, 8).map((l) => ({ ...l, pct: (l.size / sum) * 100 }));
}

/* ---------------- Tulis file ---------------- */
fs.mkdirSync(OUT, { recursive: true });
const langs = CARDS.includes("langs") ? await getLangs() : null;
for (const [mode, t] of Object.entries(THEMES)) {
  if (CARDS.includes("stats")) fs.writeFileSync(path.join(OUT, `stats-${mode}.svg`), statsCard(t));
  if (CARDS.includes("streak")) fs.writeFileSync(path.join(OUT, `streak-${mode}.svg`), streakCard(t));
  if (CARDS.includes("activity")) fs.writeFileSync(path.join(OUT, `activity-${mode}.svg`), activityCard(t));
  if (langs) fs.writeFileSync(path.join(OUT, `langs-${mode}.svg`), await langsCard(t, langs));
}
console.log(JSON.stringify({ total, yearTotal, thisYearTotal, activeDays, best, cur, curStart, curEnd, longest, lStart, lEnd, first: firstDay?.date, langs: langs?.map((l) => `${l.name} ${l.pct.toFixed(1)}%`) }));
