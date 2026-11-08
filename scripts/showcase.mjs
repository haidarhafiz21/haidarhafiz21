// Kartu proyek pilihan, linimasa perjalanan, dan penutup profil. Pakai: node scripts/showcase.mjs
import fs from "node:fs";
import { THEMES, SANS, SERIF, MONO, esc, textW, wrap, frame } from "./theme.mjs";

fs.mkdirSync("assets", { recursive: true });
const UP = "#3fb27f";

/* =========================================================
   Ilustrasi (digambar di kotak 16,16 – 479,134)
   ========================================================= */
const ART = {
  browser(t) {
    const x = 97, y = 24, w = 300, h = 104;
    const tiles = [0, 1, 2, 3].map((i) => `<g class="pop" style="animation-delay:${0.5 + i * 0.12}s">
      <rect x="${x + 14 + i * 70}" y="${y + 76}" width="62" height="20" rx="4" fill="${t.track}"/>
      <rect x="${x + 14 + i * 70}" y="${y + 76}" width="62" height="5" rx="2" fill="${[t.accent, UP, t.accent2, t.accent][i]}" fill-opacity=".7"/></g>`).join("");
    const bars = [16, 26, 20, 32, 24, 36].map((bh, i) => `<rect class="grow" style="animation-delay:${0.4 + i * 0.08}s" x="${x + 192 + i * 15}" y="${y + 64 - bh}" width="9" height="${bh}" rx="2" fill="${t.accent}" fill-opacity=".75"/>`).join("");
    return `
<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${t.bg}" stroke="${t.border}"/>
<line x1="${x}" y1="${y + 18}" x2="${x + w}" y2="${y + 18}" stroke="${t.border}"/>
${[0, 1, 2].map((i) => `<circle cx="${x + 12 + i * 9}" cy="${y + 9}" r="2.6" fill="${t.faint}"/>`).join("")}
<rect x="${x + 48}" y="${y + 4}" width="160" height="10" rx="5" fill="${t.track}"/>
<rect x="${x + 14}" y="${y + 28}" width="122" height="8" rx="4" fill="${t.text}" fill-opacity=".8"/>
<rect x="${x + 14}" y="${y + 41}" width="92" height="6" rx="3" fill="${t.muted}" fill-opacity=".5"/>
<rect x="${x + 14}" y="${y + 53}" width="48" height="13" rx="6.5" fill="${t.accent}"/>
<rect x="${x + 182}" y="${y + 24}" width="104" height="44" rx="6" fill="${t.accent}" fill-opacity=".12"/>
${bars}
${tiles}
<g transform="translate(136 84)"><g class="cursor"><path d="M0 0 L0 15 L4 11 L7 18 L10 16.6 L7 10 L12.5 10 Z" fill="${t.text}" stroke="${t.bg}" stroke-width="1.2"/></g></g>`;
  },
  phone(t) {
    const px = 140, py = 22, pw = 64, ph = 108;
    // pola QR (deterministik) 9x9 dengan 3 penanda sudut
    const N = 9, cs = 5, qx = px + 9.5, qy = py + 28;
    let qr = "";
    const finder = (r, c) => (r < 3 && c < 3) || (r < 3 && c > N - 4) || (r > N - 4 && c < 3);
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const on = finder(r, c) ? !(r % (N - 3) === 1 && c % (N - 3) === 1) || (r === 1 && c === 1) : ((r * 7 + c * 13 + r * c) % 5) < 2;
      if (on) qr += `<rect x="${qx + c * cs}" y="${qy + r * cs}" width="${cs - 0.6}" height="${cs - 0.6}" fill="${t.text}" fill-opacity=".85"/>`;
    }
    const bars = [2, 1, 3, 1, 1, 2, 3, 1, 2, 1, 1, 3, 1, 2].map((bw, i, a) => {
      const bx = 302 + a.slice(0, i).reduce((s, v) => s + v + 1.6, 0);
      return `<rect x="${bx.toFixed(1)}" y="100" width="${bw}" height="16" fill="${t.text}" fill-opacity=".8"/>`;
    }).join("");
    return `
<rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="11" fill="${t.bg}" stroke="${t.text}" stroke-opacity=".45" stroke-width="1.5"/>
<rect x="${px + 24}" y="${py + 6}" width="16" height="4" rx="2" fill="${t.text}" fill-opacity=".35"/>
<rect x="${px + 7}" y="${py + 16}" width="50" height="6" rx="3" fill="${t.accent}" fill-opacity=".6"/>
<g class="fade" style="animation-delay:.4s">${qr}</g>
<rect x="${px + 7}" y="${py + 82}" width="50" height="14" rx="7" fill="${t.accent}"/>
<g class="scan"><rect x="${px + 5}" y="${qy - 2}" width="${pw - 10}" height="2" fill="${t.accent2}"/></g>
<line x1="${px + pw + 14}" y1="76" x2="285" y2="76" stroke="${t.muted}" stroke-width="1.5" stroke-dasharray="4 5" class="flow"/>
<path d="M281 71 L288 76 L281 81" fill="none" stroke="${t.muted}" stroke-width="1.5"/>
<g class="pop" style="animation-delay:.3s">
  <rect x="296" y="36" width="78" height="88" rx="5" fill="${t.accent}" fill-opacity=".14" stroke="${t.accent}" stroke-opacity=".6"/>
  <rect x="296" y="36" width="9" height="88" rx="3" fill="${t.accent}" fill-opacity=".45"/>
  <rect x="314" y="50" width="48" height="6" rx="3" fill="${t.text}" fill-opacity=".7"/>
  <rect x="314" y="62" width="36" height="5" rx="2.5" fill="${t.muted}" fill-opacity=".6"/>
  ${bars}
</g>
<g class="pop" style="animation-delay:1.1s"><circle cx="388" cy="44" r="9" fill="${UP}"/><path d="M383.5 44 l3 3 l5.5 -6" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></g>`;
  },
  chart(t) {
    let seed = 7, v = 70;
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    const candles = [];
    for (let i = 0; i < 17; i++) {
      const o = v, c = v + (rnd() - 0.38) * 24;
      const hi = Math.max(o, c) + 3 + rnd() * 7, lo = Math.min(o, c) - 3 - rnd() * 7;
      candles.push({ o, c, hi, lo }); v = c;
    }
    // skala harga -> tinggi kotak (harga tinggi = posisi atas)
    const vmin = Math.min(...candles.map((k) => k.lo)), vmax = Math.max(...candles.map((k) => k.hi));
    const Y = (val) => 124 - ((val - vmin) / (vmax - vmin)) * 92;
    const cx = (i) => 58 + i * 23.5;
    const body = candles.map((k, i) => {
      const up = k.c >= k.o, col = up ? UP : t.accent2;
      const top = Y(Math.max(k.o, k.c)), bot = Y(Math.min(k.o, k.c));
      return `<g class="grow" style="animation-delay:${0.25 + i * 0.07}s">
        <line x1="${cx(i)}" y1="${Y(k.lo).toFixed(1)}" x2="${cx(i)}" y2="${Y(k.hi).toFixed(1)}" stroke="${col}" stroke-width="1.4"/>
        <rect x="${cx(i) - 5}" y="${top.toFixed(1)}" width="10" height="${Math.max(2, bot - top).toFixed(1)}" rx="1.5" fill="${col}"/></g>`;
    }).join("");
    const line = candles.map((k, i) => `${i ? "L" : "M"}${cx(i)},${Y(k.c).toFixed(1)}`).join(" ");
    const last = candles[candles.length - 1];
    return `
${[40, 70, 100].map((gy) => `<line x1="40" y1="${gy}" x2="455" y2="${gy}" stroke="${t.border}" stroke-dasharray="2 5"/>`).join("")}
${body}
<path d="${line}" fill="none" stroke="${t.accent}" stroke-width="1.6" stroke-opacity=".8" pathLength="1" stroke-dasharray="1" stroke-dashoffset="0" class="draw"/>
<line x1="40" y1="${Y(last.c).toFixed(1)}" x2="455" y2="${Y(last.c).toFixed(1)}" stroke="${t.accent}" stroke-dasharray="3 4" stroke-opacity=".6"/>
<circle cx="${cx(16)}" cy="${Y(last.c).toFixed(1)}" r="3.5" fill="${t.accent}"/>`;
  },
  news(t) {
    const blocks = [56, 90, 40, 74, 62, 96, 48, 80];
    let acc = 0;
    const ticker = blocks.concat(blocks).map((w) => { const s = `<rect x="${(acc).toFixed(0)}" y="0" width="${w}" height="4" rx="2" fill="${t.text}" fill-opacity=".45"/>`; acc += w + 18; return s; }).join("");
    const half = acc / 2;
    return `
<rect x="70" y="26" width="124" height="10" rx="2" fill="${t.text}" fill-opacity=".85"/>
<rect x="352" y="29" width="72" height="5" rx="2.5" fill="${t.muted}" fill-opacity=".5"/>
<line x1="70" y1="44" x2="424" y2="44" stroke="${t.text}" stroke-opacity=".5"/>
<g class="pop" style="animation-delay:.3s">
  <rect x="70" y="52" width="148" height="54" rx="4" fill="${t.accent}" fill-opacity=".16"/>
  <path d="M78 100 L110 74 L130 90 L150 72 L210 100 Z" fill="${t.accent}" fill-opacity=".45"/>
  <circle cx="196" cy="66" r="6" fill="${t.accent2}" fill-opacity=".7"/>
</g>
${[[230, 54, 194, 8, ".75"], [230, 68, 164, 6, ".45"], [230, 79, 182, 6, ".45"], [230, 90, 140, 6, ".45"], [230, 101, 170, 6, ".45"]].map(([lx, ly, lw, lh, op], i) => `<rect class="grow-x" style="animation-delay:${0.45 + i * 0.1}s" x="${lx}" y="${ly}" width="${lw}" height="${lh}" rx="${lh / 2}" fill="${i ? t.muted : t.text}" fill-opacity="${op}"/>`).join("")}
<rect x="70" y="114" width="354" height="14" rx="3" fill="${t.accent2}" fill-opacity=".14"/>
<rect x="70" y="114" width="54" height="14" rx="3" fill="${t.accent2}"/>
<text x="97" y="124" font-size="8" font-weight="700" fill="#fff" text-anchor="middle" font-family="${MONO}" letter-spacing="1">TERKINI</text>
<svg x="130" y="119" width="290" height="5" overflow="hidden"><style>@keyframes tickN { to { transform: translateX(-${half.toFixed(0)}px); } } .ticker { animation: tickN 14s linear infinite; }</style><g class="ticker">${ticker}</g></svg>`;
  },
};

