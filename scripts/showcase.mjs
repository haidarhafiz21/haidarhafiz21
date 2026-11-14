// Kartu proyek pilihan, linimasa perjalanan, dan penutup profil. Pakai: node scripts/showcase.mjs
// Gaya: sederhana & profesional — warna netral, satu aksen, tanpa efek cahaya.
import fs from "node:fs";
import { THEMES, SANS, SERIF, MONO, esc, wrap, frame, settle } from "./theme.mjs";

fs.mkdirSync("assets", { recursive: true });
const GREEN = { dark: "#3fb950", light: "#1a7f37" };

const CSS = `
  .pop { transform-box: fill-box; transform-origin: center; animation: pop .6s cubic-bezier(.16,1,.3,1) backwards; }
  @keyframes pop { from { opacity: 0; transform: scale(.6); } }
  /* gerak pelan tanpa efek cahaya */
  .live { animation: soft 5s 1.5s ease-in-out infinite; }
  .nudge { animation: nudge 6s 2s cubic-bezier(.45,0,.55,1) infinite; }
  @keyframes soft { 0%, 70%, 100% { opacity: 1; } 85% { opacity: .35; } }
  @keyframes nudge { 0%, 84%, 100% { transform: translate(0, 0); } 92% { transform: translate(2.5px, -2.5px); } }`;

/* =========================================================
   Kartu proyek (sederhana)
   ========================================================= */
export const PROJECTS = [
  { file: "venus", tag: "LIVE", live: true, year: "2026", title: "Venus Digital", link: "Kunjungi website",
    desc: "Toko online template Excel & produk digital: katalog, halaman produk, artikel panduan, SEO, dan pemesanan via WhatsApp.",
    tech: ["HTML", "CSS", "JavaScript", "Node.js"] },
  { file: "perpus", tag: "PROYEK AKHIR D3", year: "2026", title: "Peminjaman Buku Perpustakaan",
    desc: "Aplikasi mobile untuk Kejaksaan Negeri Sumenep: kartu anggota ber-QR, scan barcode buku, dan dashboard admin.",
    tech: ["Flutter", "Express.js", "PostgreSQL", "ML Kit"] },
  { file: "nexa", tag: "MOBILE & WEB", year: "2026", title: "Nexa · Aplikasi Kencan",
    desc: "Aplikasi kencan dengan verifikasi wajah: swipe & match, chat, lokasi GPS, moderasi laporan, dan versi web.",
    tech: ["Flutter", "Express.js", "PostgreSQL", "ML Kit"] },
  { file: "jurnal", tag: "DESKTOP & HP", year: "2026", title: "Jurnal Trading", link: "Buka aplikasi",
    desc: "Jurnal trading offline yang tersedia dalam versi desktop dan versi HP.",
    tech: ["Node.js", "SQLite"] },
  { file: "jatim", tag: "MAGANG", year: "2025", title: "JatimTIMES",
    desc: "Website portal berita yang dikerjakan saat magang di Jatim Times Network, Malang.",
    tech: ["React", "Vite", "Express.js", "Bootstrap"] },
  { file: "unfollow", tag: "LIVE", live: true, year: "2026", title: "Cek Unfollow", link: "Kunjungi website",
    desc: "Periksa siapa yang tidak follow balik di Instagram langsung dari browser, tanpa password. Bisa di komputer, Android, dan iPhone.",
    tech: ["HTML", "CSS", "JavaScript"] },
  { file: "kcm", tag: "LIVE", live: true, year: "2026", title: "KCM · Lihat dari Kursi", link: "Kunjungi website",
    desc: "Visualisasi kursi bioskop: pilih studio, ketuk kursi, lalu lihat layar dari posisi duduk lengkap dengan jarak dan sudut pandang.",
    tech: ["HTML", "CSS", "JavaScript"] },
  { file: "bisahosting", tag: "LIVE", live: true, year: "2023", title: "Bisahosting", link: "Kunjungi website",
    desc: "Proyek kelompok: website perusahaan hosting dengan halaman beranda, tentang, dan kontak.",
    tech: ["Pug", "SCSS", "HTML"] },
];

