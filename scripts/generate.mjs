// Membuat kartu statistik profil GitHub (SVG, versi gelap & terang) tanpa layanan pihak ketiga.
// Pakai:  GH_TOKEN=xxx node scripts/generate.mjs
// Env:    LOGIN (default haidarhafiz21), OUT (folder hasil, default dist),
//         CARDS (default "stats,streak,activity"; tambahkan "langs" bila token bisa membaca repo privat)
import fs from "node:fs";
import path from "node:path";
import { THEMES, MONO, esc, frame } from "./theme.mjs";

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
const lastActive = [...days].reverse().find((d) => d.n > 0);

// 12 bulan terakhir
const months = [];
for (let k = 11; k >= 0; k--) {
  const dt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - k, 1));
  const key = dt.toISOString().slice(0, 7);
  months.push({ key, dt, n: days.filter((d) => d.date.startsWith(key)).reduce((s, d) => s + d.n, 0) });
}

// Streak saat ini (hari ini boleh belum ada kontribusi) & terpanjang
let i = days.length - 1;
if (i >= 0 && days[i].n === 0) i--;
let cur = 0, curEnd = i >= 0 ? days[i].date : null, curStart = curEnd;
while (i >= 0 && days[i].n > 0) { cur++; curStart = days[i].date; i--; }
let longest = 0, lStart = null, lEnd = null, run = 0, runStart = null;
for (const d of days) {
  if (d.n > 0) { if (!run) runStart = d.date; run++; if (run > longest) { longest = run; lStart = runStart; lEnd = d.date; } }
  else run = 0;
}

/* ---------------- Format ---------------- */
const num = (n) => n.toLocaleString("id-ID");
const fmt = (date, withYear = true) => date ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", ...(withYear ? { year: "numeric" } : {}), timeZone: "UTC" }).format(new Date(date + "T00:00:00Z")) : "-";
const range = (a, b) => (a === b ? fmt(a) : `${fmt(a, a.slice(0, 4) !== b.slice(0, 4))} – ${fmt(b)}`);
const monthLetter = (dt) => new Intl.DateTimeFormat("id-ID", { month: "short", timeZone: "UTC" }).format(dt).slice(0, 1).toUpperCase();
const monthYear = (date) => new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(date + "T00:00:00Z"));

/* ---------------- Kartu: ringkasan ---------------- */
function statsCard(t) {
  const W = 495, H = 210;
  const bx = 262, bw = 205, by = 116, bh = 64;
  const mx = Math.max(1, ...months.map((m) => m.n));
  const slot = bw / months.length;
  const bars = months.map((m, k) => {
    const h = Math.max(3, (m.n / mx) * bh);
    const last = k === months.length - 1;
    return `<rect class="bar" style="animation-delay:${300 + k * 55}ms" x="${(bx + k * slot + 2.5).toFixed(1)}" y="${(by - h).toFixed(1)}" width="${(slot - 5).toFixed(1)}" height="${h.toFixed(1)}" rx="3" fill="${last ? t.accent2 : m.n ? t.accent : t.track}"/>
  <text x="${(bx + k * slot + slot / 2).toFixed(1)}" y="${by + 18}" font-size="10" fill="${last ? t.text : t.faint}" text-anchor="middle" class="mono" style="letter-spacing:0">${monthLetter(m.dt)}</text>`;
  }).join("");
  const minis = [
    [num(activeDays), "hari aktif / 12 bln"],
    [num(base.repositories.totalCount), "repo publik"],
    [num(base.followers.totalCount), "followers"],
  ].map(([v, k], j) => `<g class="rise" style="animation-delay:${500 + j * 110}ms">
    <text x="${28 + j * 152}" y="178" font-size="20" font-weight="700" fill="${t.text}">${esc(v)}</text>
    <text x="${28 + j * 152}" y="196" font-size="11.5" fill="${t.muted}">${esc(k)}</text></g>`).join("");
  const body = `
<text x="28" y="38" font-size="11" fill="${t.muted}" class="mono fade">KONTRIBUSI</text>
<g class="rise" style="animation-delay:80ms">
  <text x="26" y="92" font-size="50" font-weight="800" fill="${t.text}" letter-spacing="-1.5">${esc(num(total))}</text>
  <text x="28" y="116" font-size="13" fill="${t.muted}">sejak <tspan class="serif" fill="${t.accent}">${esc(monthYear(firstDay?.date || days[0].date))}</tspan></text>
</g>
<text x="${bx}" y="38" font-size="11" fill="${t.muted}" class="mono fade">12 BULAN</text>
<text x="${bx + bw}" y="38" font-size="11" fill="${t.muted}" text-anchor="end" class="fade">${esc(num(yearTotal))} kontribusi</text>
${bars}
<line x1="28" y1="146" x2="${W - 28}" y2="146" stroke="${t.border}" stroke-dasharray="2 4"/>
${minis}`;
  return frame(W, H, t, `Ringkasan kontribusi ${LOGIN}`, body);
}