const ART_CSS = `
  .pop { transform-box: fill-box; transform-origin: center; animation: pop .7s cubic-bezier(.34,1.56,.64,1) backwards; }
  .grow { transform-box: fill-box; transform-origin: 50% 100%; animation: growY .8s cubic-bezier(.16,1,.3,1) backwards; }
  .grow-x { transform-box: fill-box; transform-origin: 0 50%; animation: growX .9s cubic-bezier(.16,1,.3,1) backwards; }
  .draw { animation: draw 1.8s .6s cubic-bezier(.65,0,.35,1) backwards; }
  .cursor { animation: cursor 6s 1s cubic-bezier(.65,0,.35,1) infinite backwards; }
  .ripple { transform-box: fill-box; transform-origin: center; opacity: 0; animation: ripple 6s 1s ease-out infinite; }
  .scan { animation: scan 2.4s ease-in-out infinite alternate; }
  .flow { animation: flow 1.2s linear infinite; }
  .ping { transform-box: fill-box; transform-origin: center; animation: ping 2.2s ease-out infinite; }
  @keyframes pop { from { opacity: 0; transform: scale(.6); } }
  @keyframes growY { from { transform: scaleY(0); } }
  @keyframes growX { from { transform: scaleX(0); } }
  @keyframes cursor {
    0%, 100% { transform: translate(218px, 30px); }
    38%, 52% { transform: translate(0, 0); }
  }
  @keyframes ripple { 0%, 40% { opacity: 0; transform: scale(.6); } 44% { opacity: .9; } 60%, 100% { opacity: 0; transform: scale(2.4); } }
  @keyframes scan { from { transform: translateY(0); } to { transform: translateY(46px); } }
  @keyframes flow { to { stroke-dashoffset: -18; } }
  @keyframes ping { from { opacity: .9; transform: scale(1); } to { opacity: 0; transform: scale(3.4); } }
`;

