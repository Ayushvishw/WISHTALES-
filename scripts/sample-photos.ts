/** Generates the labelled sample photos used by "Watch sample" and "Use sample photos". */
import sharp from "sharp";

const G = [["#ffb88a", "#ff6f91"], ["#7fd1d8", "#2a6f97"], ["#f6d365", "#fda085"], ["#a18cd1", "#fbc2eb"], ["#84fab0", "#8fd3f4"], ["#fccb90", "#d57eeb"], ["#2b5876", "#4e4376"], ["#ff9a9e", "#fecfef"]];

for (const [i, [a, b]] of G.entries()) {
  const x = 250 + (i % 3) * 60;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="800">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
  <rect width="640" height="800" fill="url(#g)"/>
  <circle cx="${120 + i * 55}" cy="${230 + (i % 3) * 40}" r="70" fill="#fff" fill-opacity=".55"/>
  <path d="M0 800 L0 ${560 - (i % 4) * 30} Q320 ${430 + (i % 3) * 50} 640 580 L640 800 Z" fill="#000" fill-opacity=".18"/>
  <circle cx="${x}" cy="560" r="46" fill="#000" fill-opacity=".28"/><rect x="${x - 36}" y="600" width="72" height="200" fill="#000" fill-opacity=".28"/>
  ${i % 2 === 0 ? `<circle cx="${x + 120}" cy="575" r="40" fill="#000" fill-opacity=".28"/><rect x="${x + 88}" y="612" width="64" height="190" fill="#000" fill-opacity=".28"/>` : ""}
  <text x="28" y="770" font-family="sans-serif" font-size="26" font-weight="600" fill="#fff">Sample photo ${i + 1}</text></svg>`;
  await sharp(Buffer.from(svg)).webp({ quality: 80 }).toFile(`public/samples/${i + 1}.webp`);
}
console.log("Wrote public/samples/1-8.webp");