/* ---------------- Kartu: bahasa ---------------- */
function langsCard(t, langs) {
  const W = 495, H = 210, bx = 28, bw = W - 56, gap = 3;
  let acc = 0;
  const segs = langs.map((l, k) => {
    const w = Math.max(2, (l.pct / 100) * (bw - gap * (langs.length - 1)));
    const s = `<rect class="seg" style="animation-delay:${200 + k * 90}ms" x="${(bx + acc).toFixed(1)}" y="62" width="${w.toFixed(1)}" height="12" rx="3" fill="${l.color}"/>`;
    acc += w + gap;
    return s;
  }).join("");
  const legend = langs.map((l, k) => {
    const cx = k < 4 ? 28 : 262, cy = 112 + (k % 4) * 24;
    return `<g class="rise" style="animation-delay:${450 + k * 70}ms">
    <rect x="${cx}" y="${cy - 9}" width="10" height="10" rx="2.5" fill="${l.color}"/>
    <text x="${cx + 18}" y="${cy}" font-size="13" fill="${t.text}">${esc(l.name)}</text>
    <text x="${cx + 205}" y="${cy}" font-size="12" fill="${t.muted}" text-anchor="end" class="mono" style="letter-spacing:0">${l.pct.toFixed(1).replace(".", ",")}%</text></g>`;
  }).join("");
  const body = `
<text x="28" y="38" font-size="11" fill="${t.muted}" class="mono fade">BAHASA YANG SERING DIPAKAI</text>
${segs}
${legend}`;
  return frame(W, H, t, `Bahasa pemrograman ${LOGIN}`, body);
}