/* =========================================================
   Kartu proyek
   ========================================================= */
export const PROJECTS = [
  { file: "venus", tag: "LIVE", live: true, year: "2026", title: "Venus Digital", art: "browser", link: true,
    desc: "Toko online template Excel & produk digital: katalog, halaman produk, artikel panduan, SEO, dan pemesanan via WhatsApp.",
    chips: ["HTML", "CSS", "JavaScript", "Node.js"] },
  { file: "perpus", tag: "PROYEK AKHIR D3", year: "2026", title: "Peminjaman Buku Perpustakaan", art: "phone",
    desc: "Aplikasi mobile untuk Kejaksaan Negeri Sumenep: kartu anggota ber-QR, scan barcode buku, dan dashboard admin.",
    chips: ["Flutter", "Express.js", "PostgreSQL", "ML Kit"] },
  { file: "jurnal", tag: "DESKTOP & HP", year: "2026", title: "Jurnal Trading", art: "chart", link: true,
    desc: "Jurnal trading offline yang tersedia dalam versi desktop dan versi HP.",
    chips: ["Node.js", "SQLite"] },
  { file: "jatim", tag: "MAGANG", year: "2025", title: "JatimTIMES", art: "news",
    desc: "Website portal berita yang dikerjakan saat magang di Jatim Times Network, Malang.",
    chips: ["React", "Vite", "Express.js", "Bootstrap"] },
];

