// Palet & utilitas bersama untuk semua kartu profil.
export const THEMES = {
  dark: {
    bg: "#0f1115", border: "#262a33", text: "#ece6da", muted: "#8f8a80", faint: "#5b5850",
    accent: "#f2a03d", accent2: "#ff6b5a", track: "#1d2027", grid: "#1a1d23", chip: "#181b21",
  },
  light: {
    bg: "#fffdf9", border: "#e7e0d4", text: "#1f1b16", muted: "#6f685e", faint: "#a39b8f",
    accent: "#c26a12", accent2: "#d9482f", track: "#f2ece2", grid: "#f3eee6", chip: "#f7f2ea",
  },
};
export const SANS = "'Segoe UI', 'Helvetica Neue', Ubuntu, Arial, sans-serif";
export const SERIF = "Georgia, 'Times New Roman', serif";
export const MONO = "Consolas, 'SFMono-Regular', Menlo, 'DejaVu Sans Mono', monospace";

export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// Perkiraan lebar teks (font sistem) untuk menata chip
export function textW(s, size, bold = false) {
  let w = 0;
  for (const ch of s) {
    w += /[il.,:;'|!]/.test(ch) ? 0.27 : /[fjtrI ()&]/.test(ch) ? 0.36 : /[mwMW]/.test(ch) ? 0.86
      : /[A-Z]/.test(ch) ? 0.66 : /[0-9]/.test(ch) ? 0.56 : 0.53;
  }
  return w * size * (bold ? 1.06 : 1);
}

// Memecah teks menjadi beberapa baris sesuai lebar maksimum
export function wrap(text, size, maxW, bold = false) {
  const lines = [];
  let line = "";
  for (const w of text.split(" ")) {
    const t = line ? line + " " + w : w;
    if (textW(t, size, bold) > maxW && line) { lines.push(line); line = w; } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

export function frame(w, h, t, label, body, extraCss = "") {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">
<title>${esc(label)}</title>
<style>
  text { font-family: ${SANS}; }
  .mono { font-family: ${MONO}; letter-spacing: 2px; }
  .serif { font-family: ${SERIF}; font-style: italic; }
  /* Isi selalu tampil walau animasi tidak jalan; animasi hanya efek masuk/hidup */
  .rise { animation: rise .9s cubic-bezier(.16,1,.3,1) backwards; }
  .fade { animation: fade 1s ease-out backwards; }
  .bar { transform-box: fill-box; transform-origin: 50% 100%; animation: barUp 1.1s cubic-bezier(.16,1,.3,1) backwards; }
  .seg { transform-box: fill-box; transform-origin: 0 50%; animation: segIn .9s cubic-bezier(.16,1,.3,1) backwards; }
  @keyframes rise { from { opacity: 0; transform: translateY(10px); } }
  @keyframes fade { from { opacity: 0; } }
  @keyframes barUp { from { transform: scaleY(0); } }
  @keyframes segIn { from { transform: scaleX(0); opacity: 0; } }
  @keyframes draw { from { stroke-dashoffset: 1; } }
  ${extraCss}
  @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
</style>
<rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="14" fill="${t.bg}" stroke="${t.border}"/>
${body}
</svg>`;
}
