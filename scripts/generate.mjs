// Membuat kartu statistik profil GitHub (SVG, versi gelap & terang) tanpa layanan pihak ketiga.
// Pakai:  GH_TOKEN=xxx node scripts/generate.mjs
// Env:    LOGIN (default haidarhafiz21), OUT (folder hasil, default dist),
//         CARDS=langs untuk menghitung ulang bahasa (butuh token yang bisa membaca repo privat)
import fs from "node:fs";
import path from "node:path";
import { THEMES, esc, frame, settle } from "./theme.mjs";

const LOGIN = process.env.LOGIN || "haidarhafiz21";
const OUT = process.env.OUT || "dist";
const CARDS = (process.env.CARDS || "").split(",").map((s) => s.trim());
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
  // +14 jam supaya hari ini menurut WIB (UTC+7) ikut terhitung sejak 00.00
  const to = new Date(Math.min(Date.UTC(y, 11, 31, 23, 59, 59), now.getTime() + 14 * 3600e3));
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


/* ---------------- Bahasa ----------------
   Bahasa dihitung dari semua repo (termasuk privat), jadi hanya bisa dibuat dengan token pemilik akun.
   Hasilnya disimpan di assets/langs.json dan dibaca ulang oleh GitHub Actions. */
const LANGS_FILE = "assets/langs.json";
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
  return all.map((l) => ({ name: l.name, color: l.color, pct: +((l.size / sum) * 100).toFixed(2) }));
}

/* ---------------- Panel aktivitas ----------------
   Satu panel yang tenang: angka ringkasan, kontribusi per minggu, dan bahasa.
   Tanpa efek cahaya; animasi hanya sekali saat dibuka. */