function projectCard(p, t) {
  const W = 495, H = 286;
  const lines = wrap(p.desc, 12.5, W - 48).slice(0, 2);
  let cx = 24;
  const chips = p.chips.map((c, i) => {
    const w = textW(c, 11.5) + 20;
    const s = `<g class="rise" style="animation-delay:${0.55 + i * 0.06}s"><rect x="${cx}" y="246" width="${w.toFixed(1)}" height="22" rx="11" fill="${t.chip}" stroke="${t.border}"/>
    <text x="${(cx + 10).toFixed(1)}" y="261" font-size="11.5" fill="${t.muted}">${esc(c)}</text></g>`;
    cx += w + 6;
    return s;
  }).join("");
  const body = `
<defs><clipPath id="art"><rect x="16" y="16" width="${W - 32}" height="122" rx="10"/></clipPath></defs>
<rect x="16" y="16" width="${W - 32}" height="122" rx="10" fill="${t.chip}"/>
<g clip-path="url(#art)">${ART[p.art](t)}</g>
<g class="rise" style="animation-delay:.15s">
  ${p.live ? `<circle cx="28" cy="162" r="3.5" fill="${UP}"/>` : ""}
  <text x="${p.live ? 38 : 24}" y="166" font-size="10.5" fill="${p.live ? UP : t.accent}" class="mono">${esc(p.tag)}<tspan fill="${t.faint}"> · ${esc(p.year)}</tspan></text>
  ${p.link ? `<text x="${W - 24}" y="168" font-size="16" fill="${t.muted}" text-anchor="end">↗</text>` : `<text x="${W - 24}" y="166" font-size="10.5" fill="${t.faint}" text-anchor="end" class="mono">PRIVAT</text>`}
</g>
<g class="rise" style="animation-delay:.25s"><text x="24" y="192" font-size="19" font-weight="800" fill="${t.text}" letter-spacing="-.3">${esc(p.title)}</text></g>
<g class="rise" style="animation-delay:.35s">${lines.map((l, i) => `<text x="24" y="${213 + i * 17}" font-size="12.5" fill="${t.muted}">${esc(l)}</text>`).join("")}</g>
${chips}`;
  return frame(W, H, t, `${p.title} — ${p.desc}`, body, ART_CSS);
}

/* =========================================================
   Linimasa perjalanan
   ========================================================= */
const JOURNEY = [
  ["2023", "Proyek web pertama", "Website profil UTS dan Bisahosting (proyek kelompok) dengan HTML, Pug, dan SCSS."],
  ["2024", "Mulai ke backend", "Aplikasi CRUD data mahasiswa dengan Express.js, EJS, dan MySQL."],
  ["2025", "Magang & proyek tim", "Magang di Jatim Times Network, platform tryout LuLuSin bersama tim, dan aplikasi pemesanan ikan dengan Midtrans."],
  ["2026", "Lulus & rilis produk", "D3 Teknik Informatika PENS PSDKU Sumenep, IPK 3.46. Juara 2 Final Project Competition. Merilis Venus Digital."],
];
function timeline(t) {
  const W = 990, axisY = 96, colW = 236, x0 = 28;
  const nodes = JOURNEY.map(([year, title, detail], i) => {
    const x = x0 + i * (colW + 8), d = 0.5 + i * 0.32, last = i === JOURNEY.length - 1;
    const lines = wrap(detail, 12.5, colW - 16);
    return `
<g class="rise" style="animation-delay:${d}s"><text x="${x}" y="${axisY - 20}" font-size="30" font-weight="700" fill="${last ? t.accent2 : t.accent}" class="serif">${year}</text></g>
<circle cx="${x + 6}" cy="${axisY}" r="6" fill="${t.bg}" stroke="${last ? t.accent2 : t.accent}" stroke-width="2.5" class="pop" style="animation-delay:${d}s"/>
<g class="rise" style="animation-delay:${d + 0.12}s">
  <text x="${x}" y="${axisY + 32}" font-size="14.5" font-weight="700" fill="${t.text}">${esc(title)}</text>
  ${lines.map((l, k) => `<text x="${x}" y="${axisY + 52 + k * 17}" font-size="12.5" fill="${t.muted}">${esc(l)}</text>`).join("")}
</g>`;
  }).join("");
  const maxLines = Math.max(...JOURNEY.map(([, , d]) => wrap(d, 12.5, colW - 16).length));
  const H = axisY + 52 + (maxLines - 1) * 17 + 28;
  const body = `
<text x="28" y="38" font-size="11" fill="${t.muted}" class="mono fade">PERJALANAN</text>
<text x="${W - 28}" y="38" font-size="11" fill="${t.muted}" class="mono fade" text-anchor="end">2023 → SEKARANG</text>
<line x1="${x0 + 6}" y1="${axisY}" x2="${W - 28}" y2="${axisY}" stroke="${t.border}" stroke-width="1.5"/>
<line x1="${x0 + 6}" y1="${axisY}" x2="${W - 28}" y2="${axisY}" stroke="${t.accent}" stroke-width="1.5" stroke-opacity=".7" pathLength="1" stroke-dasharray="1" stroke-dashoffset="0" style="animation: draw 1.8s .2s cubic-bezier(.65,0,.35,1) backwards"/>
${nodes}`;
  return frame(W, H, t, "Perjalanan 2023 sampai sekarang", body, ART_CSS);
}