function projectCard(p, t, mode) {
  const W = 495, H = 176;
  const lines = wrap(p.desc, 12.5, W - 56).slice(0, 2);
  const tagX = p.live ? 40 : 28;
  const body = `
<g class="rise" style="animation-delay:.05s">
  ${p.live ? `<circle cx="31" cy="34" r="3.5" fill="${GREEN[mode]}" class="live"/>` : ""}
  <text x="${tagX}" y="38" font-size="10.5" fill="${p.live ? GREEN[mode] : t.muted}" class="mono">${esc(p.tag)}</text>
  <text x="${W - 28}" y="38" font-size="11" fill="${t.faint}" text-anchor="end" class="mono" style="letter-spacing:1px">${esc(p.year)}</text>
</g>
<g class="rise" style="animation-delay:.12s"><text x="28" y="70" font-size="19" font-weight="700" fill="${t.text}" letter-spacing="-.3">${esc(p.title)}</text></g>
<g class="rise" style="animation-delay:.2s">${lines.map((l, i) => `<text x="28" y="${95 + i * 18}" font-size="12.5" fill="${t.muted}">${esc(l)}</text>`).join("")}</g>
<line x1="28" y1="136" x2="${W - 28}" y2="136" stroke="${t.border}"/>
<g class="rise" style="animation-delay:.28s">
  <text x="28" y="158" font-size="12" fill="${t.muted}">${esc(p.tech.join("  ·  "))}</text>
  ${p.link
    ? `<text x="${W - 46}" y="158" font-size="12" font-weight="600" fill="${t.accent}" text-anchor="end">${esc(p.link)}</text>
  <g transform="translate(${W - 40} 148)"><path class="nudge" d="M2 10 L10 2 M4 2 H10 V8" fill="none" stroke="${t.accent}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></g>`
    : `<text x="${W - 28}" y="158" font-size="12" fill="${t.faint}" text-anchor="end">Repositori privat</text>`}
</g>`;
  return frame(W, H, t, `${p.title} — ${p.desc}`, body, CSS);
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
  // Titik kecil yang berjalan dari tahun ke tahun, berhenti sebentar di tiap tahun
  const nx = JOURNEY.map((_, i) => x0 + i * (colW + 8) + 6);
  const seg = 100 / (JOURNEY.length * 2);
  const frames = nx.map((x, i) => `${(i * 2 * seg).toFixed(1)}%, ${((i * 2 + 1) * seg + 4).toFixed(1)}% { transform: translateX(${(x - nx[0]).toFixed(1)}px); opacity: 1; }`).join(" ");
  const walker = `<style>@keyframes walk { ${frames} 100% { transform: translateX(${(nx[nx.length - 1] - nx[0]).toFixed(1)}px); opacity: 0; } }
  .walker { animation: walk 16s 2.2s cubic-bezier(.65,0,.35,1) infinite backwards; }</style>
<circle cx="${nx[0]}" cy="${axisY}" r="2.6" fill="${t.accent}" class="walker"/>`;
  const nodes = JOURNEY.map(([year, title, detail], i) => {
    const x = x0 + i * (colW + 8), d = 0.4 + i * 0.25;
    const lines = wrap(detail, 12.5, colW - 16);
    return `
<g class="rise" style="animation-delay:${d}s"><text x="${x}" y="${axisY - 20}" font-size="28" font-weight="700" fill="${t.text}" class="serif">${year}</text></g>
<circle cx="${x + 6}" cy="${axisY}" r="5" fill="${t.bg}" stroke="${t.accent}" stroke-width="2" class="pop" style="animation-delay:${d}s"/>
<g class="rise" style="animation-delay:${d + 0.1}s">
  <text x="${x}" y="${axisY + 32}" font-size="14" font-weight="700" fill="${t.text}">${esc(title)}</text>
  ${lines.map((l, k) => `<text x="${x}" y="${axisY + 52 + k * 17}" font-size="12.5" fill="${t.muted}">${esc(l)}</text>`).join("")}
</g>`;
  }).join("");
  const maxLines = Math.max(...JOURNEY.map(([, , d]) => wrap(d, 12.5, colW - 16).length));
  const H = axisY + 52 + (maxLines - 1) * 17 + 28;
  const body = `