function overviewCard(t, langs) {
  const W = 990, H = 352;
  const updated = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" }).format(now);

  // Angka ringkasan
  const kpis = [
    [num(total), "Total kontribusi", `sejak ${monthYear(firstDay?.date || days[0].date)}`],
    [num(yearTotal), "12 bulan terakhir", `${num(activeDays)} hari aktif`],
    [`${num(cur)} hari`, "Streak saat ini", cur > 0 ? range(curStart, curEnd) : `terakhir aktif ${fmt(lastActive?.date)}`],
    [`${num(longest)} hari`, "Streak terpanjang", lStart ? range(lStart, lEnd) : "-"],
  ];
  const colW = (W - 56) / 4;
  const kpiSvg = kpis.map(([v, k, sub], j) => {
    const x = 28 + j * colW + (j ? 20 : 0);
    return `${j ? `<line x1="${28 + j * colW}" y1="66" x2="${28 + j * colW}" y2="122" stroke="${t.border}"/>` : ""}
<g class="rise" style="animation-delay:${100 + j * 80}ms">
  <text x="${x}" y="92" font-size="28" font-weight="700" fill="${t.text}" letter-spacing="-.5">${esc(v)}</text>
  <text x="${x}" y="112" font-size="12.5" fill="${t.text}" fill-opacity=".8">${esc(k)}</text>
  <text x="${x}" y="128" font-size="11.5" fill="${t.muted}">${esc(sub)}</text>
</g>`;
  }).join("");

  // Kontribusi per minggu (52 minggu, berakhir hari ini)
  const weeks = [];
  const tail = days.slice(-364);
  for (let k = 0; k < 52; k++) {
    const chunk = tail.slice(k * 7, k * 7 + 7);
    weeks.push({ start: chunk[0]?.date, n: chunk.reduce((s, d) => s + d.n, 0) });
  }
  const cx0 = 28, cx1 = 628, cyTop = 196, cyBase = 300;
  const slot = (cx1 - cx0) / weeks.length, bw = Math.max(3, slot - 3);
  const wmax = Math.max(1, ...weeks.map((w) => w.n));
  const nice = wmax <= 5 ? 5 : wmax <= 10 ? 10 : wmax <= 25 ? 25 : wmax <= 50 ? 50 : Math.ceil(wmax / 50) * 50;
  const yv = (n) => cyBase - (n / nice) * (cyBase - cyTop);
  let lastLabelX = -99;
  const monthTicks = weeks.map((w, k) => {
    if (!w.start) return "";
    const prev = weeks[k - 1]?.start;
    if (k && prev && prev.slice(0, 7) === w.start.slice(0, 7)) return "";
    const x = cx0 + k * slot;
    if (x - lastLabelX < 34) return "";
    lastLabelX = x;
    const label = new Intl.DateTimeFormat("id-ID", { month: "short", timeZone: "UTC" }).format(new Date(w.start + "T00:00:00Z"));
    return `<text x="${x.toFixed(1)}" y="${cyBase + 18}" font-size="10.5" fill="${t.muted}">${esc(label)}</text>`;
  }).join("");
  const bars = weeks.map((w, k) => {
    const x = cx0 + k * slot + (slot - bw) / 2, last = k === weeks.length - 1;
    if (!w.n) return `<rect x="${x.toFixed(1)}" y="${cyBase - 1.5}" width="${bw.toFixed(1)}" height="1.5" fill="${t.border}"/>`;
    const y = yv(w.n);
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${(cyBase - y).toFixed(1)}" rx="1.5" fill="${last ? t.accent : t.text}" fill-opacity="${last ? 1 : 0.72}"/>`;
  }).join("");
  const grid = [0.5, 1].map((f) => `<line x1="${cx0}" y1="${yv(nice * f).toFixed(1)}" x2="${cx1}" y2="${yv(nice * f).toFixed(1)}" stroke="${t.grid}" stroke-dasharray="2 4"/>
<text x="${cx1 + 6}" y="${(yv(nice * f) + 3.5).toFixed(1)}" font-size="10" fill="${t.faint}">${num(nice * f)}</text>`).join("");

  // Bahasa: 6 teratas + lainnya
  const top = langs.slice(0, 6);
  const other = langs.slice(6).reduce((s, l) => s + l.pct, 0);
  const rows = other > 0 ? [...top, { name: "Lainnya", color: t.faint, pct: other }] : top;
  const lx = 676, lbar0 = 770, lbar1 = 920, lmax = Math.max(...rows.map((r) => r.pct));
  const langSvg = rows.map((r, k) => {
    const y = 206 + k * 16.5, w = Math.max(2, (r.pct / lmax) * (lbar1 - lbar0));
    return `<g>
  <rect x="${lx}" y="${y - 7.5}" width="7" height="7" rx="1.5" fill="${r.color}"/>
  <text x="${lx + 14}" y="${y}" font-size="11.5" fill="${t.text}" fill-opacity=".85">${esc(r.name)}</text>
  <rect x="${lbar0}" y="${y - 5}" width="${lbar1 - lbar0}" height="3" rx="1.5" fill="${t.track}"/>
  <rect x="${lbar0}" y="${y - 5}" width="${w.toFixed(1)}" height="3" rx="1.5" fill="${t.text}" fill-opacity=".6"/>
  <text x="${W - 28}" y="${y}" font-size="11" fill="${t.muted}" text-anchor="end">${r.pct.toFixed(1).replace(".", ",")}%</text>
</g>`;
  }).join("");

  const body = `
<text x="28" y="38" font-size="11" fill="${t.muted}" class="mono">AKTIVITAS GITHUB</text>
<text x="${W - 28}" y="38" font-size="11.5" fill="${t.faint}" text-anchor="end">Diperbarui ${esc(updated)}</text>
${kpiSvg}
<line x1="28" y1="152" x2="${W - 28}" y2="152" stroke="${t.border}"/>
<text x="${cx0}" y="180" font-size="12.5" font-weight="600" fill="${t.text}">Kontribusi per minggu</text>
<text x="${cx0 + 152}" y="180" font-size="11.5" fill="${t.muted}">12 bulan terakhir</text>
${grid}
<line x1="${cx0}" y1="${cyBase}" x2="${cx1}" y2="${cyBase}" stroke="${t.border}"/>
<g class="bar" style="animation-delay:250ms">${bars}</g>
${monthTicks}
<line x1="652" y1="168" x2="652" y2="${cyBase + 20}" stroke="${t.border}"/>
<text x="${lx}" y="180" font-size="12.5" font-weight="600" fill="${t.text}">Bahasa</text>
<text x="${lx + 52}" y="180" font-size="11.5" fill="${t.muted}">semua repositori</text>
<g class="rise" style="animation-delay:400ms">${langSvg}</g>`;
  return frame(W, H, t, `Aktivitas GitHub ${LOGIN}: ${total} kontribusi, ${yearTotal} dalam 12 bulan terakhir, streak terpanjang ${longest} hari`, body);
}

/* ---------------- Grafik harian 31 hari ----------------
   Garis tipis satu warna, area sangat tipis, tanpa efek cahaya. */