/* =========================================================
   Penutup
   ========================================================= */
function footer() {
  const W = 1200, H = 230, P = 1200;
  const waves = [];
  for (let j = 0; j < 10; j++) {
    const base = 150 + j * 9, a1 = 8 + j * 1.4, a2 = 4 + (j % 3) * 1.5, k1 = 1 + (j % 2), k2 = 3 + (j % 3), ph = j * 0.6;
    let d = "";
    for (let x = 0; x <= 2 * P; x += 12) d += (x ? " L" : "M") + x + "," + (base + a1 * Math.sin((2 * Math.PI * k1 * x) / P + ph) + a2 * Math.sin((2 * Math.PI * k2 * x) / P + ph * 1.3)).toFixed(1);
    waves.push(`<path d="${d}" fill="none" stroke="url(#wv)" stroke-width="1" stroke-opacity="${(0.12 + j * 0.05).toFixed(2)}" style="animation: ${j % 2 ? "flowB" : "flowA"} ${30 + j * 5}s linear infinite"/>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Terima kasih sudah mampir. Terbuka untuk tawaran kerja dan proyek freelance.">
<title>Terima kasih sudah mampir</title>
<defs>
  <linearGradient id="wv" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f2a03d"/><stop offset=".5" stop-color="#ff6b5a"/><stop offset="1" stop-color="#f2a03d"/></linearGradient>
  <linearGradient id="vf" x1="0" y1="0" x2="0" y2="1"><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset=".8" stop-color="#fff"/></linearGradient>
  <mask id="m"><rect width="${W}" height="${H}" fill="url(#vf)"/></mask>
  <clipPath id="card"><rect width="${W}" height="${H}" rx="20"/></clipPath>
</defs>
<style>
  text { font-family: ${SANS}; }
  .in { animation: rise 1.1s cubic-bezier(.16,1,.3,1) backwards; }
  .pulse { transform-box: fill-box; transform-origin: center; animation: pulse 2.6s cubic-bezier(.16,1,.3,1) infinite; }
  @keyframes rise { from { opacity: 0; transform: translateY(14px); } }
  @keyframes flowA { to { transform: translateX(-${P}px); } }
  @keyframes flowB { from { transform: translateX(-${P}px); } to { transform: translateX(0); } }
  @keyframes pulse { 0% { transform: scale(1); opacity: .7; } 100% { transform: scale(3.2); opacity: 0; } }
  @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
</style>
<g clip-path="url(#card)">
  <rect width="${W}" height="${H}" fill="#0f1115"/>
  <g mask="url(#m)">${waves.join("")}</g>
  <g class="in" style="animation-delay:.1s"><text x="600" y="92" font-size="38" fill="#f4efe6" text-anchor="middle" font-family="${SERIF}" font-style="italic">Terima kasih sudah mampir.</text></g>
  <g class="in" style="animation-delay:.35s">
    <circle cx="${600 - 170}" cy="128" r="4.5" fill="#7ee0a1"/>
    <text x="${600 - 156}" y="133" font-size="16" fill="#cfc7b8">Terbuka untuk tawaran kerja &amp; proyek freelance</text>
  </g>
</g>
</svg>`;
}

for (const [mode, t] of Object.entries(THEMES)) {
  for (const p of PROJECTS) fs.writeFileSync(`assets/p-${p.file}-${mode}.svg`, projectCard(p, t));
  fs.writeFileSync(`assets/journey-${mode}.svg`, timeline(t));
}
fs.writeFileSync("assets/footer.svg", footer());
console.log("ok");