/* ---------------- Kartu: streak ---------------- */
function streakCard(t) {
  const W = 990, H = 236, cols = [170, 495, 820];
  const curSub = cur > 0 ? range(curStart, curEnd) : `terakhir aktif ${fmt(lastActive?.date)}`;
  const r = 44;
  // jejak 60 hari terakhir di bagian bawah
  const recent = days.slice(-60), mx = Math.max(1, ...recent.map((d) => d.n));
  const cw = (W - 56 - 59 * 4) / 60;
  const cells = recent.map((d, k) => {
    const a = d.n ? 0.35 + 0.65 * (d.n / mx) : 1;
    return `<rect class="fade" style="animation-delay:${600 + k * 12}ms" x="${(28 + k * (cw + 4)).toFixed(1)}" y="208" width="${cw.toFixed(1)}" height="10" rx="2" fill="${d.n ? t.accent : t.track}" fill-opacity="${a.toFixed(2)}"/>`;
  }).join("");
  const body = `
<text x="28" y="38" font-size="11" fill="${t.muted}" class="mono fade">KONSISTENSI</text>
<text x="${W - 28}" y="38" font-size="11" fill="${t.muted}" class="mono fade" text-anchor="end">60 HARI TERAKHIR ↓</text>
<line x1="330" y1="56" x2="330" y2="160" stroke="${t.border}" stroke-dasharray="2 4"/>
<line x1="660" y1="56" x2="660" y2="160" stroke="${t.border}" stroke-dasharray="2 4"/>
<g class="rise" style="animation-delay:.1s">
  <text x="${cols[0]}" y="108" font-size="40" font-weight="800" fill="${t.text}" text-anchor="middle" letter-spacing="-1">${esc(num(total))}</text>
  <text x="${cols[0]}" y="134" font-size="14" fill="${t.text}" text-anchor="middle">Total kontribusi</text>
  <text x="${cols[0]}" y="154" font-size="12" fill="${t.muted}" text-anchor="middle">${esc(fmt(firstDay?.date))} – sekarang</text>
</g>
<g transform="translate(${cols[1]} 100)">
  <circle r="${r}" fill="none" stroke="${t.track}" stroke-width="5"/>
  <circle r="${r}" fill="none" stroke="${t.accent2}" stroke-width="5" stroke-linecap="round" transform="rotate(-90)"
    pathLength="1" stroke-dasharray="1" stroke-dashoffset="0" style="animation: draw 1.6s .2s cubic-bezier(.16,1,.3,1) backwards"/>
  <rect x="-14" y="${-r - 16}" width="28" height="30" fill="${t.bg}"/>
  <g transform="translate(0 ${-r - 2})"><path class="flame" fill="${t.accent2}" d="M0-13c3.5 4.5 9 7.5 9 14a9 9 0 0 1-18 0c0-3.4 1.6-5.6 3.3-7.2 0 2.8 1.4 4.5 3.1 5C-3-5.5-1.6-9 0-13z"/>
    <path class="flame2" fill="${t.accent}" d="M0-3c1.8 2.2 4 3.6 4 6.5a4 4 0 0 1-8 0C-4 1.2-2 0 0-3z"/></g>
  <text y="12" font-size="34" font-weight="800" fill="${t.text}" text-anchor="middle" class="fade" style="animation-delay:.4s">${esc(num(cur))}</text>
</g>
<g class="rise" style="animation-delay:.3s">
  <text x="${cols[1]}" y="168" font-size="14" font-weight="700" fill="${t.accent2}" text-anchor="middle">Streak saat ini</text>
  <text x="${cols[1]}" y="186" font-size="12" fill="${t.muted}" text-anchor="middle">${esc(curSub)}</text>
</g>
<g class="rise" style="animation-delay:.45s">
  <text x="${cols[2]}" y="108" font-size="40" font-weight="800" fill="${t.text}" text-anchor="middle" letter-spacing="-1">${esc(num(longest))}<tspan dx="8" font-size="15" font-weight="500" fill="${t.muted}" letter-spacing="0">hari</tspan></text>
  <text x="${cols[2]}" y="134" font-size="14" fill="${t.text}" text-anchor="middle">Streak terpanjang</text>
  <text x="${cols[2]}" y="154" font-size="12" fill="${t.muted}" text-anchor="middle">${esc(lStart ? range(lStart, lEnd) : "-")}</text>
</g>
${cells}`;
  const css = `
  .flame { transform-box: fill-box; transform-origin: 50% 100%; animation: flick 1.8s ease-in-out infinite alternate; }
  .flame2 { transform-box: fill-box; transform-origin: 50% 100%; animation: flick 1.1s ease-in-out infinite alternate-reverse; }
  @keyframes flick { 0% { transform: scale(1, 1) skewX(0deg); } 40% { transform: scale(.94, 1.07) skewX(2deg); } 100% { transform: scale(1.04, .95) skewX(-2.5deg); } }`;
  return frame(W, H, t, `Streak kontribusi ${LOGIN}: ${cur} hari (${curSub})`, body, css);
}