function trendCard(t) {
  const pts = days.slice(-31);
  const W = 990, H = 290, L = 56, R = W - 32, T = 78, B = H - 50;
  const max = Math.max(4, ...pts.map((p) => p.n));
  const step = Math.ceil(max / 4), top = step * 4;
  const x = (k) => L + (k / (pts.length - 1)) * (R - L);
  const y = (n) => B - (n / top) * (B - T);
  const xy = pts.map((p, k) => [x(k), y(p.n)]);
  let d = "M" + xy[0][0].toFixed(1) + "," + xy[0][1].toFixed(1);
  for (let k = 0; k < xy.length - 1; k++) {
    const p0 = xy[k - 1] || xy[k], p1 = xy[k], p2 = xy[k + 1], p3 = xy[k + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, Math.min(B, p1[1] + (p2[1] - p0[1]) / 6)];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, Math.min(B, p2[1] - (p3[1] - p1[1]) / 6)];
    d += " C" + c1[0].toFixed(1) + "," + c1[1].toFixed(1) + " " + c2[0].toFixed(1) + "," + c2[1].toFixed(1) + " " + p2[0].toFixed(1) + "," + p2[1].toFixed(1);
  }
  const sum = pts.reduce((s, p) => s + p.n, 0);
  const peak = pts.reduce((m, p, k) => (p.n > m.n ? { ...p, k } : m), { n: -1 });
  const grid = [0, 1, 2, 3, 4].map((g) => '<line x1="' + L + '" y1="' + y(g * step) + '" x2="' + R + '" y2="' + y(g * step) + '" stroke="' + (g ? t.grid : t.border) + '"' + (g ? ' stroke-dasharray="2 4"' : "") + '/>' +
    '<text x="' + (L - 12) + '" y="' + (y(g * step) + 4) + '" font-size="10.5" fill="' + t.faint + '" text-anchor="end">' + g * step + '</text>').join("");
  const labels = pts.map((p, k) => (k % 5 === 0 || k === pts.length - 1)
    ? '<text x="' + x(k) + '" y="' + (B + 22) + '" font-size="11" fill="' + t.muted + '" text-anchor="middle">' + esc(fmt(p.date, false)) + '</text>' : "").join("");
  const dots = xy.map(([px, py], k) => pts[k].n > 0
    ? '<circle cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" r="3" fill="' + t.accent + '"/>' : "").join("");
  const peakTxt = peak.n > 0 ? '<text x="' + x(peak.k).toFixed(1) + '" y="' + (y(peak.n) - 12).toFixed(1) + '" font-size="11.5" fill="' + t.muted + '" text-anchor="' + (peak.k > pts.length - 4 ? "end" : "middle") + '" class="fade" style="animation-delay:1.3s"><tspan font-weight="700" fill="' + t.text + '">' + peak.n + '</tspan> · ' + esc(fmt(peak.date, false)) + '</text>' : "";
  const body = '<text x="28" y="38" font-size="11" fill="' + t.muted + '" class="mono">KONTRIBUSI HARIAN · 31 HARI TERAKHIR</text>' +
    '<text x="' + (W - 28) + '" y="38" font-size="12.5" fill="' + t.muted + '" text-anchor="end"><tspan font-weight="700" fill="' + t.text + '">' + num(sum) + '</tspan> kontribusi</text>' +
    grid +
    '<path d="' + d + " L" + R + "," + B + " L" + L + "," + B + ' Z" fill="' + t.accent + '" fill-opacity=".07" class="fade" style="animation-delay:.9s"/>' +
    '<path id="trendline" d="' + d + '" fill="none" stroke="' + t.accent + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="0" style="animation: draw 1.8s .2s cubic-bezier(.65,0,.35,1) backwards"/>' +
    '<g class="fade" style="animation-delay:1s">' + dots + '</g>' + peakTxt + labels +
    '<circle r="4" fill="' + t.bg + '" stroke="' + t.accent + '" stroke-width="2" opacity="0">' +
    '<animate attributeName="opacity" values="0;1" begin="2.2s" dur=".5s" fill="freeze"/>' +
    '<animateMotion dur="12s" begin="2.2s" repeatCount="indefinite" calcMode="spline" keyPoints="0;1;1" keyTimes="0;.4;1" keySplines=".45 0 .55 1;0 0 1 1"><mpath href="#trendline"/></animateMotion></circle>';
  return frame(W, H, t, "Kontribusi harian 31 hari terakhir " + LOGIN + ": " + sum + " kontribusi", body);
}

/* ---------------- Tulis file ---------------- */
fs.mkdirSync(OUT, { recursive: true });
if (CARDS.includes("langs")) fs.writeFileSync(LANGS_FILE, JSON.stringify(await getLangs(), null, 1));
const langs = JSON.parse(fs.readFileSync(LANGS_FILE, "utf8"));
for (const [mode, t] of Object.entries(THEMES)) {
  fs.writeFileSync(path.join(OUT, `overview-${mode}.svg`), settle(overviewCard(t, langs)));
  fs.writeFileSync(path.join(OUT, `trend-${mode}.svg`), settle(trendCard(t)));
}
console.log(JSON.stringify({ total, yearTotal, activeDays, cur, longest, langs: langs.slice(0, 6).map((l) => `${l.name} ${l.pct}%`) }));