<text x="28" y="38" font-size="11" fill="${t.muted}" class="mono fade">PERJALANAN</text>
<text x="${W - 28}" y="38" font-size="11" fill="${t.muted}" class="mono fade" text-anchor="end">2023 – SEKARANG</text>
<line x1="${x0 + 6}" y1="${axisY}" x2="${W - 28}" y2="${axisY}" stroke="${t.border}" stroke-width="1.5"/>
<line x1="${x0 + 6}" y1="${axisY}" x2="${W - 28}" y2="${axisY}" stroke="${t.accent}" stroke-width="1.5" stroke-opacity=".55" pathLength="1" stroke-dasharray="1" stroke-dashoffset="0" style="animation: draw 1.6s .2s cubic-bezier(.65,0,.35,1) backwards"/>
${nodes}
${walker}`;
  return frame(W, H, t, "Perjalanan 2023 sampai sekarang", body, CSS);
}

/* =========================================================
   Penutup
   ========================================================= */
function footer() {
  const W = 1200, H = 210, P = 1200;
  const waves = [];
  for (let j = 0; j < 10; j++) {
    const base = 140 + j * 8, a1 = 8 + j * 1.3, a2 = 4 + (j % 3) * 1.4, k1 = 1 + (j % 2), k2 = 3 + (j % 3), ph = j * 0.6;
    let d = "";
    for (let x = 0; x <= 2 * P; x += 24) d += (x ? " L" : "M") + x + "," + (base + a1 * Math.sin((2 * Math.PI * k1 * x) / P + ph) + a2 * Math.sin((2 * Math.PI * k2 * x) / P + ph * 1.3)).toFixed(1);
    waves.push(`<path d="${d}" fill="none" stroke="#8fa3bf" stroke-width="1" stroke-opacity="${(0.06 + j * 0.025).toFixed(3)}" style="animation: ${j % 2 ? "flowB" : "flowA"} ${34 + j * 5}s 1.4s linear infinite backwards"/>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Terima kasih sudah mampir. Terbuka untuk tawaran kerja dan proyek freelance.">
<title>Terima kasih sudah mampir</title>
<defs>
  <linearGradient id="bgg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0f141b"/><stop offset="1" stop-color="#17202b"/></linearGradient>
  <linearGradient id="vf" x1="0" y1="0" x2="0" y2="1"><stop offset=".3" stop-color="#121922" stop-opacity="1"/><stop offset=".78" stop-color="#121922" stop-opacity="0"/></linearGradient>
  <clipPath id="card"><rect width="${W}" height="${H}" rx="20"/></clipPath>
</defs>
<style>
  text { font-family: ${SANS}; }
  .in { animation: rise 1.1s cubic-bezier(.16,1,.3,1) backwards; }
  @keyframes rise { from { opacity: 0; transform: translateY(14px); } }
  @keyframes flowA { to { transform: translateX(-${P}px); } }
  @keyframes flowB { from { transform: translateX(-${P}px); } to { transform: translateX(0); } }
  @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
</style>
<g clip-path="url(#card)">
  <rect width="${W}" height="${H}" fill="url(#bgg)"/>
  <g>${waves.join("")}</g>
  <rect width="${W}" height="${H}" fill="url(#vf)"/>
  <g class="in" style="animation-delay:.1s"><text x="600" y="88" font-size="36" fill="#f0f3f6" text-anchor="middle" font-family="${SERIF}" font-style="italic">Terima kasih sudah mampir.</text></g>
  <g class="in" style="animation-delay:.3s">
    <circle cx="430" cy="123" r="4.5" fill="#3fb950"/>
    <text x="444" y="128" font-size="16" fill="#c3ccd6">Terbuka untuk tawaran kerja &amp; proyek freelance</text>
  </g>
</g>
</svg>`;
}

for (const [mode, t] of Object.entries(THEMES)) {
  for (const p of PROJECTS) fs.writeFileSync(`assets/p-${p.file}-${mode}.svg`, settle(projectCard(p, t, mode)));
  fs.writeFileSync(`assets/journey-${mode}.svg`, settle(timeline(t)));
}
fs.writeFileSync("assets/footer.svg", settle(footer()));
console.log("ok");