/* ---------------- Kartu: grafik aktivitas ---------------- */
function activityCard(t) {
  const pts = days.slice(-31);
  const W = 990, H = 320, L = 60, R = W - 34, T = 104, B = H - 52;
  const max = Math.max(4, ...pts.map((p) => p.n));
  const step = Math.ceil(max / 4), top = step * 4;
  const x = (k) => L + (k / (pts.length - 1)) * (R - L);
  const y = (n) => B - (n / top) * (B - T);
  const xy = pts.map((p, k) => [x(k), y(p.n)]);
  let d = `M${xy[0][0].toFixed(1)},${xy[0][1].toFixed(1)}`;
  for (let k = 0; k < xy.length - 1; k++) {
    const p0 = xy[k - 1] || xy[k], p1 = xy[k], p2 = xy[k + 1], p3 = xy[k + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, Math.min(B, p1[1] + (p2[1] - p0[1]) / 6)];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, Math.min(B, p2[1] - (p3[1] - p1[1]) / 6)];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  const sum = pts.reduce((s, p) => s + p.n, 0);
  const peak = pts.reduce((m, p, k) => (p.n > m.n ? { ...p, k } : m), { n: -1 });
  const grid = [0, 1, 2, 3, 4].map((g) => `<line x1="${L}" y1="${y(g * step)}" x2="${R}" y2="${y(g * step)}" stroke="${t.grid}" ${g ? 'stroke-dasharray="2 5"' : ""}/>
  <text x="${L - 14}" y="${y(g * step) + 4}" font-size="10.5" fill="${t.faint}" text-anchor="end" class="mono" style="letter-spacing:0">${g * step}</text>`).join("");
  const labels = pts.map((p, k) => (k % 5 === 0 || k === pts.length - 1)
    ? `<text x="${x(k)}" y="${B + 24}" font-size="11" fill="${t.muted}" text-anchor="middle">${esc(fmt(p.date, false))}</text>` : "").join("");
  const dots = xy.map(([px, py], k) => pts[k].n > 0
    ? `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="3.5" fill="${t.bg}" stroke="${t.accent}" stroke-width="2" class="fade" style="animation-delay:${(0.9 + k * 0.025).toFixed(2)}s"/>` : "").join("");
  const peakTag = peak.n > 0 ? `<g class="rise" style="animation-delay:1.3s">
    <rect x="${(x(peak.k) - 34).toFixed(1)}" y="${(y(peak.n) - 38).toFixed(1)}" width="68" height="24" rx="12" fill="${t.text}"/>
    <text x="${x(peak.k).toFixed(1)}" y="${(y(peak.n) - 21.5).toFixed(1)}" font-size="12" font-weight="700" fill="${t.bg}" text-anchor="middle">${peak.n} • ${esc(fmt(peak.date, false))}</text></g>` : "";
  const body = `
<defs>
  <linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.accent}" stop-opacity=".32"/><stop offset="1" stop-color="${t.accent}" stop-opacity="0"/></linearGradient>
  <linearGradient id="stroke" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${t.accent}"/><stop offset="1" stop-color="${t.accent2}"/></linearGradient>
  <radialGradient id="glow"><stop offset="0" stop-color="${t.accent2}" stop-opacity=".9"/><stop offset="1" stop-color="${t.accent2}" stop-opacity="0"/></radialGradient>
</defs>
<text x="28" y="38" font-size="11" fill="${t.muted}" class="mono fade">AKTIVITAS · 31 HARI TERAKHIR</text>
<text x="${W - 28}" y="38" font-size="13" fill="${t.muted}" text-anchor="end" class="fade"><tspan font-weight="700" fill="${t.text}">${esc(num(sum))}</tspan> kontribusi</text>
${grid}
<path d="${d} L${R},${B} L${L},${B} Z" fill="url(#area)" class="fade" style="animation-delay:.7s; animation-duration:1.4s"/>
<path id="line" d="${d}" fill="none" stroke="url(#stroke)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"
  pathLength="1" stroke-dasharray="1" stroke-dashoffset="0" style="animation: draw 2s .2s cubic-bezier(.65,0,.35,1) backwards"/>
${dots}
<g opacity="0">
  <animate attributeName="opacity" values="0;1" begin="2.2s" dur=".6s" fill="freeze"/>
  <circle r="12" fill="url(#glow)"><animateMotion dur="7s" begin="2.2s" repeatCount="indefinite" calcMode="spline" keyPoints="0;1" keyTimes="0;1" keySplines=".45 0 .55 1"><mpath href="#line"/></animateMotion></circle>
  <circle r="3" fill="${t.bg}" stroke="${t.accent2}" stroke-width="2"><animateMotion dur="7s" begin="2.2s" repeatCount="indefinite" calcMode="spline" keyPoints="0;1" keyTimes="0;1" keySplines=".45 0 .55 1"><mpath href="#line"/></animateMotion></circle>
</g>
${peakTag}
${labels}`;
  return frame(W, H, t, `Grafik kontribusi 31 hari terakhir ${LOGIN}`, body);
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
  if (langs) fs.writeFileSync(path.join(OUT, `langs-${mode}.svg`), langsCard(t, langs));
}
console.log(JSON.stringify({ total, yearTotal, activeDays, cur, curStart, curEnd, longest, months: months.map((m) => m.n), langs: langs?.map((l) => `${l.name} ${l.pct.toFixed(1)}%`) }));
